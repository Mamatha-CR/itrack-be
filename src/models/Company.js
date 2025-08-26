import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";

export default (sequelize) => {
  const Company = sequelize.define(
    "Company",
    {
      company_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      logo: DataTypes.STRING,
      name: { type: DataTypes.STRING, allowNull: false },
      gst: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phone: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      address_1: DataTypes.STRING,
      country_id: DataTypes.INTEGER,
      state_id: DataTypes.UUID,
      city: DataTypes.STRING,
      postal_code: DataTypes.STRING,
      lat: DataTypes.DECIMAL(10, 7),
      lng: DataTypes.DECIMAL(10, 7),
      proof: DataTypes.STRING,
      subscription_id: DataTypes.UUID,
      no_of_users: { type: DataTypes.INTEGER, defaultValue: 0 },
      subscription_startDate: DataTypes.DATE,
      subscription_endDate: DataTypes.DATE,
      subscription_amountPerUser: DataTypes.DECIMAL(10, 2),
      remarks: DataTypes.TEXT,
      theme_color: DataTypes.STRING,
      status: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      hooks: {
        beforeValidate: (c) => {
          if (c.email) c.email = c.email.trim().toLowerCase();
          if (c.phone) c.phone = String(c.phone).replace(/\D+/g, "");
          if (c.gst) c.gst = c.gst.trim().toUpperCase();
        },
        beforeCreate: (c) => {
          if (c.password && !c.password.startsWith("$2"))
            c.password = bcrypt.hashSync(c.password, 10);
        },
        beforeUpdate: (c) => {
          if (c.changed("password") && c.password && !c.password.startsWith("$2")) {
            c.password = bcrypt.hashSync(c.password, 10);
          }
          if (c.changed("email") && c.email) c.email = c.email.trim().toLowerCase();
          if (c.changed("phone") && c.phone) c.phone = String(c.phone).replace(/\D+/g, "");
        },
      },
      indexes: [
        { unique: true, fields: ["email"] },
        { unique: true, fields: ["phone"] },
      ],
      tableName: "Company",
      freezeTableName: true,
    }
  );
  return Company;
};
