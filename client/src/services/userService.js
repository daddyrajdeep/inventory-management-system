import api from './api';

// Real API version. The pages call the same function names as before, so they barely change.
// Errors come back with error.message already set to the server's message.

export async function getUsers() {
  const { data } = await api.get('/users');
  return data;
}

export async function createUser({ name, email, role, password }) {
  const { data } = await api.post('/users', { name, email, role, password });
  return data;
}

export async function updateUserRole(id, role) {
  const { data } = await api.patch(`/users/${id}/role`, { role });
  return data;
}

export async function setUserActive(id, isActive) {
  const { data } = await api.patch(`/users/${id}/active`, { isActive });
  return data;
}

// Returns { user }
export async function updateProfile({ name, email }) {
  const { data } = await api.put('/auth/profile', { name, email });
  return data;
}

export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await api.put('/auth/password', { currentPassword, newPassword });
  return data;
}
