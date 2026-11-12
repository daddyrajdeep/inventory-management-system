import api from './api';

// POST /api/auth/login  ->  { token, user }
export async function loginRequest(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

// PUT /api/auth/settings  ->  { settings }   (saved on the user, so they follow you across devices)
export async function saveSettings(settings) {
  const { data } = await api.put('/auth/settings', settings);
  return data;
}
