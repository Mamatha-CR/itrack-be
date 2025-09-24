import { DataTypes } from "sequelize";
export default (sequelize) =>
  sequelize.define(
    "Job",
    {
      // Job model (keep job_id as UUID)
      job_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      job_no: {
        type: DataTypes.BIGINT,
        unique: true,
        defaultValue: sequelize.literal(`nextval('job_id_seq')`),
      },
      company_id: { type: DataTypes.UUID },
      client_id: { type: DataTypes.UUID, allowNull: false },
      reference_number: { type: DataTypes.STRING, allowNull: false, unique: true },
      worktype_id: { type: DataTypes.UUID },
      jobtype_id: { type: DataTypes.UUID },
      job_description: { type: DataTypes.TEXT },
      // Total estimated duration in minutes (derived from estimated_days/hours/minutes if provided)
      estimated_duration: { type: DataTypes.INTEGER },
      // New granular duration fields captured from FE
      estimated_days: { type: DataTypes.INTEGER, defaultValue: 0 },
      estimated_hours: { type: DataTypes.INTEGER, defaultValue: 0 },
      estimated_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
      scheduledDateAndTime: { type: DataTypes.DATE },
      supervisor_id: { type: DataTypes.UUID },
      now_id: { type: DataTypes.UUID },
      technician_id: { type: DataTypes.UUID },
      job_status_id: { type: DataTypes.UUID },
      job_assigned: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      hooks: {
        // Ensure job_id is assigned from the DB sequence
        beforeCreate: async (job) => {
          if (!job.job_id) {
            try {
              const [rows] = await sequelize.query("SELECT nextval('job_id_seq') AS id");
              const id = Array.isArray(rows) ? rows[0]?.id : rows?.id;
              if (id) job.job_id = Number(id);
            } catch (e) {
              // If sequence missing, let it fail upstream; server will attempt to create it on boot
            }
          }
        },
      },
    }
  );
