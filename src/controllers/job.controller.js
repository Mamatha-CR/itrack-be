// src/routes/job.routes.js
import express from "express";
import { rbac } from "../middleware/rbac.js";
import { parseListQuery } from "../middleware/pagination.js";
import { applyOrgScope } from "../middleware/orgScope.js";
import { buildWhere } from "../utils/filters.js";
import { Op } from "sequelize";
import {
  Job,
  Client,
  User,
  WorkType,
  JobType,
  NatureOfWork,
  JobStatus,
  JobStatusHistory,
} from "../models/index.js";

export const jobRouter = express.Router();

/**
 * GET /jobs
 * Query params supported:
 * - searchParam                (fuzzy)    -> on reference_number (add more if your schema has them)
 * - client_id, worktype_id, jobtype_id, supervisor_id, technician_id, now_id, job_status_id (exact)
 * - from, to                   (ISO date) -> filters scheduledDateAndTime between [from, to]
 * - page, limit, sortBy, order
 */
jobRouter.get(
  "/",
  rbac("Manage Job", "view"),
  parseListQuery,
  applyOrgScope,
  async (req, res, next) => {
    try {
      const { limit, offset, sortBy, order, page } = req.listQuery;

      // Fuzzy fields: keep conservative (reference_number exists for sure)
      const searchFields = ["reference_number"];
      const exactFields = [
        "client_id",
        "worktype_id",
        "jobtype_id",
        "supervisor_id",
        "technician_id",
        "now_id",
        "job_status_id",
      ];

      const whereBase = buildWhere(req.query, searchFields, exactFields);

      // Date range on scheduledDateAndTime
      if (req.query.from || req.query.to) {
        whereBase.scheduledDateAndTime = {};
        if (req.query.from) whereBase.scheduledDateAndTime[Op.gte] = new Date(req.query.from);
        if (req.query.to) whereBase.scheduledDateAndTime[Op.lte] = new Date(req.query.to);
      }

      const where = { ...whereBase, ...(req.scopeWhere || {}) };

      // Safe sort fallback
      const attrs = Job.getAttributes ? Job.getAttributes() : {};
      const safeSort = attrs?.[sortBy]
        ? sortBy
        : attrs?.createdAt
          ? "createdAt"
          : Object.keys(attrs)[0];

      const { rows, count } = await Job.findAndCountAll({
        where,
        limit,
        offset,
        order: [[safeSort, order]],
        include: [
          { model: Client },
          { model: User, as: "technician" },
          { model: User, as: "supervisor" },
          { model: WorkType },
          { model: JobType },
          { model: NatureOfWork },
          { model: JobStatus, as: "job_status" },
        ],
      });

      res.json({ data: rows, page, limit, total: count });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * POST /jobs
 * - Org scoping: non-super_admin company_id is forced from token.
 * - reference_number auto-generated if absent.
 * - Creates a JobStatusHistory entry when an initial job_status_id is provided.
 */
jobRouter.post("/", rbac("Manage Job", "add"), applyOrgScope, async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (req.user?.role_slug !== "super_admin") body.company_id = req.user.company_id;

    if (!body.reference_number) {
      body.reference_number = `JOB-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;
    }

    const created = await Job.create(body);

    if (created.job_status_id) {
      await JobStatusHistory.create({
        job_id: created.job_id,
        job_status_id: created.job_status_id,
        is_completed: false,
      });
    }

    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /jobs/:id
 * Returns the job plus a normalized status history timeline.
 */
jobRouter.get("/:id", rbac("Manage Job", "view"), applyOrgScope, async (req, res, next) => {
  try {
    const job = await Job.findOne({
      where: { job_id: req.params.id, ...(req.scopeWhere || {}) },
      include: [
        { model: Client },
        { model: User, as: "technician" },
        { model: User, as: "supervisor" },
        { model: WorkType },
        { model: JobType },
        { model: NatureOfWork },
        { model: JobStatus, as: "job_status" },
      ],
    });

    if (!job) return res.status(404).json({ message: "Not found" });

    const history = await JobStatusHistory.findAll({
      where: { job_id: job.job_id },
      include: [{ model: JobStatus }],
      order: [["createdAt", "ASC"]],
    });

    res.json({
      job,
      status_history: history.map((h) => ({
        id: h.id,
        job_status_id: h.job_status_id,
        job_status_title: h.JobStatus?.job_status_title,
        is_completed: h.is_completed,
        at: h.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /jobs/:id
 * - Updates job fields.
 * - If job_status_id changes, appends a new JobStatusHistory row.
 */
jobRouter.put("/:id", rbac("Manage Job", "edit"), applyOrgScope, async (req, res, next) => {
  try {
    const job = await Job.findOne({
      where: { job_id: req.params.id, ...(req.scopeWhere || {}) },
    });
    if (!job) return res.status(404).json({ message: "Not found" });

    const prevStatus = job.job_status_id;
    await job.update(req.body);

    if (req.body.job_status_id && req.body.job_status_id !== prevStatus) {
      await JobStatusHistory.create({
        job_id: job.job_id,
        job_status_id: req.body.job_status_id,
        is_completed: false,
      });
    }

    res.json(job);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /jobs/:id
 */
jobRouter.delete("/:id", rbac("Manage Job", "delete"), applyOrgScope, async (req, res, next) => {
  try {
    const job = await Job.findOne({
      where: { job_id: req.params.id, ...(req.scopeWhere || {}) },
    });
    if (!job) return res.status(404).json({ message: "Not found" });

    await job.destroy();
    res.json({ message: "Deleted" });
  } catch (e) {
    next(e);
  }
});
