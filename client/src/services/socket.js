import { io } from 'socket.io-client';

// Real-time alerts. The socket server lives at the same address as the API, without the "/api" part.
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function connectSocket() {
  return io(SOCKET_URL, { auth: (send) => send({ token: localStorage.getItem('token') }) });
}
