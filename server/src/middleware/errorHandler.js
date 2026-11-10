import ApiError from '../utils/ApiError.js';

// Runs when no route matched
export const notFound = (req, res, next) =>
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// Every error in the app ends up here and becomes a JSON response: { message: '...' }
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError') {
    // Mongoose schema validation failed
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    // Duplicate value in a unique field, e.g. email or SKU
    status = 409;
    message = `${Object.keys(err.keyValue || {})[0] || 'Value'} already exists`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Invalid or expired token. Please log in again.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  }

  if (status === 500) console.error(err);
  if (status === 500 && process.env.NODE_ENV === 'production') message = 'Server error';

  res.status(status).json({ message });
};
