import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// 1) protect: the user must be logged in. Reads "Authorization: Bearer <token>".
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not logged in');

  const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if fake or expired

  // Load the user fresh from the database, so a deactivated user or a changed role takes effect immediately
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new ApiError(401, 'This account no longer has access');
  if (!isCurrentToken(decoded, user)) throw new ApiError(401, 'Your session has expired. Please log in again.');

  req.user = user;
  next();
});

// A token issued before the last password change is no longer valid
export const isCurrentToken = (decoded, user) => (decoded.v ?? 0) === (user.tokenVersion ?? 0);

// 2) authorize: the user must have one of these roles. Use after protect.
//    router.delete('/:id', protect, authorize('admin', 'manager'), deleteProduct)
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to do this'));
    }
    next();
  };
