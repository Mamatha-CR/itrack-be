// src/routes/location.routes.js
import express from "express";
import { Country, State, District, Pincode } from "../models/index.js";
import { buildCrudRoutes } from "../utils/crudFactory.js";

export const locationRouter = express.Router();

// helper: allow only super_admin to create
const onlySuperAdminCreate = async (req) => {
  if (req.user?.role_slug !== "super_admin") {
    const err = new Error("Only super_admin can create locations");
    err.status = 403;
    throw err;
  }
};

locationRouter.use(
  "/countries",
  buildCrudRoutes({
    model: Country,
    screen: "Settings",
    searchFields: ["country_name", "country_code"],
    exactFields: ["country_id", "country_code", "country_status"],
    statusFieldName: "country_status",
    preCreate: onlySuperAdminCreate, // 👈 create restricted to super_admin
    // If you also want to block edits to non-super:
    // preUpdate: onlySuperAdminCreate,
  })
);

locationRouter.use(
  "/states",
  buildCrudRoutes({
    model: State,
    screen: "Settings",
    searchFields: ["state_name"],
    exactFields: ["country_id", "state_id", "state_status"],
    statusFieldName: "state_status",
    preCreate: onlySuperAdminCreate, // 👈
    // preUpdate: onlySuperAdminCreate,
  })
);

locationRouter.use(
  "/districts",
  buildCrudRoutes({
    model: District,
    screen: "Settings",
    searchFields: ["district_name"],
    exactFields: ["country_id", "state_id", "district_id", "district_status"],
    statusFieldName: "district_status",
    preCreate: onlySuperAdminCreate, // 👈
    // preUpdate: onlySuperAdminCreate,
  })
);

locationRouter.use(
  "/pincodes",
  buildCrudRoutes({
    model: Pincode,
    screen: "Settings",
    searchFields: ["pincode"],
    exactFields: ["country_id", "state_id", "district_id", "pincode"],
    // normalize PIN format
    normalize: (body) => {
      if (body.pincode != null) {
        body.pincode = String(body.pincode).replace(/\s+/g, "").toUpperCase();
      }
    },
    // keep your idempotent behavior if you want to avoid hard 409s for duplicates:
    findExistingWhere: (req) => ({
      country_id: req.body.country_id,
      pincode: String(req.body.pincode).replace(/\s+/g, "").toUpperCase(),
    }),
    preCreate: onlySuperAdminCreate, // 👈
    // preUpdate: onlySuperAdminCreate,
  })
);
