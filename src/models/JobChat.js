import { DataTypes } from "sequelize";

// Lightweight table to store per-job chat messages authored by users
export default (sequelize) =>
  sequelize.define(
    "JobChat",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      job_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      indexes: [
        { fields: ["job_id"] },
        { fields: ["user_id"] },
        { fields: ["createdAt"] },
      ],
    }
  );
