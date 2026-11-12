import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Alert, User } from './models/index.js';
import { isAllowedOrigin } from './config/cors.js';
import { isCurrentToken } from './middleware/auth.js';

// Real-time alerts. server.js calls initSocket(); everything else only calls the emit helpers,
// which do nothing when no socket server is running (tests, CLI scripts).
//
// Events sent to the browser:
//   alert:new   { alerts: [...], count }        new alerts (same shape as GET /api/alerts) + unread count
//   alert:read  { ids: [...] | null, count }    alerts marked read (null = all) + unread count

export const ALERT_PRODUCT_FIELDS = 'name sku quantity reorderLevel';
const ALERTS_ROOM = 'alerts';
const userRoom = (id) => `user:${id}`;

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: (origin, cb) => cb(null, isAllowedOrigin(origin)), credentials: true },
  });

  // Same rule as middleware/auth.js protect: valid token AND an active user
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Not logged in'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive || !isCurrentToken(decoded, user)) {
        return next(new Error('This account no longer has access'));
      }
      socket.data.userId = String(user._id);
      socket.data.expiresAt = decoded.exp * 1000;
      next();
    } catch {
      next(new Error('Not logged in'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(ALERTS_ROOM);
    socket.join(userRoom(socket.data.userId));

    // The JWT is only checked at connect time, so drop the socket when it expires
    const expiry = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.expiresAt - Date.now()));
    socket.on('disconnect', () => clearTimeout(expiry));
  });

  return io;
}

const unreadCount = () => Alert.countDocuments({ isRead: false });

export function emitNewAlerts(ids) {
  if (!io || ids.length === 0) return;
  Promise.all([
    Alert.find({ _id: { $in: ids } }).sort({ createdAt: -1 }).populate('product', ALERT_PRODUCT_FIELDS),
    unreadCount(),
  ])
    .then(([alerts, count]) => io.to(ALERTS_ROOM).emit('alert:new', { alerts: alerts.map((a) => a.toJSON()), count }))
    .catch((err) => console.error('Could not push new alerts:', err.message));
}

export function emitAlertsRead(ids) {
  if (!io) return;
  unreadCount()
    .then((count) => io.to(ALERTS_ROOM).emit('alert:read', { ids, count }))
    .catch((err) => console.error('Could not push read alerts:', err.message));
}

export function disconnectUser(userId) {
  io?.in(userRoom(String(userId))).disconnectSockets(true);
}
