import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.routes.js";
import { locationRouter } from "./routes/location.routes.js";
import { masterRouter } from "./routes/master.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { jobRouter } from "./routes/job.routes.js";
import { authRequired } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRouter);
app.use("/api/settings", authRequired, locationRouter);
app.use("/api/masters", authRequired, masterRouter);
app.use("/api/admin", authRequired, adminRouter);
app.use("/api/jobs", authRequired, jobRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;
