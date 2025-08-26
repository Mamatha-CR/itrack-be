import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User, Vendor, Company, Role, RoleScreenPermission, Screen } from "../models/index.js";
dotenv.config();

const stripPasswords = (obj) => {
  const data = obj.toJSON();
  for (const k of Object.keys(data)) if (k.toLowerCase().includes("password")) delete data[k];
  return data;
};

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email & password required" });

    let principal = null;
    let type = null;

    const user = await User.findOne({ where: { email } });
    if (user && bcrypt.compareSync(password, user.password)) {
      principal = user;
      type = "user";
    }
    if (!principal) {
      const vendor = await Vendor.findOne({ where: { email } });
      if (vendor && bcrypt.compareSync(password, vendor.password)) {
        principal = vendor;
        type = "vendor";
      }
    }
    if (!principal) {
      const company = await Company.findOne({ where: { email } });
      if (company && bcrypt.compareSync(password, company.password)) {
        principal = company;
        type = "company";
      }
    }
    if (!principal) return res.status(401).json({ message: "Invalid credentials" });

    let role_id = principal.role_id;
    let company_id = principal.company_id || null;
    if (type === "company") {
      const r = await Role.findOne({ where: { role_slug: "company_admin" } });
      role_id = r?.role_id || role_id;
      company_id = principal.company_id || null;
    }

    const role = await Role.findOne({ where: { role_id } });
    const perms = await RoleScreenPermission.findAll({ where: { role_id }, include: [Screen] });
    const permissions = perms.map((p) => ({
      screen: p.Screen?.name,
      view: p.can_view,
      add: p.can_add,
      edit: p.can_edit,
      delete: p.can_delete,
    }));

    const token = jwt.sign(
      {
        sub: principal.user_id || principal.vendor_id || principal.company_id,
        type,
        role_id,
        role_slug: role?.role_slug,
        company_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      token,
      user: {
        type,
        role: { id: role?.role_id, name: role?.role_name, slug: role?.role_slug },
        company_id,
        profile: stripPasswords(principal),
      },
      permissions,
    });
  } catch (e) {
    next(e);
  }
}
