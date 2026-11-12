import jwt from 'jsonwebtoken';

// The token proves who the user is. It is sent back by the browser on every request.
export default function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role, v: user.tokenVersion ?? 0 }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
