import { validationResult } from 'express-validator';

// Put after the validation rules in a route. Stops the request if any rule failed.
export default function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  res.status(400).json({ message: errors[0].message, errors });
}
