import api from './api';

export async function getCategories() {
  const { data } = await api.get('/categories');
  return data;
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