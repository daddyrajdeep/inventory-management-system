import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import publicUser from '../utils/publicUser.js';
import { audit } from '../utils/audit.js';
import { disconnectUser } from '../socket.js';

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
  await audit(req.user, 'CREATE', 'User', user._id, null, { name: user.name, email: user.email, role: user.role });
  res.status(201).json(publicUser(user));
});

// PATCH /api/users/:id/role   body: { role }
export const updateUserRole = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    throw new ApiError(400, 'You cannot change your own role');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const before = { role: user.role };
  user.role = req.body.role;
  await user.save();
  await audit(req.user, 'ROLE_CHANGE', 'User', user._id, before, { role: user.role });
  res.json(publicUser(user));
});

// PATCH /api/users/:id/active   body: { isActive }
export const setUserActive = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const before = { isActive: user.isActive };
  user.isActive = req.body.isActive;
  await user.save();
  await audit(req.user, 'ACTIVE_CHANGE', 'User', user._id, before, { isActive: user.isActive });
  if (!user.isActive) disconnectUser(user._id);
  res.json(publicUser(user));
});
