import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import publicUser from '../utils/publicUser.js';
import { audit } from '../utils/audit.js';
import { disconnectUser } from '../socket.js';

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

  await audit(user, 'LOGIN', 'User', user._id);
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

// PUT /api/auth/settings   body: { notifications?, darkMode?, language? }
export const updateSettings = asyncHandler(async (req, res) => {
  for (const key of ['notifications', 'darkMode', 'language']) {
    if (req.body[key] !== undefined) req.user.settings[key] = req.body[key];
  }
  await req.user.save();
  res.json({ settings: req.user.settings });
});

// PUT /api/auth/password   body: { currentPassword, newPassword }
export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  user.password = req.body.newPassword; // hashed automatically by the model before saving
  user.tokenVersion = (user.tokenVersion ?? 0) + 1; // logs out every other session
  await user.save();
  await audit(user, 'PASSWORD_CHANGE', 'User', user._id);
  disconnectUser(user._id);
  res.json({ message: 'Password changed', token: generateToken(user) });
});
