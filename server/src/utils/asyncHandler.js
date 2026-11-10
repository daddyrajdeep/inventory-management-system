// Wraps an async controller so any error is passed to the error handler instead of crashing the server
export default (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
