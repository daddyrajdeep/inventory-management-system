import api from './api';

// POST /api/auth/login  ->  { token, user }
export async function loginRequest(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}
