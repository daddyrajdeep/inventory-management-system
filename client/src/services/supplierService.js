import api from './api';

// GET /api/suppliers?search=&includeInactive=true
export async function getSuppliers(params) {
  const { data } = await api.get('/suppliers', { params });
  return data;
}

// GET /api/suppliers/:id
export async function getSupplierById(id) {
  const { data } = await api.get(`/suppliers/${id}`);
  return data;
}

// POST /api/suppliers
export async function createSupplier(payload) {
  const { data } = await api.post('/suppliers', payload);
  return data;
}

// PUT /api/suppliers/:id
export async function updateSupplier(id, payload) {
  const { data } = await api.put(`/suppliers/${id}`, payload);
  return data;
}

// DELETE /api/suppliers/:id
export async function deleteSupplier(id) {
  const { data } = await api.delete(`/suppliers/${id}`);
  return data;
}
