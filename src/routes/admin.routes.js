// src/routes/admin.routes.js
import express from "express";
import { Op } from "sequelize";
import { buildCrudRoutes } from "../utils/crudFactory.js";
import { Company, Vendor, User, Client, Role, Shift, Region } from "../models/index.js";

export const adminRouter = express.Router();

/**
 * Pagination & filters supported (handled by crudFactory):
 * - ?page=1&limit=20               -> pagination
 * - ?searchParam=term              -> fuzzy search on searchFields
 * - ?sortBy=name&order=ASC|DESC    -> sorting (defaults safe to PK)
 * - exact field filters            -> any key in exactFields, e.g. ?status=true
 */

/* ======================= COMPANIES (super_admin only) ======================= */
adminRouter.use(
  "/companies",
  buildCrudRoutes({
    model: Company,
    screen: "Company",
    searchFields: ["name", "email", "phone", "gst", "city"],
    exactFields: ["country_id", "state_id", "subscription_id", "status"],
    statusFieldName: "status",
    orgScoped: false, // not tenant-scoped; only super_admin should have this screen
    normalize: (body) => {
      if (typeof body.name === "string") body.name = body.name.trim();
      if (typeof body.email === "string") body.email = body.email.trim().toLowerCase();
      if (typeof body.phone === "string") body.phone = String(body.phone).replace(/\D+/g, "");
      if (typeof body.theme_color === "string")
        body.theme_color = body.theme_color.trim().toLowerCase();
      if (typeof body.gst === "string") body.gst = body.gst.trim().toUpperCase();
      if (typeof body.city === "string") body.city = body.city.trim();
      if (typeof body.address_1 === "string") body.address_1 = body.address_1.trim();
      if (typeof body.postal_code === "string") body.postal_code = body.postal_code.trim();
    },
  })
);

/* ======================= VENDORS (org-scoped; company REQUIRED) ======================= */
adminRouter.use(
  "/vendors",
  buildCrudRoutes({
    model: Vendor,
    screen: "Vendor / Contractor",
    searchFields: ["vendor_name", "email", "phone"],
    exactFields: ["company_id", "country_id", "state_id", "region_id"],
    normalize: (body) => {
      if (typeof body.vendor_name === "string") body.vendor_name = body.vendor_name.trim();
      if (typeof body.email === "string") body.email = body.email.trim().toLowerCase();
      if (typeof body.phone === "string") body.phone = String(body.phone).replace(/\D+/g, "");
      if (typeof body.postal_code === "string") body.postal_code = body.postal_code.trim();
      if (typeof body.address_1 === "string") body.address_1 = body.address_1.trim();
    },
    // company required (super_admin must pass; org users auto-filled)
    preCreate: async (req, body) => {
      const isSuper = req.user?.role_slug === "super_admin";
      const companyId = isSuper ? body.company_id : req.user?.company_id;
      if (!companyId) {
        const err = new Error("company_id is required to create a vendor");
        err.status = 400;
        throw err;
      }
      // Verify company exists
      const company = await Company.findOne({ where: { company_id: companyId } });
      if (!company) {
        const err = new Error("company_id does not exist");
        err.status = 400;
        throw err;
      }
      body.company_id = companyId;

      // Optional: validate role_id if provided
      if (body.role_id) {
        const role = await Role.findOne({ where: { role_id: body.role_id } });
        if (!role) {
          const err = new Error("role_id does not exist");
          err.status = 400;
          throw err;
        }
      }
    },
    preUpdate: async (_req, body) => {
      if (body.company_id) delete body.company_id; // never move tenant
    },
  })
);

