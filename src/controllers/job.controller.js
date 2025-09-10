// src/routes/job.routes.js
import express from "express";
import { rbac } from "../middleware/rbac.js";
import { parseListQuery } from "../middleware/pagination.js";
import { applyOrgScope } from "../middleware/orgScope.js";
import { buildWhere } from "../utils/filters.js";
import { Op, Sequelize } from "sequelize";
import { sequelize } from "../config/database.js";
import {
  Job,
  Client,
  User,
  WorkType,
  JobType,
  NatureOfWork,
  JobStatus,
  JobStatusHistory,
  Role,
  Region,
} from "../models/index.js";

export const jobRouter = express.Router();

// Table description cache and helpers to avoid undefined-column errors
let jobTableDesc = null;
async function getJobTableDesc() {
  if (jobTableDesc) return jobTableDesc;
  try {
    jobTableDesc = await sequelize.getQueryInterface().describeTable("Job");
  } catch {
    jobTableDesc = {};
  }
  return jobTableDesc;
}
async function getJobColumnAvailability() {
  const desc = await getJobTableDesc();
  return {
    estimated_days: !!desc.estimated_days,
    estimated_hours: !!desc.estimated_hours,
    estimated_minutes: !!desc.estimated_minutes,
  };
}
async function getJobAttributesList() {
  const desc = await getJobTableDesc();
  const keys = Object.keys(desc || {});
  return keys.length ? keys : undefined; // undefined lets Sequelize default
}

