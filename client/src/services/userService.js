import { users as seed } from '../data/users';
import { delay } from '../utils/delay';

// Dummy-data version. It keeps changes in memory, so add/edit works until you refresh the page.
// Backend phase: replace each body with an API call, for example:
//   getUsers:       const { data } = await api.get('/users'); return data;
//   createUser:     const { data } = await api.post('/users', payload); return data;
//   updateUserRole: await api.patch(`/users/${id}/role`, { role });

let list = seed.map((u) => ({ ...u }));

export async function getUsers() {
  await delay();
  return list.map((u) => ({ ...u }));
}

// The password is only used by the real backend, so it is ignored here
export async function createUser({ name, email, role }) {
  await delay();
  if (list.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('A user with this email already exists');
  }
  const user = { id: `u${Date.now()}`, name, email, role, isActive: true };
  list = [...list, user];
  return { ...user };
}

export async function updateUserRole(id, role) {
  await delay();
  list = list.map((u) => (u.id === id ? { ...u, role } : u));
  return list.find((u) => u.id === id);
}

export async function setUserActive(id, isActive) {
  await delay();
  list = list.map((u) => (u.id === id ? { ...u, isActive } : u));
  return list.find((u) => u.id === id);
}

// Backend phase: await api.put('/auth/profile', profile)
export async function updateProfile(profile) {
  await delay();
  return profile;
}

// Backend phase: await api.put('/auth/password', { currentPassword, newPassword })
export async function changePassword() {
  await delay();
  return true;
}