/* ======================= USERS (org-scoped) ======================= */
/* Listing users: ALWAYS restrict to roles 'supervisor' & 'technician' */
adminRouter.use(
  "/users",
  buildCrudRoutes({
    model: User,
    screen: "Technician",
    searchFields: ["name", "email", "phone", "city"],
    exactFields: ["company_id", "role_id", "vendor_id", "shift_id", "region_id", "supervisor_id"],
    // No explicit status field on User in your model; add one if needed.
    normalize: (body) => {
      if (typeof body.name === "string") body.name = body.name.trim();
      if (typeof body.email === "string") body.email = body.email.trim().toLowerCase();
      if (typeof body.phone === "string") body.phone = String(body.phone).replace(/\D+/g, "");
      if (typeof body.city === "string") body.city = body.city.trim();
      if (typeof body.address_1 === "string") body.address_1 = body.address_1.trim();
      if (typeof body.postal_code === "string") body.postal_code = body.postal_code.trim();
    },

    // 🔒 List hook: only show Supervisor + Technician
    listWhere: async () => {
      const roles = await Role.findAll({
        where: { role_slug: { [Op.in]: ["supervisor", "technician"] } },
        attributes: ["role_id"],
      });
      const roleIds = roles.map((r) => r.role_id);
      // If seed/DB somehow missing these roles, return impossible filter to yield empty list.
      return roleIds.length ? { role_id: { [Op.in]: roleIds } } : { role_id: { [Op.in]: [] } };
    },

    // Enforce required vendor for these roles
    preCreate: async (req, body) => {
      const isSuper = req.user?.role_slug === "super_admin";
      const companyId = isSuper ? body.company_id : req.user?.company_id;
      if (!companyId) {
        const err = new Error("company_id is required to create a user");
        err.status = 400;
        throw err;
      }
      // Verify company exists
      const company = await Company.findOne({ where: { company_id: companyId } });
      if (!company) {
        const err = new Error("company_id does not exist");
        err.status = 400;
        throw err;
      }
      body.company_id = companyId;

      if (!body.role_id) {
        const err = new Error("role_id is required");
        err.status = 400;
        throw err;
      }
      const role = await Role.findOne({ where: { role_id: body.role_id } });
      if (!role) {
        const err = new Error("role_id does not exist");
        err.status = 400;
        throw err;
      }
      const slug = String(role.role_slug || "").toLowerCase();

      if (slug === "technician" || slug === "supervisor") {
        if (!body.vendor_id) {
          const err = new Error("vendor_id is required for technician/supervisor");
          err.status = 400;
          throw err;
        }
        const vendor = await Vendor.findOne({
          where: { vendor_id: body.vendor_id, company_id: companyId },
        });
        if (!vendor) {
          const err = new Error("vendor_id does not exist or does not belong to the same company");
          err.status = 400;
          throw err;
        }
      }

      // If role is technician, supervisor is mandatory and must be a supervisor in same company
      if (slug === "technician") {
        if (!body.supervisor_id) {
          const err = new Error("supervisor_id is required for technician");
          err.status = 400;
          throw err;
        }
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
      }

      // Optional: validate shift_id
      if (body.shift_id) {
        const shift = await Shift.findOne({ where: { shift_id: body.shift_id } });
        if (!shift) {
          const err = new Error("shift_id does not exist");
          err.status = 400;
          throw err;
        }
      }
      // Optional: validate supervisor_id (must be in same company)
      if (body.supervisor_id) {
        const supervisor = await User.findOne({ where: { user_id: body.supervisor_id, company_id: companyId } });
        if (!supervisor) {
          const err = new Error("supervisor_id does not exist or is not in the same company");
          err.status = 400;
          throw err;
        }
      }
      // Optional: validate region_id
      if (body.region_id) {
        const region = await Region.findOne({ where: { region_id: body.region_id } });
        if (!region) {
          const err = new Error("region_id does not exist");
          err.status = 400;
          throw err;
        }
      }
      // Optional: validate region_ids array
      if (Array.isArray(body.region_ids) && body.region_ids.length) {
        const regions = await Region.findAll({ where: { region_id: { [Op.in]: body.region_ids } } });
        if (regions.length !== body.region_ids.length) {
          const err = new Error("One or more region_ids do not exist");
          err.status = 400;
          throw err;
        }
      }
    },

    preUpdate: async (_req, body, row) => {
      // company is fixed; if role/vendor changes, validate again
      if (body.role_id || body.vendor_id) {
        const roleId = body.role_id ?? row.role_id;
        const role = await Role.findOne({ where: { role_id: roleId } });
        if (!role) {
          const err = new Error("Invalid role_id");
          err.status = 400;
          throw err;
        }
        const slug = String(role.role_slug || "").toLowerCase();
        if (slug === "technician" || slug === "supervisor") {
          const vendorId = body.vendor_id ?? row.vendor_id;
          if (!vendorId) {
            const err = new Error("vendor_id is required for technician/supervisor");
            err.status = 400;
            throw err;
          }
          const vendor = await Vendor.findOne({
            where: { vendor_id: vendorId, company_id: row.company_id },
          });
          if (!vendor) {
            const err = new Error("vendor_id must belong to the same company");
            err.status = 400;
            throw err;
          }
          if (slug === "technician") {
            const supervisorId = body.supervisor_id ?? row.supervisor_id;
            if (!supervisorId) {
              const err = new Error("supervisor_id is required for technician");
              err.status = 400;
              throw err;
            }
            const supervisor = await User.findOne({ where: { user_id: supervisorId, company_id: row.company_id } });
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
          }
        }
      }
      if (body.company_id) delete body.company_id; // never allow tenant change
    },
  })
);

/* ======================= CLIENTS (org-scoped; company required) ======================= */
adminRouter.use(
  "/clients",
  buildCrudRoutes({
    model: Client,
    screen: "Clients/Customer",
    searchFields: ["firstName", "lastName", "email", "phone", "city"],
    exactFields: ["company_id", "business_typeId", "country_id", "state_id", "available_status"],
    statusFieldName: "available_status",
    normalize: (body) => {
      if (typeof body.firstName === "string") body.firstName = body.firstName.trim();
      if (typeof body.lastName === "string") body.lastName = body.lastName.trim();
      if (typeof body.email === "string") body.email = body.email.trim().toLowerCase();
      if (typeof body.phone === "string") body.phone = String(body.phone).replace(/\D+/g, "");
      if (typeof body.city === "string") body.city = body.city.trim();
      if (typeof body.address_1 === "string") body.address_1 = body.address_1.trim();
      if (typeof body.postal_code === "string") body.postal_code = body.postal_code.trim();
    },
    preCreate: async (req, body) => {
      const isSuper = req.user?.role_slug === "super_admin";
      const companyId = isSuper ? body.company_id : req.user?.company_id;
      if (!companyId) {
        const err = new Error("company_id is required to create a client");
        err.status = 400;
        throw err;
      }
      body.company_id = companyId;
    },
    preUpdate: async (_req, body) => {
      if (body.company_id) delete body.company_id;
    },
  })
);
