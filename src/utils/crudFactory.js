// src/routes/buildCrudRoutes.js
import express from "express";
import { buildWhere } from "./filters.js";
import { parseListQuery } from "../middleware/pagination.js";
import { rbac } from "../middleware/rbac.js";

/* -------------------- DB error helpers -------------------- */
function isUniqueError(err) {
  return (
    err?.name === "SequelizeUniqueConstraintError" ||
    err?.original?.code === "23505" ||
    err?.parent?.code === "23505"
  );
}
function isFkError(err) {
  return (
    err?.name === "SequelizeForeignKeyConstraintError" ||
    err?.original?.code === "23503" ||
    err?.parent?.code === "23503"
  );
}
function isValidationError(err) {
  return err?.name === "SequelizeValidationError";
}

/* -------------------- Org-scope enforcement -------------------- */
function makeOrgScope(model, { orgScoped }) {
  if (!orgScoped) {
    // Not org-scoped (e.g., Company)
    return (_req, _res, next) => next();
  }

  const hasCompanyId =
    model.getAttributes &&
    Object.prototype.hasOwnProperty.call(model.getAttributes(), "company_id");

  return (req, _res, next) => {
    if (!hasCompanyId) return next();
    if (req.user?.role_slug !== "super_admin") {
      req.scopeWhere = { ...(req.scopeWhere || {}), company_id: req.user.company_id };
    }
    next();
  };
}

function enforceOrgOwnership(model, req, body, { orgScoped, forbidChangeOnUpdate = true } = {}) {
  if (!orgScoped) return; // Skip for non-tenant models (e.g., Company)

  const hasCompanyId =
    model.getAttributes &&
    Object.prototype.hasOwnProperty.call(model.getAttributes(), "company_id");
  if (!hasCompanyId) return;

  const isSuper = req.user?.role_slug === "super_admin";

  if (!isSuper) {
    // Force company from token; prevent cross-tenant writes
    if (body.company_id && body.company_id !== req.user.company_id) {
      const err = new Error("Cross-tenant write forbidden");
      err.status = 403;
      throw err;
    }
    body.company_id = req.user.company_id;
  } else if (req.method === "POST" && (body.company_id === undefined || body.company_id === null)) {
    // super_admin must specify company_id on create for org-scoped models
    const err = new Error("company_id is required for super_admin");
    err.status = 400;
    throw err;
  }

  // Never allow changing tenant on update
  if (req.method === "PUT" && forbidChangeOnUpdate) {
    delete body.company_id;
  }
}

/**
 * Reusable CRUD route factory.
 *
 * Options:
 * - model              (required) Sequelize model
 * - screen             (required) RBAC screen name
 * - searchFields       array<string>  fuzzy search on ?searchParam=
 * - exactFields        array<string>  exact match filters (e.g., ids)
 * - statusFieldName    string         boolean status column (default "status")
 * - caseInsensitive    boolean        iLike vs like for search (default true)
 * - normalize          function(body, ctx)   mutate body before create/update; ctx='create'|'update'
 * - preCreate          async function(req, body)  perform business-rule validation before create
 * - preUpdate          async function(req, body, row)  perform business-rule validation before update
 * - findExistingWhere  function(req)  (optional) idempotent POST lookup; omit to fail duplicates with 409
 * - orgScoped          boolean        enable company_id scoping/enforcement (default true)
 * - listWhere          (async) function(req) -> whereClause  // extra list filter (e.g. role-based)
 */
