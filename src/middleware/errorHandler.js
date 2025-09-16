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

  // NOT NULL violation
  if (pgCode === "23502" || /notNull Violation/i.test(msg)) {
    // Try to extract column name from detail like: "null value in column \"email\" of relation ..."
    const m = detail.match(/column \"([^\"]+)\"/i) || msg.match(/\.(\w+) cannot be null/i);
    const column = m ? m[1] : undefined;
    const field = String(column || "field");
    const nice = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "Field";
    const message = `${nice(field)} is required`;
    return res.status(400).json({ message, field, code: "NOT_NULL_VIOLATION" });
  }

  // Multer file upload errors
  if (err?.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large", code: err.code });
    }
    return res.status(400).json({ message: err.message || "Upload error", code: err.code });
  }
  if (err?.code === "INVALID_UPLOAD_TYPE") {
    return res.status(400).json({ message: err.message, code: err.code });
  }

  // Sequelize validation errors (fallback for controllers not using crudFactory)
  if (err?.name === "SequelizeValidationError") {
    const items = err.errors || [];
    const mapField = (path, validatorKey, value, defaultMsg) => {
      const v = value == null ? "" : String(value).trim();
      const lower = String(path || "").toLowerCase();
      const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "Field";
      if (/notnull/i.test(validatorKey || "")) return `${cap(lower)} is required`;
      if (lower === "email") return v ? "Invalid email" : "Email is required";
      if (lower === "phone") return v ? "Invalid phone" : "Phone is required";
      return defaultMsg || `Invalid ${cap(lower)}`;
    };
    const errors = items.map((it) => mapField(it.path, it.validatorKey || it.type, it.value, it.message));
    const fields = Object.fromEntries(
      items.map((it) => [
        it.path,
        mapField(it.path, it.validatorKey || it.type, it.value, it.message),
      ])
    );
    return res.status(400).json({ message: "Validation error", errors, fields });
  }

  // Invalid text representation (e.g., invalid UUID)
  if (pgCode === "22P02") {
    return res.status(400).json({
      message: "Invalid value for field type",
      error: err?.original?.message || err?.message,
      code: "INVALID_TEXT_REPRESENTATION",
    });
  }

  // Validation style errors that set err.status
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.message });
  }

  // Postgres numeric value out of range (e.g., DECIMAL overflow)
  if (pgCode === "22003" || /numeric field overflow/i.test(msg)) {
    return res.status(400).json({
      message: "Numeric value out of range",
      error: msg,
      code: "NUMERIC_OUT_OF_RANGE",
    });
  }

  res.status(500).json({ message: "Internal Server Error", error: err?.message });
}
