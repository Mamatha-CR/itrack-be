import app from "./app.js";
import { sequelize } from "./config/database.js";
import { syncAll } from "./models/index.js";

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    await syncAll(); // auto-creates/updates tables
    app.listen(PORT, () => console.log(`I-Track backend running on ${PORT}`));
  } catch (e) {
    console.error("Failed to start:", e);
    process.exit(1);
  }
}
start();
