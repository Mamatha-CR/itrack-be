import { sequelize } from "../config/database.js";

// Init functions
import CountryInit from "./Country.js";
import StateInit from "./State.js";
import DistrictInit from "./District.js";
import PincodeInit from "./Pincode.js";
import NatureOfWorkInit from "./NatureOfWork.js";
import JobStatusInit from "./JobStatus.js";
import SubscriptionTypeInit from "./SubscriptionType.js";
import BusinessTypeInit from "./BusinessType.js";
import RoleInit from "./Role.js";
import ScreenInit from "./Screen.js";
import RoleScreenPermissionInit from "./RoleScreenPermission.js";
import CompanyInit from "./Company.js";
import VendorInit from "./Vendor.js";
import ShiftInit from "./Shift.js";
import RegionInit from "./Region.js";
import WorkTypeInit from "./WorkType.js";
import JobTypeInit from "./JobType.js";
import UserInit from "./User.js";
import ClientInit from "./Client.js";
import JobInit from "./Job.js";
import JobStatusHistoryInit from "./JobStatusHistory.js";
import AttendanceInit from "./Attendance.js";

// Create models
export const Country = CountryInit(sequelize);
export const State = StateInit(sequelize);
export const District = DistrictInit(sequelize);
export const Pincode = PincodeInit(sequelize);
export const NatureOfWork = NatureOfWorkInit(sequelize);
export const JobStatus = JobStatusInit(sequelize);
export const SubscriptionType = SubscriptionTypeInit(sequelize);
export const BusinessType = BusinessTypeInit(sequelize);
export const Role = RoleInit(sequelize);
export const Screen = ScreenInit(sequelize);
export const RoleScreenPermission = RoleScreenPermissionInit(sequelize);
export const Company = CompanyInit(sequelize);
export const Vendor = VendorInit(sequelize);
export const Shift = ShiftInit(sequelize);
export const Region = RegionInit(sequelize);
export const WorkType = WorkTypeInit(sequelize);
export const JobType = JobTypeInit(sequelize);
export const User = UserInit(sequelize);
export const Client = ClientInit(sequelize);
export const Job = JobInit(sequelize);
export const JobStatusHistory = JobStatusHistoryInit(sequelize);
export const Attendance = AttendanceInit(sequelize);

// Associations
State.belongsTo(Country, { foreignKey: "country_id" });
Country.hasMany(State, { foreignKey: "country_id" });

District.belongsTo(State, { foreignKey: "state_id" });
District.belongsTo(Country, { foreignKey: "country_id" });
State.hasMany(District, { foreignKey: "state_id" });

Pincode.belongsTo(Country, { foreignKey: "country_id" });
Pincode.belongsTo(State, { foreignKey: "state_id" });
Pincode.belongsTo(District, { foreignKey: "district_id" });

Company.belongsTo(SubscriptionType, { foreignKey: "subscription_id" });
Company.belongsTo(Country, { foreignKey: "country_id" });
Company.belongsTo(State, { foreignKey: "state_id" });

Vendor.belongsTo(Company, { foreignKey: "company_id" });
Vendor.belongsTo(Role, { foreignKey: "role_id" });

Client.belongsTo(Company, { foreignKey: "company_id" });
Client.belongsTo(BusinessType, { foreignKey: "business_typeId" });

User.belongsTo(Company, { foreignKey: "company_id" });
User.belongsTo(Role, { foreignKey: "role_id" });
User.belongsTo(User, { as: "supervisor", foreignKey: "supervisor_id" });
User.belongsTo(Vendor, { foreignKey: "vendor_id" });
User.belongsTo(Shift, { foreignKey: "shift_id" });

Job.belongsTo(Company, { foreignKey: "company_id" });
Job.belongsTo(Client, { foreignKey: "client_id", as: "client" });
Job.belongsTo(WorkType, { foreignKey: "worktype_id", as: "work_type" });
Job.belongsTo(JobType, { foreignKey: "jobtype_id", as: "job_type" });
Job.belongsTo(User, { as: "supervisor", foreignKey: "supervisor_id" });
Job.belongsTo(User, { as: "technician", foreignKey: "technician_id" });
Job.belongsTo(NatureOfWork, { foreignKey: "now_id", as: "nature_of_work" });
Job.belongsTo(JobStatus, { foreignKey: "job_status_id", as: "job_status" });

JobStatusHistory.belongsTo(Job, { foreignKey: "job_id", onDelete: "CASCADE" });
Job.hasMany(JobStatusHistory, { foreignKey: "job_id", onDelete: "CASCADE", hooks: true });
// Link history entries to their status record for eager loading
JobStatusHistory.belongsTo(JobStatus, { foreignKey: "job_status_id" });
JobStatus.hasMany(JobStatusHistory, { foreignKey: "job_status_id" });

// Attendance associations
Attendance.belongsTo(Company, { foreignKey: "company_id" });
Attendance.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Attendance, { foreignKey: "user_id" });

RoleScreenPermission.belongsTo(Role, { foreignKey: "role_id" });
Role.hasMany(RoleScreenPermission, { foreignKey: "role_id" });
RoleScreenPermission.belongsTo(Screen, { foreignKey: "screen_id" });
Screen.hasMany(RoleScreenPermission, { foreignKey: "screen_id" });

export async function syncAll() {
  await sequelize.sync({ alter: true });
  // Ensure numeric short-id sequence for jobs exists and starts at 6 digits
  try {
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relkind = 'S' AND c.relname = 'job_id_seq'
        ) THEN
          CREATE SEQUENCE job_id_seq START WITH 100000 MINVALUE 100000;
        END IF;
      END $$;
    `);
    // If sequence exists but below 100000, bump it
    const [rows] = await sequelize.query("SELECT last_value FROM job_id_seq");
    const last = Array.isArray(rows) ? rows[0]?.last_value : rows?.last_value;
    if (Number(last) < 100000) {
      await sequelize.query("ALTER SEQUENCE job_id_seq RESTART WITH 100000");
    }
  } catch (e) {
    // Log but do not crash startup
    console.warn("Sequence ensure failed:", e?.message || e);
  }
}
