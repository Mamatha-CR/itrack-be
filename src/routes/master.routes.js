// src/routes/master.routes.js
import express from "express";
import {
  NatureOfWork,
  JobStatus,
  SubscriptionType,
  BusinessType,
  WorkType,
  JobType,
  Region,
  Shift,
  Role,
  Screen,
  RoleScreenPermission,
} from "../models/index.js";
import { rbac } from "../middleware/rbac.js";
import { Sequelize } from "sequelize";
import { buildCrudRoutes } from "../utils/crudFactory.js";
import { Op } from "sequelize";

export const masterRouter = express.Router();

/* ---------- Nature of Work (under Settings) ---------- */
masterRouter.use(
  "/nature-of-work",
  buildCrudRoutes({
    model: NatureOfWork,
    screen: "Settings",
    searchFields: ["now_name"],
    exactFields: ["now_status"],
    statusFieldName: "now_status",
    normalize: (body) => {
      if (typeof body.now_name === "string") body.now_name = body.now_name.trim();
    },
    findExistingWhere: (req) => ({
      now_name: (req.body.now_name || "").trim(),
    }),
  })
);

/* ---------- Job Statuses (under Manage Job) ---------- */
// Ordered list endpoint (ASC by job_status_order)
masterRouter.get(
  "/job-statuses/ordered",
  rbac("Manage Job", "view"),
  async (req, res, next) => {
    try {
      const rows = await JobStatus.findAll({ where: { status: true } });
      const normalize = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      const desiredOrder = {
        notstarted: 1,
        assignedtech: 2,
        enroute: 3,
        onsite: 4,
        onhold: 5,
        onresume: 6,
        completed: 7,
        cancelled: 8,
        unresolved: 9,
        // reject is outside main flow
        rejected: 99,
      };

      // Self-heal missing orders
      for (const r of rows) {
        const key = normalize(r.job_status_title);
        const ord = desiredOrder[key];
        if (ord && r.job_status_order !== ord) {
          await r.update({ job_status_order: ord });
        }
      }

      const sorted = rows
        .map((r) => ({ row: r, key: normalize(r.job_status_title) }))
        .sort((a, b) => (a.row.job_status_order || desiredOrder[a.key] || 999) - (b.row.job_status_order || desiredOrder[b.key] || 999))
        .map(({ row, key }) => ({
          job_status_id: row.job_status_id,
          job_status_title: row.job_status_title,
          job_status_color_code: row.job_status_color_code,
          job_status_order: row.job_status_order ?? desiredOrder[key] ?? null,
          order: row.job_status_order ?? desiredOrder[key] ?? null,
          key,
        }));

      return res.json({ data: sorted });
    } catch (e) {
      return next(e);
    }
  }
);
masterRouter.use(
  "/job-statuses",
  buildCrudRoutes({
    model: JobStatus,
    screen: "Manage Job",
    searchFields: ["job_status_title"],
    exactFields: ["status"],
    statusFieldName: "status",
    normalize: (body) => {
      if (typeof body.job_status_title === "string")
        body.job_status_title = body.job_status_title.trim();
    },
    findExistingWhere: (req) => ({
      job_status_title: (req.body.job_status_title || "").trim(),
    }),
  })
);

/* ---------- Subscription Types (under Settings) ---------- */
masterRouter.use(
  "/subscription-types",
  buildCrudRoutes({
    model: SubscriptionType,
    screen: "Settings",
    searchFields: ["subscription_title"],
    exactFields: ["subscription_status"],
    statusFieldName: "subscription_status",
    normalize: (body) => {
      if (typeof body.subscription_title === "string")
        body.subscription_title = body.subscription_title.trim();
    },
    findExistingWhere: (req) => ({
      subscription_title: (req.body.subscription_title || "").trim(),
    }),
  })
);

/* ---------- Business Types (under Settings) ---------- */
masterRouter.use(
  "/business-types",
  buildCrudRoutes({
    model: BusinessType,
    screen: "Settings",
    searchFields: ["business_typeName"],
    exactFields: ["status"],
    statusFieldName: "status",
    normalize: (body) => {
      if (typeof body.business_typeName === "string")
        body.business_typeName = body.business_typeName.trim();
    },
    findExistingWhere: (req) => ({
      business_typeName: (req.body.business_typeName || "").trim(),
    }),
  })
);

/* ---------- Work Types (org-scoped) ---------- */
masterRouter.use(
  "/work-types",
  buildCrudRoutes({
    model: WorkType,
    screen: "Work Type",
    searchFields: ["worktype_name", "worktype_description"],
    exactFields: ["status", "company_id"], // super_admin can filter; org users auto-scoped
    statusFieldName: "status",
    normalize: (body) => {
      if (typeof body.worktype_name === "string") body.worktype_name = body.worktype_name.trim();
    },
    findExistingWhere: (req) => ({
      company_id: req.user?.role_slug !== "super_admin" ? req.user.company_id : req.body.company_id,
      worktype_name: (req.body.worktype_name || "").trim(),
    }),
  })
);

/* ---------- Job Types (org-scoped) ---------- */
masterRouter.use(
  "/job-types",
  buildCrudRoutes({
    model: JobType,
    screen: "Job Type",
    searchFields: ["jobtype_name", "description"],
    exactFields: ["status", "company_id", "worktype_id"],
    statusFieldName: "status",
    normalize: (body) => {
      if (typeof body.jobtype_name === "string") body.jobtype_name = body.jobtype_name.trim();
    },
    findExistingWhere: (req) => ({
      company_id: req.user?.role_slug !== "super_admin" ? req.user.company_id : req.body.company_id,
      worktype_id: req.body.worktype_id,
      jobtype_name: (req.body.jobtype_name || "").trim(),
    }),
  })
);

