class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

function handleError(error, res) {
  console.error("Error performing operation:", error);

  // Handle different types of errors
  if (error.name === "SequelizeValidationError") {
    // Sequelize validation errors
    const validationErrors = {};
    error.errors.forEach((err) => {
      validationErrors[err.path] = err.message;
    });

    return res.status(400).json({
      success: false,
      status: "Validation Error",
      message: "Validation failed",
      errors: validationErrors,
    });
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    // Unique constraint violation
    const duplicateField = error.errors[0].path;
    return res.status(409).json({
      success: false,
      status: "Duplicate Error",
      message: `Document with this ${duplicateField} already exists`,
      errors: {
        [duplicateField]: `This ${duplicateField} is already present`,
      },
    });
  }

  if (error.name === "SequelizeDatabaseError") {
    // Database-specific errors
    return res.status(400).json({
      success: false,
      status: "Database Error",
      message: "Database operation failed",
      errors: {
        database: error.message || "Database constraint violation",
      },
    });
  }

  if (error.name === "SequelizeForeignKeyConstraintError") {
    // Foreign key constraint violation
    return res.status(400).json({
      success: false,
      status: "Foreign Key Error",
      message: "Referenced record does not exist",
      errors: {
        [error.fields[0]]: "Invalid reference to related record",
      },
    });
  }

  if (
    error.name === "SequelizeConnectionError" ||
    error.name === "SequelizeConnectionRefusedError" ||
    error.name === "SequelizeHostNotFoundError" ||
    error.name === "SequelizeTimeoutError"
  ) {
    // Database connection errors
    return res.status(503).json({
      success: false,
      status: "Database Connection Error",
      message: "Database temporarily unavailable. Please try again later.",
      errors: {
        database: "Connection to database failed",
      },
    });
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    // File size limit exceeded
    return res.status(413).json({
      success: false,
      status: "File Size Error",
      message: "File size too large",
      errors: {
        avatar: "Avatar file size exceeds the allowed limit",
      },
    });
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    // Unexpected file field
    return res.status(400).json({
      success: false,
      status: "File Upload Error",
      message: "Unexpected file upload",
      errors: {
        file: "Unexpected file field or too many files",
      },
    });
  }

  // Generic server error for any unhandled errors
  return res.status(500).json({
    success: false,
    status: "Internal Server Error",
    message: "An unexpected error occurred while performing the operation",
    errors: {
      server:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    },
  });
}

export { ApiError, handleError };
