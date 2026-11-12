// Shared by Express (app.js) and Socket.IO (socket.js) so both accept the same browser origins.
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

const allowAnyLocalhost = process.env.NODE_ENV !== 'production';

export function isAllowedOrigin(origin) {
  return (
    !origin ||
    allowedOrigins.includes(origin) ||
    (allowAnyLocalhost && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
  );
}

export function corsOrigin(origin, callback) {
  if (isAllowedOrigin(origin)) callback(null, true);
  else callback(new Error('Not allowed by CORS'));
}