// Ensure days/hours/minutes are present on a job-like object using estimated_duration
function ensureGranularDurationFields(obj) {
  const hasD = Number.isFinite(Number(obj?.estimated_days));
  const hasH = Number.isFinite(Number(obj?.estimated_hours));
  const hasM = Number.isFinite(Number(obj?.estimated_minutes));
  const total = Number(obj?.estimated_duration);
  if ((!hasD || !hasH || !hasM) && Number.isFinite(total)) {
    const d = Math.floor(total / (24 * 60));
    const h = Math.floor((total % (24 * 60)) / 60);
    const m = Math.floor(total % 60);
    if (!hasD) obj.estimated_days = d;
    if (!hasH) obj.estimated_hours = h;
    if (!hasM) obj.estimated_minutes = m;
  }
  return obj;
}

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

      // Additional text filters: client name, assignee name, region name
      const clientName = String(req.query.client_name || "").trim().toLowerCase();
      const assigneeName = String(req.query.assignee_name || "").trim().toLowerCase();
      const regionName = String(req.query.region || "").trim().toLowerCase();

      // Date range on scheduledDateAndTime
      if (req.query.from || req.query.to) {
        whereBase.scheduledDateAndTime = {};
        if (req.query.from) whereBase.scheduledDateAndTime[Op.gte] = new Date(req.query.from);
        if (req.query.to) whereBase.scheduledDateAndTime[Op.lte] = new Date(req.query.to);
      }

      const andConds = [];
      // Restrict technicians to only their assigned or supervised jobs (based on token)
      const roleSlug = String(req.user?.role_slug || "").trim().toLowerCase();
      if (roleSlug === "technician") {
        const actorId = req.user?.sub || req.user?.user_id;
        if (actorId) {
          andConds.push({
            [Op.or]: [
              { technician_id: actorId },
              { supervisor_id: actorId },
            ],
          });
        }
      }
      if (clientName) {
        andConds.push({
          [Op.or]: [
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("client.firstName")), {
              [Op.like]: `%${clientName}%`,
            }),
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("client.lastName")), {
              [Op.like]: `%${clientName}%`,
            }),
          ],
        });
      }

      if (assigneeName) {
        andConds.push({
          [Op.or]: [
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("technician.name")), {
              [Op.like]: `%${assigneeName}%`,
            }),
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("supervisor.name")), {
              [Op.like]: `%${assigneeName}%`,
            }),
          ],
        });
      }

      // Region filter by name -> resolve to region_ids then filter technician/supervisor.region_id
      if (regionName) {
        try {
          const regions = await Region.findAll({
            where: Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("region_name")), {
              [Op.like]: `%${regionName}%`,
            }),
            attributes: ["region_id"],
          });
          const regionIds = regions.map((r) => r.region_id);
          if (regionIds.length) {
            andConds.push({
              [Op.or]: [
                Sequelize.where(Sequelize.col("technician.region_id"), { [Op.in]: regionIds }),
                Sequelize.where(Sequelize.col("supervisor.region_id"), { [Op.in]: regionIds }),
              ],
            });
          } else {
            // No matching regions -> force empty result
            andConds.push({ job_id: null });
          }
        } catch {
          /* ignore region filter errors */
        }
      }

      // Exact ID filters from FE (assignee_id -> match either technician or supervisor)
      if (req.query.assignee_id) {
        andConds.push({
          [Op.or]: [
            { technician_id: req.query.assignee_id },
            { supervisor_id: req.query.assignee_id },
          ],
        });
      }

      if (req.query.region_id) {
        andConds.push({
          [Op.or]: [
            Sequelize.where(Sequelize.col("technician.region_id"), req.query.region_id),
            Sequelize.where(Sequelize.col("supervisor.region_id"), req.query.region_id),
          ],
        });
      }

      // Safe sort fallback
      const attrs = Job.getAttributes ? Job.getAttributes() : {};
      const safeSort = attrs?.[sortBy]
        ? sortBy
        : attrs?.createdAt
          ? "createdAt"
          : Object.keys(attrs)[0];

      const where = { ...whereBase, ...(req.scopeWhere || {}), ...(andConds.length ? { [Op.and]: andConds } : {}) };

      const include = [
        { model: Client, as: "client" },
        { model: User, as: "technician", attributes: { exclude: ["password"] } },
        { model: User, as: "supervisor", attributes: { exclude: ["password"] } },
        { model: WorkType, as: "work_type" },
        { model: JobType, as: "job_type" },
        { model: NatureOfWork, as: "nature_of_work" },
        { model: JobStatus, as: "job_status" },
      ];

      const jobAttrs = await getJobAttributesList();
      const { rows, count } = await Job.findAndCountAll({
        where,
        limit,
        offset,
        order: [[safeSort, order]],
        include,
        attributes: jobAttrs,
      });

      const data = rows.map((r) => {
        const o = r?.toJSON ? r.toJSON() : r;
        ensureGranularDurationFields(o);
        if (o?.technician) delete o.technician.password;
        if (o?.supervisor) delete o.supervisor.password;
        return o;
      });

      res.json({ data, page, limit, total: count });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /jobs/summary:
 *   get:
 *     summary: Summary counts of jobs for the logged-in context
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 yet_to_accept:
 *                   type: integer
 *                   description: Jobs with status Not Started
 *                 total_jobs:
 *                   type: integer
 *                   description: Jobs with status Assigned Tech
 *                 completed:
 *                   type: integer
 *                   description: Jobs with status Completed
 *                 panding:
 *                   type: integer
 *                   description: Jobs with status EnRoute, OnSite, or OnHold
 */
