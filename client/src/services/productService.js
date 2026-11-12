import api from './api';

// GET /api/products?search=&category=&supplier=&status=&includeInactive=true
export async function getProducts(params) {
  const { data } = await api.get('/products', { params });
  return data;
}

// GET /api/products/:id
export async function getProductById(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

// POST /api/products
export async function createProduct(payload) {
  const { data } = await api.post('/products', payload);
  return data;
}

// PUT /api/products/:id
export async function updateProduct(id, payload) {
  const { data } = await api.put(`/products/${id}`, payload);
  return data;
}

// DELETE /api/products/:id
export async function deleteProduct(id) {
  const { data } = await api.delete(`/products/${id}`);
  return data;
}
