import { body } from 'express-validator';

// Shared rule for setting a password (create user, change password).
// Login only checks notEmpty, so existing shorter passwords keep working.
export const passwordRule = (field, label) =>
  body(field)
    .isLength({ min: 8 })
    .withMessage(`${label} must be at least 8 characters`)
    .matches(/[A-Za-z]/)
    .withMessage(`${label} must contain a letter`)
    .matches(/\d/)
    .withMessage(`${label} must contain a number`);