export function buildCrudRoutes({
  model,
  screen,
  searchFields = [],
  exactFields = [],
  statusFieldName = "status",
  caseInsensitive = true,
  normalize, // optional
  preCreate, // optional
  preUpdate, // optional
  findExistingWhere, // optional (leave undefined to strictly 409 on duplicates)
  orgScoped = true,
  listWhere, // <<< NEW
}) {
  if (!model) throw new Error("buildCrudRoutes: model is required");
  if (!screen) throw new Error("buildCrudRoutes: screen is required");

  const router = express.Router();
  const PK = model.primaryKeyAttribute || Object.keys(model.primaryKeys || {})[0] || "id";

  const orgScope = makeOrgScope(model, { orgScoped });

  /* ========================= LIST ========================= */
  router.get("/", rbac(screen, "view"), parseListQuery, orgScope, async (req, res, next) => {
    try {
      const { limit, offset, sortBy, order, page } = req.listQuery;

      const whereBase = buildWhere(req.query, searchFields, exactFields, {
        statusFieldName,
        caseInsensitive,
      });

      // allow a per-route hook to further restrict list results (can be async)
      const extraWhere =
        typeof listWhere === "function" ? (await Promise.resolve(listWhere(req))) || {} : {};

      const where = { ...whereBase, ...(req.scopeWhere || {}), ...(extraWhere || {}) };

      // safe sort
      const attrs = model.getAttributes ? model.getAttributes() : {};
      const sortField = attrs?.[sortBy] ? sortBy : PK;

      const { rows, count } = await model.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortField, order]],
      });

      return res.json({ data: rows, page, limit, total: count });
    } catch (e) {
      return next(e);
    }
  });

  /* ========================= GET ONE ========================= */
  router.get("/:id", rbac(screen, "view"), orgScope, async (req, res, next) => {
    try {
      const where = { [PK]: req.params.id, ...(req.scopeWhere || {}) };
      const row = await model.findOne({ where });
      if (!row) return res.status(404).json({ message: "Not found" });
      return res.json(row);
    } catch (e) {
      return next(e);
    }
  });

  /* ========================= CREATE ========================= */
  router.post("/", rbac(screen, "add"), orgScope, async (req, res, next) => {
    try {
      const body = { ...req.body };

      enforceOrgOwnership(model, req, body, { orgScoped });
      if (typeof normalize === "function") normalize(body, "create");

      if (typeof preCreate === "function") {
        await preCreate(req, body); // business-rule validation hook
      }

      const created = await model.create(body);
      return res.status(201).json(created);
    } catch (e) {
      if (isUniqueError(e)) {
        // Optional idempotent POST: only if caller provided a finder
        if (typeof findExistingWhere === "function") {
          try {
            const existing = await model.findOne({ where: findExistingWhere(req) });
            if (existing) return res.status(200).json(existing);
          } catch {
            /* ignore */
          }
        }
        return res.status(409).json({ message: `${model.name} already exists` });
      }
      if (isValidationError(e)) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: e.errors?.map((x) => x.message) });
      }
      if (e?.status) return res.status(e.status).json({ message: e.message });
      return next(e);
    }
  });

  /* ========================= UPDATE ========================= */
  router.put("/:id", rbac(screen, "edit"), orgScope, async (req, res, next) => {
    try {
      const where = { [PK]: req.params.id, ...(req.scopeWhere || {}) };
      const row = await model.findOne({ where });
      if (!row) return res.status(404).json({ message: "Not found" });

      const body = { ...req.body };
      enforceOrgOwnership(model, req, body, { orgScoped });
      delete body.company_id; // never allow changing tenant
      if (typeof normalize === "function") normalize(body, "update");

      if (typeof preUpdate === "function") {
        await preUpdate(req, body, row); // business-rule validation hook
      }

      await row.update(body);
      return res.json(row);
    } catch (e) {
      if (isUniqueError(e)) {
        return res.status(409).json({ message: `${model.name} already exists` });
      }
      if (isValidationError(e)) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: e.errors?.map((x) => x.message) });
      }
      if (e?.status) return res.status(e.status).json({ message: e.message });
      return next(e);
    }
  });

  /* ========================= DELETE ========================= */
  router.delete("/:id", rbac(screen, "delete"), orgScope, async (req, res, next) => {
    try {
      const where = { [PK]: req.params.id, ...(req.scopeWhere || {}) };
      const row = await model.findOne({ where });
      if (!row) return res.status(404).json({ message: "Not found" });

      await row.destroy();
      return res.json({ message: "Deleted" });
    } catch (e) {
      if (isFkError(e)) {
        return res.status(409).json({
          message: "Cannot delete: record is referenced by other data",
        });
      }
      return next(e);
    }
  });

  return router;
}
