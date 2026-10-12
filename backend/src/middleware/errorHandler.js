/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('⚠️  API Error:', {
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message,
    });
  }

  // Mongoose CastError (e.g., invalid ObjectID or data type)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'CastError',
      message: `Resource not found with field ${err.path}: ${err.value}`,
    });
  }

  // Generic internal server error
  return res.status(error.statusCode || 500).json({
    success: false,
    error: error.name || 'ServerError',
    message: error.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
