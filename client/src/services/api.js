import axios from 'axios';

// One shared axios instance. Every service uses it to talk to the backend.
// The address comes from client/.env (VITE_API_URL). If it is missing, the local backend is used.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Before every request: attach the login token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// After every response: turn errors into readable messages, and log out when the token is no longer valid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.message = 'Cannot reach the server. Is the backend running?';
    } else if (error.response.data?.message) {
      error.message = error.response.data.message; // pages can simply show error.message
    }

    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
