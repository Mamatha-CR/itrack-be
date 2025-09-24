import express from "express";
import multer from "multer";
import { Op } from "sequelize";
import { rbac } from "../middleware/rbac.js";
import { Attendance } from "../models/index.js";
import { uploadBufferToS3 } from "../utils/s3.js";

export const attendanceRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024) },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\//i.test(file.mimetype);
    if (!ok) return cb(new Error("Only image uploads are allowed"));
    cb(null, true);
  },
});

function assertTechnician(req) {
  const slug = String(req.user?.role_slug || "").toLowerCase();
  if (slug !== "technician") {
    const err = new Error("Only technicians can perform attendance actions");
    err.status = 403;
    throw err;
  }
}

/**
 * @openapi
 * /attendance/check-in:
 *   post:
 *     summary: Technician check-in (bus or bike). Supports multipart upload or JSON body.
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [mode]
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [bike, bus]
 *               km:
 *                 type: integer
 *                 minimum: 0
 *                 description: Required when mode is 'bike'
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Required when mode is 'bike' (multipart)
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mode]
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [bike, bus]
 *               km:
 *                 type: integer
 *                 minimum: 0
 *                 description: Required when mode is 'bike'
 *               photoUri:
 *                 type: string
 *                 format: uri
 *                 description: Required when mode is 'bike' (JSON)
 *     responses:
 *       201:
 *         description: Created attendance record
 *       400:
 *         description: Validation error
 *       409:
 *         description: Already checked in
 */
attendanceRouter.post(
  "/check-in",
  rbac("Attendance", "add"),
  upload.single("photo"),
  async (req, res, next) => {
    try {
      assertTechnician(req);

      const userId = req.user?.sub || req.user?.user_id;
      const companyId = req.user?.company_id;
      if (!userId || !companyId) return res.status(401).json({ message: "Invalid token" });

      const mode = String(req.body.mode || "").toLowerCase();
      if (!["bike", "bus"].includes(mode))
        return res.status(400).json({ message: "mode must be 'bike' or 'bus'" });

      // prevent duplicate open attendance
      const open = await Attendance.findOne({
        where: { user_id: userId, check_out_at: null },
      });
      if (open) return res.status(409).json({ message: "Already checked in" });

      // bike validations
      let checkInKm = null;
      if (mode === "bike") {
        if (req.body.km === undefined)
          return res.status(400).json({ message: "km is required for bike mode" });
        const n = Number(req.body.km);
        if (!Number.isFinite(n) || n < 0)
          return res.status(400).json({ message: "km must be a non-negative number" });
        checkInKm = Math.floor(n);
      }

      // photo via multipart OR JSON photoUri
      let checkInPhotoUrl = null;
      if (req.file) {
        const up = await uploadBufferToS3({
          buffer: req.file.buffer,
          filename: req.file.originalname,
          contentType: req.file.mimetype,
          keyPrefix: process.env.S3_KEY_PREFIX_ATTENDANCE_IN || "uploads/attendance/checkin/",
        });
        checkInPhotoUrl = up.url;
      } else if (typeof req.body.photoUri === "string" && req.body.photoUri.trim()) {
        checkInPhotoUrl = req.body.photoUri.trim();
      }
      if (mode === "bike" && !checkInPhotoUrl) {
        return res.status(400).json({ message: "photo is required for bike mode" });
      }

      const now = new Date();
      const created = await Attendance.create({
        company_id: companyId,
        user_id: userId,
        mode,
        check_in_at: now,
        check_in_km: checkInKm,
        check_in_photo_url: checkInPhotoUrl,
      });

      return res.status(201).json(created);
    } catch (e) {
      if (String(e?.message || "").includes("image uploads are allowed")) e.status = 400;
      next(e);
    }
  }
);

/**
 * @openapi
 * /attendance/check-out:
 *   post:
 *     summary: Technician check-out. Supports multipart upload or JSON body.
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               km:
 *                 type: integer
 *                 minimum: 0
 *                 description: Required when open session mode is 'bike'
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Required when open session mode is 'bike' (multipart)
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               km:
 *                 type: integer
 *                 minimum: 0
 *                 description: Required when open session mode is 'bike'
 *               photoUri:
 *                 type: string
 *                 format: uri
 *                 description: Required when open session mode is 'bike' (JSON)
 *     responses:
 *       200:
 *         description: Updated attendance record
 *       400:
 *         description: Validation error
 *       404:
 *         description: No open attendance
 */
