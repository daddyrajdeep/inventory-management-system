// EXAMPLE frontend service. Replace the dummy-data body of your service file with calls like these.
// Put it in client/src/services/ (your own service file). Pages keep calling the same function names.
import api from './api';

export async function getCategories() {
  const { data } = await api.get('/categories');
  return data; // array of { id, name, description }
}

export async function createCategory({ name, description }) {
  const { data } = await api.post('/categories', { name, description });
  return data;
}

export async function updateCategory(id, { name, description }) {
  const { data } = await api.put(`/categories/${id}`, { name, description });
  return data;
}

export async function deleteCategory(id) {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
}
