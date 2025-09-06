export function errorHandler(err, req, res, next) {
  console.error(err);

  // Sequelize DB error for undefined column (Postgres code 42703)
  const pgCode = err?.original?.code || err?.parent?.code;
  const msg = String(err?.message || "");
  const detail = String(err?.original?.detail || err?.parent?.detail || err?.original?.message || "");

  // If granular duration columns are missing, return a clear message
  const mentionsGranular = /estimated_days|estimated_hours|estimated_minutes/i.test(msg + " " + detail);
  if (pgCode === "42703" && mentionsGranular) {
    return res.status(400).json({
      message: "Granular duration fields are not available on the server yet",
      error: "Database schema is out of sync. Ask admin to add estimated_days, estimated_hours, estimated_minutes or restart server to sync.",
      code: "MISSING_COLUMNS",
    });
  }

  // Generic undefined column error
  if (pgCode === "42703") {
    return res.status(400).json({
      message: "Invalid column referenced in query",
      error: err?.original?.message || err?.message,
      code: "UNDEFINED_COLUMN",
    });
  }

  // FK violation (e.g., trying to delete a record referenced elsewhere)
  if (pgCode === "23503") {
    return res.status(409).json({
      message: "Operation violates a foreign key constraint",
      error: err?.original?.message || err?.message,
      code: "FK_CONSTRAINT_VIOLATION",
    });
  }

  // Validation style errors that set err.status
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.message });
  }

  res.status(500).json({ message: "Internal Server Error", error: err?.message });
}