attendanceRouter.post(
  "/check-out",
  rbac("Attendance", "edit"),
  upload.single("photo"),
  async (req, res, next) => {
    try {
      assertTechnician(req);

      const userId = req.user?.sub || req.user?.user_id;
      const companyId = req.user?.company_id;
      if (!userId || !companyId) return res.status(401).json({ message: "Invalid token" });

      const att = await Attendance.findOne({
        where: { user_id: userId, check_out_at: null },
      });
      if (!att) return res.status(404).json({ message: "No open attendance to check out" });

      let outKm = null;
      if (att.mode === "bike") {
        if (req.body.km === undefined)
          return res.status(400).json({ message: "km is required for bike mode" });
        const n = Number(req.body.km);
        if (!Number.isFinite(n) || n < 0)
          return res.status(400).json({ message: "km must be a non-negative number" });
        outKm = Math.floor(n);
        if (att.check_in_km !== null && outKm < att.check_in_km)
          return res.status(400).json({ message: "checkout km cannot be less than check-in km" });
      }

      let outPhotoUrl = null;
      if (req.file) {
        const up = await uploadBufferToS3({
          buffer: req.file.buffer,
          filename: req.file.originalname,
          contentType: req.file.mimetype,
          keyPrefix: process.env.S3_KEY_PREFIX_ATTENDANCE_OUT || "uploads/attendance/checkout/",
        });
        outPhotoUrl = up.url;
      } else if (typeof req.body.photoUri === "string" && req.body.photoUri.trim()) {
        outPhotoUrl = req.body.photoUri.trim();
      }
      if (att.mode === "bike" && !outPhotoUrl) {
        return res.status(400).json({ message: "photo is required for bike mode" });
      }

      const now = new Date();
      const totalMinutes = Math.max(
        0,
        Math.floor((now.getTime() - new Date(att.check_in_at).getTime()) / 60000)
      );

      await att.update({
        check_out_at: now,
        check_out_km: outKm,
        check_out_photo_url: outPhotoUrl,
        total_minutes: totalMinutes,
      });

      return res.json(att);
    } catch (e) {
      if (String(e?.message || "").includes("image uploads are allowed")) e.status = 400;
      next(e);
    }
  }
);

/**
 * @openapi
 * /attendance/today:
 *   get:
 *     summary: Get today's attendance for the logged-in technician
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         description: Defaults to server local date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Attendance for the requested day (or empty object)
 */
attendanceRouter.get("/today", rbac("Attendance", "view"), async (req, res, next) => {
  try {
    assertTechnician(req);

    const userId = req.user?.sub || req.user?.user_id;
    if (!userId) return res.status(401).json({ message: "Invalid token" });

    const base = req.query.date ? new Date(String(req.query.date)) : new Date();
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const end = new Date(base);
    end.setHours(23, 59, 59, 999);

    const rec = await Attendance.findOne({
      where: {
        user_id: userId,
        check_in_at: { [Op.gte]: start, [Op.lte]: end },
      },
      order: [["check_in_at", "DESC"]],
    });

    return res.json(rec || {});
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /attendance/attendances:
 *   get:
 *     summary: List attendance records
 *     description: Technicians see their own records. Other roles are scoped by company; super_admin can filter any user.
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema: { type: string, format: uuid }
 *         description: Optional filter (ignored for technicians)
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Attendance records
 */
attendanceRouter.get("/attendances", rbac("Attendance", "view"), async (req, res, next) => {
  try {
    const role = String(req.user?.role_slug || "").toLowerCase();
    const actorId = req.user?.sub || req.user?.user_id;
    const where = {};

    if (role === "technician") {
      where.user_id = actorId;
    } else if (role === "super_admin") {
      if (req.query.user_id) where.user_id = String(req.query.user_id);
    } else {
      where.company_id = req.user?.company_id;
      if (req.query.user_id) where.user_id = String(req.query.user_id);
    }

    if (req.query.from || req.query.to) {
      where.check_in_at = {};
      if (req.query.from) where.check_in_at[Op.gte] = new Date(req.query.from);
      if (req.query.to) where.check_in_at[Op.lte] = new Date(req.query.to);
    }

    const rows = await Attendance.findAll({
      where,
      order: [["check_in_at", "DESC"]],
    });

    const withHours = rows.map((r) => {
      const o = r.toJSON();
      const mins = Number(o.total_minutes || 0);
      o.total_hours = Math.floor(mins / 60) + (mins % 60) / 60;
      return o;
    });

    return res.json({ data: withHours });
  } catch (e) {
    next(e);
  }
});

// Backward-compatible alias for the misspelling
attendanceRouter.get("/attandances", (req, res) => res.redirect(301, "/attendance/attendances"));
