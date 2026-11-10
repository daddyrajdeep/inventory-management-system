import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import publicUser from '../utils/publicUser.js';

// All of these are admin only (see routes/userRoutes.js)

// GET /api/users
export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json(users.map(publicUser));
});

// POST /api/users   body: { name, email, password, role }
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await User.create({ name, email, password, role: role || 'staff' });
  res.status(201).json(publicUser(user));
});

// PATCH /api/users/:id/role   body: { role }
export const updateUserRole = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    throw new ApiError(400, 'You cannot change your own role');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.role = req.body.role;
  await user.save();
  res.json(publicUser(user));
});

// PATCH /api/users/:id/active   body: { isActive }
export const setUserActive = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.isActive = req.body.isActive;
  await user.save();
  res.json(publicUser(user));
});