/* ---------- Regions (org-scoped) ---------- */
masterRouter.use(
  "/regions",
  buildCrudRoutes({
    model: Region,
    screen: "Region",
    searchFields: ["region_name"],
    exactFields: ["status", "company_id", "country_id", "state_id", "district_id"],
    statusFieldName: "status",
    normalize: (body) => {
      if (typeof body.region_name === "string") body.region_name = body.region_name.trim();
      if (Array.isArray(body.pincodes)) {
        body.pincodes = body.pincodes
          .map((p) => String(p).replace(/\s+/g, "").toUpperCase())
          .filter((p) => p);
      }
    },
    findExistingWhere: (req) => ({
      company_id: req.user?.role_slug !== "super_admin" ? req.user.company_id : req.body.company_id,
      region_name: (req.body.region_name || "").trim(),
    }),
    // Ensure pincodes are not mapped to multiple regions (global uniqueness)
    preCreate: async (_req, body) => {
      if (Array.isArray(body.pincodes) && body.pincodes.length) {
        const cleaned = body.pincodes.map((p) => String(p).replace(/\s+/g, "").toUpperCase());
        const regions = await Region.findAll({ attributes: ["region_id", "region_name", "pincodes"], raw: true });
        const used = new Set();
        for (const r of regions) {
          for (const p of r.pincodes || []) {
            const norm = String(p).replace(/\s+/g, "").toUpperCase();
            if (norm) used.add(norm);
          }
        }
        const conflicts = cleaned.filter((p) => used.has(p));
        if (conflicts.length) {
          const err = new Error(`Pincodes already mapped to a region: ${conflicts.join(", ")}`);
          err.status = 400;
          throw err;
        }
      }
    },
    preUpdate: async (_req, body, row) => {
      if (Array.isArray(body.pincodes) && body.pincodes.length) {
        const cleaned = body.pincodes.map((p) => String(p).replace(/\s+/g, "").toUpperCase());
        const regions = await Region.findAll({ attributes: ["region_id", "region_name", "pincodes"], raw: true });
        const used = new Set();
        for (const r of regions) {
          if (r.region_id === row.region_id) continue; // exclude self
          for (const p of r.pincodes || []) {
            const norm = String(p).replace(/\s+/g, "").toUpperCase();
            if (norm) used.add(norm);
          }
        }
        const conflicts = cleaned.filter((p) => used.has(p));
        if (conflicts.length) {
          const err = new Error(`Pincodes already mapped to a region: ${conflicts.join(", ")}`);
          err.status = 400;
          throw err;
        }
      }
    },
  })
);

/* ---------- Shifts (org-scoped) ---------- */
masterRouter.use(
  "/shifts",
  buildCrudRoutes({
    model: Shift,
    screen: "Shift",
    searchFields: ["shift_name", "description"],
    exactFields: ["status", "company_id"],
    statusFieldName: "status",
    normalize: (body) => {
      if (typeof body.shift_name === "string") body.shift_name = body.shift_name.trim();
      if (typeof body.shift_startTime === "string")
        body.shift_startTime = body.shift_startTime.trim();
      if (typeof body.shift_endTime === "string") body.shift_endTime = body.shift_endTime.trim();
    },
    findExistingWhere: (req) => ({
      company_id: req.user?.role_slug !== "super_admin" ? req.user.company_id : req.body.company_id,
      shift_name: (req.body.shift_name || "").trim(),
      shift_startTime: (req.body.shift_startTime || "").trim(),
      shift_endTime: (req.body.shift_endTime || "").trim(),
    }),
  })
);

/* ---------- Roles (global) ---------- */
masterRouter.use(
  "/roles",
  buildCrudRoutes({
    model: Role,
    screen: "Roles",
    searchFields: ["role_name", "role_slug"],
    exactFields: ["status"],
    statusFieldName: "status",
    normalize: (body) => {
      if (typeof body.role_name === "string") body.role_name = body.role_name.trim();
      if (typeof body.role_slug === "string") body.role_slug = body.role_slug.trim().toLowerCase();
    },
    findExistingWhere: (req) => ({
      role_slug: (req.body.role_slug || "").trim().toLowerCase(),
    }),
    listWhere: (req) => {
      const actor = req.user?.role_slug;

      // map of who can assign what
      const allow = {
        super_admin: null, // all
        company_admin: ["vendor", "supervisor", "technician"],
        vendor: ["supervisor", "technician"],
        supervisor: ["technician"],
        technician: [], // none
      };

      const slugs = allow[actor];
      if (!slugs) return {}; // super_admin → no extra filter (see all)
      return slugs.length
        ? { role_slug: { [Op.in]: slugs } }
        : { role_slug: { [Op.in]: ["__none__"] } }; // return empty for technicians
    },
  })
);

/* ---------- Screens list ---------- */
masterRouter.get("/screens", rbac("Roles", "view"), async (_req, res, next) => {
  try {
    const rows = await Screen.findAll({ order: [["name", "ASC"]] });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/* ---------- Role ↔ Screen permissions upsert ---------- */
masterRouter.put(
  "/roles/:role_id/screens/:screen_id",
  rbac("Roles", "edit"),
  async (req, res, next) => {
    try {
      const { role_id, screen_id } = req.params;
      const payload = {
        can_view: !!req.body.can_view,
        can_add: !!req.body.can_add,
        can_edit: !!req.body.can_edit,
        can_delete: !!req.body.can_delete,
      };
      const [row, created] = await RoleScreenPermission.findOrCreate({
        where: { role_id, screen_id },
        defaults: payload,
      });
      if (!created) await row.update(payload);
      res.json(row);
    } catch (e) {
      next(e);
    }
  }
);
