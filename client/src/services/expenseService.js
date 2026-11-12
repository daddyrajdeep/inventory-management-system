import api from './api';

// GET /api/expenses?category=&from=&to=&search=&limit=
export async function getExpenses(params) {
  const { data } = await api.get('/expenses', { params });
  return data;
}

// POST /api/expenses   body: { title, category, amount, date, note }
export async function createExpense(payload) {
  const { data } = await api.post('/expenses', payload);
  return data;
}

// PUT /api/expenses/:id   body: { title, category, amount, date, note }
export async function updateExpense(id, payload) {
  const { data } = await api.put(`/expenses/${id}`, payload);
  return data;
}

// DELETE /api/expenses/:id
export async function deleteExpense(id) {
  const { data } = await api.delete(`/expenses/${id}`);
  return data;
}
