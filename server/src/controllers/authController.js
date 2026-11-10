import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import publicUser from '../utils/publicUser.js';

// POST /api/auth/login   body: { email, password }
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password is hidden by default in the model, so ask for it explicitly
  const user = await User.findOne({ email }).select('+password');

  // Same message for "no such email" and "wrong password", so nobody can discover which emails exist
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'This account is deactivated. Contact an admin.');

  res.json({ token: generateToken(user), user: publicUser(user) });
});

// GET /api/auth/me   (needs login)
export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/profile   body: { name, email }
export const updateProfile = asyncHandler(async (req, res) => {
  req.user.name = req.body.name;
  req.user.email = req.body.email;
  await req.user.save(); // a duplicate email is caught by the error handler (409)
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/password   body: { currentPassword, newPassword }
export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  user.password = req.body.newPassword; // hashed automatically by the model before saving
  await user.save();
  res.json({ message: 'Password changed' });
});