jobRouter.get(
  "/summary",
  rbac("Manage Job", "view"),
  applyOrgScope,
  async (req, res, next) => {
    try {
      const roleSlug = String(req.user?.role_slug || "").trim().toLowerCase();
      const actorId = req.user?.sub || req.user?.user_id;

      // Map status titles -> IDs
      const statuses = await JobStatus.findAll({ where: { status: true } });
      const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      const idByKey = Object.fromEntries(statuses.map((s) => [norm(s.job_status_title), s.job_status_id]));

      const notStartedId = idByKey["notstarted"];
      const completedId = idByKey["completed"];
      const cancelledId = idByKey["cancelled"];
      const rejectedId = idByKey["rejected"];
      const assignedTechId = idByKey["assignedtech"];
      const pandingSet = [idByKey["enroute"], idByKey["onsite"], idByKey["onhold"]].filter(Boolean);

      // Base where respecting org scope
      const baseWhere = { ...(req.scopeWhere || {}) };
      // Restrict technicians to their assigned/supervised jobs
      if (roleSlug === "technician" && actorId) {
        baseWhere[Op.or] = [{ technician_id: actorId }, { supervisor_id: actorId }];
      }

      // yet_to_accept: Not Started
      const yetToAccept = notStartedId
        ? await Job.count({ where: { ...baseWhere, job_status_id: notStartedId } })
        : 0;

      // completed: Completed
      const completed = completedId
        ? await Job.count({ where: { ...baseWhere, job_status_id: completedId } })
        : 0;

      // total_jobs: Assigned Tech
      const total_jobs = assignedTechId
        ? await Job.count({ where: { ...baseWhere, job_status_id: assignedTechId } })
        : 0;

      // panding: EnRoute, OnSite, OnHold
      const panding = pandingSet.length
        ? await Job.count({ where: { ...baseWhere, job_status_id: { [Op.in]: pandingSet } } })
        : 0;

      // overdue: scheduledDateAndTime < now and not in terminal statuses Completed/Cancelled/Rejected
      const now = new Date();
      const excludeSet = [completedId, cancelledId, rejectedId].filter(Boolean);
      const overdue = await Job.count({
        where: {
          ...baseWhere,
          scheduledDateAndTime: { [Op.lt]: now },
          ...(excludeSet.length ? { job_status_id: { [Op.notIn]: excludeSet } } : {}),
        },
      });

      res.json({ yet_to_accept: yetToAccept, total_jobs, completed, panding, overdue });
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
    const companyId = body.company_id;

    // Require assignment to a technician and supervisor on create
    if (!body.technician_id) {
      const err = new Error("technician_id is required to create a job");
      err.status = 400;
      throw err;
    }
    if (!body.supervisor_id) {
      const err = new Error("supervisor_id is required to create a job");
      err.status = 400;
      throw err;
    }

    // Validate technician exists in same company and has technician role
    const technician = await User.findOne({ where: { user_id: body.technician_id, company_id: companyId } });
    if (!technician) {
      const err = new Error("technician_id does not exist or is not in the same company");
      err.status = 400;
      throw err;
    }
    if (technician.role_id) {
      const tRole = await Role.findOne({ where: { role_id: technician.role_id } });
      if (!tRole || String(tRole.role_slug || "").toLowerCase() !== "technician") {
        const err = new Error("technician_id must belong to a user with technician role");
        err.status = 400;
        throw err;
      }
    }

    // Validate supervisor exists in same company and has supervisor role
    const supervisor = await User.findOne({ where: { user_id: body.supervisor_id, company_id: companyId } });
    if (!supervisor) {
      const err = new Error("supervisor_id does not exist or is not in the same company");
      err.status = 400;
      throw err;
    }
    if (supervisor.role_id) {
      const sRole = await Role.findOne({ where: { role_id: supervisor.role_id } });
      if (!sRole || String(sRole.role_slug || "").toLowerCase() !== "supervisor") {
        const err = new Error("supervisor_id must belong to a user with supervisor role");
        err.status = 400;
        throw err;
      }
    }

    if (!body.reference_number) {
      body.reference_number = `JOB-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;
    }

    // Default initial job status to "Not Started" if not provided
    if (!body.job_status_id) {
      try {
        const notStarted = await JobStatus.findOne({
          where: {
            status: true,
            [Op.and]: [
              Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("job_status_title")),
                "not started"
              ),
            ],
          },
        });
        if (notStarted) body.job_status_id = notStarted.job_status_id;
      } catch {
        /* ignore defaulting errors */
      }
    }

    // Normalize estimated duration: accept either (days/hours/minutes) or total minutes
    const hasGranular = ["estimated_days", "estimated_hours", "estimated_minutes"].some(
      (k) => body[k] !== undefined && body[k] !== null
    );

    if (hasGranular) {
      const d = Number.isFinite(Number(body.estimated_days)) ? Number(body.estimated_days) : 0;
      const h = Number.isFinite(Number(body.estimated_hours)) ? Number(body.estimated_hours) : 0;
      const m = Number.isFinite(Number(body.estimated_minutes)) ? Number(body.estimated_minutes) : 0;

      if (d < 0 || h < 0 || m < 0 || !Number.isInteger(d) || !Number.isInteger(h) || !Number.isInteger(m)) {
        const err = new Error("estimated_days/hours/minutes must be non-negative integers");
        err.status = 400;
        throw err;
      }
      if (h > 23 || m > 59) {
        const err = new Error("estimated_hours must be 0-23 and estimated_minutes 0-59");
        err.status = 400;
        throw err;
      }
      body.estimated_days = d;
      body.estimated_hours = h;
      body.estimated_minutes = m;
      body.estimated_duration = d * 24 * 60 + h * 60 + m;
    } else if (body.estimated_duration !== undefined && body.estimated_duration !== null) {
      const total = Number(body.estimated_duration);
      if (!Number.isFinite(total) || total < 0) {
        const err = new Error("estimated_duration must be a non-negative number of minutes");
        err.status = 400;
        throw err;
      }
      const d = Math.floor(total / (24 * 60));
      const h = Math.floor((total % (24 * 60)) / 60);
      const m = Math.floor(total % 60);
      body.estimated_days = d;
      body.estimated_hours = h;
      body.estimated_minutes = m;
      body.estimated_duration = Math.floor(total);
    }

    // Drop granular fields if DB columns are not available yet
    const avail = await getJobColumnAvailability();
    if (!avail.estimated_days) delete body.estimated_days;
    if (!avail.estimated_hours) delete body.estimated_hours;
    if (!avail.estimated_minutes) delete body.estimated_minutes;

    const created = await Job.create(body, { returning: false });

    // Reload with only existing columns to avoid undefined-column errors
    const jobAttrs = await getJobAttributesList();
    const createdFresh = await Job.findOne({
      where: { job_id: created.job_id },
      attributes: jobAttrs,
    });

    if (created.job_status_id) {
      await JobStatusHistory.create({
        job_id: created.job_id,
        job_status_id: created.job_status_id,
        is_completed: false,
      });
    }

    res.status(201).json(createdFresh || created);
  } catch (e) {
    next(e);
  }
});

// moved earlier above the ":id" route to avoid param capture

/**
 * GET /jobs/:id
 * Returns the job plus a normalized status history timeline.
 */
jobRouter.get("/:id", rbac("Manage Job", "view"), applyOrgScope, async (req, res, next) => {
  try {
    const jobAttrs = await getJobAttributesList();
    const job = await Job.findOne({
      where: { job_id: req.params.id, ...(req.scopeWhere || {}) },
      attributes: jobAttrs,
      include: [
        { model: Client, as: "client" },
        { model: User, as: "technician", attributes: { exclude: ["password"] } },
        { model: User, as: "supervisor", attributes: { exclude: ["password"] } },
        { model: WorkType, as: "work_type" },
        { model: JobType, as: "job_type" },
        { model: NatureOfWork, as: "nature_of_work" },
        { model: JobStatus, as: "job_status" },
      ],
    });

    if (!job) return res.status(404).json({ message: "Not found" });

    const history = await JobStatusHistory.findAll({
      where: { job_id: job.job_id },
      include: [{ model: JobStatus }],
      order: [["createdAt", "ASC"]],
    });

    const jobPlain = job?.toJSON ? job.toJSON() : job;
    ensureGranularDurationFields(jobPlain);
    // Build actions based on current status
    const allStatuses = await JobStatus.findAll({ where: { status: true } });
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    const byKey = Object.fromEntries(allStatuses.map((s) => [norm(s.job_status_title), s]));
    const currentKey = norm(jobPlain?.job_status?.job_status_title);

    const actions = [];
    // Accept/Reject from Not Started
    if (currentKey === "notstarted") {
      if (byKey["assignedtech"]) actions.push({ action: "accept", to_status_id: byKey["assignedtech"].job_status_id, to_status_title: byKey["assignedtech"].job_status_title });
      if (byKey["rejected"]) actions.push({ action: "reject", to_status_id: byKey["rejected"].job_status_id, to_status_title: byKey["rejected"].job_status_title });
    } else {
      // After assignment
      const next = ["enroute", "onsite", "completed", "unresolved"];
      for (const k of next) {
        if (byKey[k]) actions.push({ action: k, to_status_id: byKey[k].job_status_id, to_status_title: byKey[k].job_status_title });
      }
      // Toggle hold/resume
      if (currentKey === "onhold") {
        if (byKey["onresume"]) actions.push({ action: "resume", to_status_id: byKey["onresume"].job_status_id, to_status_title: byKey["onresume"].job_status_title });
      } else {
        if (byKey["onhold"]) actions.push({ action: "onhold", to_status_id: byKey["onhold"].job_status_id, to_status_title: byKey["onhold"].job_status_title });
      }
    }

    // Single object with embedded status_history and available actions
    const response = {
      ...jobPlain,
      status_history: history.map((h) => ({
        id: h.id,
        job_status_id: h.job_status_id,
        job_status_title: h.JobStatus?.job_status_title,
        job_status_color_code: h.JobStatus?.job_status_color_code,
        is_completed: h.is_completed,
        completed: norm(h.JobStatus?.job_status_title) === "completed",
        at: h.createdAt,
      })),
      available_actions: actions,
    };

    // Ensure no passwords leak in nested users
    if (response.technician) delete response.technician.password;
    if (response.supervisor) delete response.supervisor.password;

    res.json(response);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /jobs/summary:
 *   get:
 *     summary: Summary counts of jobs for the logged-in context
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 yet_to_accept:
 *                   type: integer
 *                 completed:
 *                   type: integer
 *                 overdue:
 *                   type: integer
 *                 waiting_for_submission:
 *                   type: integer
 */
jobRouter.get(
  "/summary",
  rbac("Manage Job", "view"),
  applyOrgScope,
  async (req, res, next) => {
    try {
      const roleSlug = String(req.user?.role_slug || "").trim().toLowerCase();
      const actorId = req.user?.sub || req.user?.user_id;

      // Map status titles -> IDs
      const statuses = await JobStatus.findAll({ where: { status: true } });
      const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      const idByKey = Object.fromEntries(statuses.map((s) => [norm(s.job_status_title), s.job_status_id]));

      const notStartedId = idByKey["notstarted"];
      const completedId = idByKey["completed"];
      const cancelledId = idByKey["cancelled"];
      const rejectedId = idByKey["rejected"];
      const waitingSet = [
        idByKey["assignedtech"],
        idByKey["enroute"],
        idByKey["onsite"],
        idByKey["onresume"],
        idByKey["onhold"],
      ].filter(Boolean);

      // Base where respecting org scope
      const baseWhere = { ...(req.scopeWhere || {}) };
      // Restrict technicians to their assigned/supervised jobs
      if (roleSlug === "technician" && actorId) {
        baseWhere[Op.or] = [{ technician_id: actorId }, { supervisor_id: actorId }];
      }

      // yet_to_accept: Not Started
      const yetToAccept = notStartedId
        ? await Job.count({ where: { ...baseWhere, job_status_id: notStartedId } })
        : 0;

      // completed: Completed
      const completed = completedId
        ? await Job.count({ where: { ...baseWhere, job_status_id: completedId } })
        : 0;

      // waiting_for_submission: in waitingSet statuses
      const waiting_for_submission = waitingSet.length
        ? await Job.count({ where: { ...baseWhere, job_status_id: { [Op.in]: waitingSet } } })
        : 0;

      // overdue: scheduledDateAndTime < now and not in terminal statuses Completed/Cancelled/Rejected
      const now = new Date();
      const excludeSet = [completedId, cancelledId, rejectedId].filter(Boolean);
      const overdue = await Job.count({
        where: {
          ...baseWhere,
          scheduledDateAndTime: { [Op.lt]: now },
          ...(excludeSet.length ? { job_status_id: { [Op.notIn]: excludeSet } } : {}),
        },
      });

      res.json({ yet_to_accept: yetToAccept, completed, overdue, waiting_for_submission });
    } catch (e) {
      next(e);
    }
  }
);

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

    // Technicians can only access their own assigned/supervised jobs
    const roleSlug = String(req.user?.role_slug || "").trim().toLowerCase();
    const actorId = req.user?.sub || req.user?.user_id;
    if (roleSlug === "technician" && actorId) {
      const j = job?.toJSON ? job.toJSON() : job;
      if (j.technician_id !== actorId && j.supervisor_id !== actorId) {
        return res.status(404).json({ message: "Not found" });
      }
    }

    const prevStatus = job.job_status_id;

    // Normalize estimated duration on updates
    const updates = { ...req.body };
    const hasGranular = ["estimated_days", "estimated_hours", "estimated_minutes"].some(
      (k) => updates[k] !== undefined && updates[k] !== null
    );
    if (hasGranular) {
      const d = updates.estimated_days !== undefined ? Number(updates.estimated_days) : job.estimated_days || 0;
      const h = updates.estimated_hours !== undefined ? Number(updates.estimated_hours) : job.estimated_hours || 0;
      const m = updates.estimated_minutes !== undefined ? Number(updates.estimated_minutes) : job.estimated_minutes || 0;

      if (d < 0 || h < 0 || m < 0 || !Number.isInteger(d) || !Number.isInteger(h) || !Number.isInteger(m)) {
        const err = new Error("estimated_days/hours/minutes must be non-negative integers");
        err.status = 400;
        throw err;
      }
      if (h > 23 || m > 59) {
        const err = new Error("estimated_hours must be 0-23 and estimated_minutes 0-59");
        err.status = 400;
        throw err;
      }
      updates.estimated_days = d;
      updates.estimated_hours = h;
      updates.estimated_minutes = m;
      updates.estimated_duration = d * 24 * 60 + h * 60 + m;
    } else if (updates.estimated_duration !== undefined && updates.estimated_duration !== null) {
      const total = Number(updates.estimated_duration);
      if (!Number.isFinite(total) || total < 0) {
        const err = new Error("estimated_duration must be a non-negative number of minutes");
        err.status = 400;
        throw err;
      }
      const d = Math.floor(total / (24 * 60));
      const h = Math.floor((total % (24 * 60)) / 60);
      const m = Math.floor(total % 60);
      updates.estimated_days = d;
      updates.estimated_hours = h;
      updates.estimated_minutes = m;
      updates.estimated_duration = Math.floor(total);
    }

    // Drop granular fields if DB columns are not available yet
    const avail = await getJobColumnAvailability();
    if (!avail.estimated_days) delete updates.estimated_days;
    if (!avail.estimated_hours) delete updates.estimated_hours;
    if (!avail.estimated_minutes) delete updates.estimated_minutes;

    await job.update(updates, { returning: false });

    if (req.body.job_status_id && req.body.job_status_id !== prevStatus) {
      await JobStatusHistory.create({
        job_id: job.job_id,
        job_status_id: req.body.job_status_id,
        is_completed: false,
      });
    }

    const jobAttrs = await getJobAttributesList();
    const reloaded = await Job.findOne({ where: { job_id: job.job_id }, attributes: jobAttrs });

    res.json(reloaded || job);
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

    // Delete within a transaction to avoid FK violations
    await sequelize.transaction(async (t) => {
      await JobStatusHistory.destroy({ where: { job_id: job.job_id }, transaction: t });
      await job.destroy({ transaction: t });
    });

    res.json({ message: "Deleted" });
  } catch (e) {
    next(e);
  }
});
