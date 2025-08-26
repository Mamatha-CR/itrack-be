import { DataTypes } from "sequelize";
export default (sequelize) =>
  sequelize.define("Job", {
    job_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    company_id: { type: DataTypes.UUID },
    client_id: { type: DataTypes.UUID, allowNull: false },
    reference_number: { type: DataTypes.STRING, allowNull: false, unique: true },
    worktype_id: { type: DataTypes.UUID },
    jobtype_id: { type: DataTypes.UUID },
    job_description: { type: DataTypes.TEXT },
    estimated_duration: { type: DataTypes.INTEGER },
    scheduledDateAndTime: { type: DataTypes.DATE },
    supervisor_id: { type: DataTypes.UUID },
    now_id: { type: DataTypes.UUID },
    technician_id: { type: DataTypes.UUID },
    job_status_id: { type: DataTypes.UUID },
    job_assigned: { type: DataTypes.BOOLEAN, defaultValue: false },
  });
