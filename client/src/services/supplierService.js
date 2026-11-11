import api from './api';

export async function getSuppliers() {
  const { data } = await api.get('/suppliers');
  return data;
}

export async function createSupplier(supplier) {
  const { data } = await api.post('/suppliers', supplier);
  return data;
}

export async function updateSupplier(id, supplier) {
  const { data } = await api.put(`/suppliers/${id}`, supplier);
  return data;
}

export async function deleteSupplier(id) {
  const { data } = await api.delete(`/suppliers/${id}`);
  return data;
}