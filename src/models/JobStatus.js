import { DataTypes } from "sequelize";
export default (sequelize) =>
  sequelize.define("JobStatus", {
    job_status_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    job_status_title: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.BOOLEAN, defaultValue: true },
    job_status_color_code: { type: DataTypes.STRING(16) },
  });
