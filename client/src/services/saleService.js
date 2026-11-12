import api from './api';

// GET /api/sales?from=&to=&paymentMethod=&search=&limit=
export async function getSales(params) {
  const { data } = await api.get('/sales', { params });
  return data;
}

// GET /api/sales/:id
export async function getSaleById(id) {
  const { data } = await api.get(`/sales/${id}`);
  return data;
}

// POST /api/sales   body: { items: [{ product, quantity }], discount, customerName, paymentMethod }
export async function createSale(payload) {
  const { data } = await api.post('/sales', payload);
  return data;
}
