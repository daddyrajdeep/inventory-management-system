import api from './api';

// GET /api/categories
export async function getCategories() {
  const { data } = await api.get('/categories');
  return data;
}

// POST /api/categories
export async function createCategory(payload) {
  const { data } = await api.post('/categories', payload);
  return data;
}

// PUT /api/categories/:id
export async function updateCategory(id, payload) {
  const { data } = await api.put(`/categories/${id}`, payload);
  return data;
}

// DELETE /api/categories/:id
export async function deleteCategory(id) {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
}
