import api from './api';

// GET /api/reports/summary?days=30  OR  ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getSummary(params) {
  const { data } = await api.get('/reports/summary', { params });
  return data;
}

// GET /api/reports/top-products?limit=5&sortBy=revenue|quantity&days=30
export async function getTopProducts(params) {
  const { data } = await api.get('/reports/top-products', { params });
  return data;
}

// GET /api/reports/sales-by-day?days=30
export async function getSalesByDay(params) {
  const { data } = await api.get('/reports/sales-by-day', { params });
  return data;
}

// GET /api/reports/expense-by-category?days=30
export async function getExpenseByCategory(params) {
  const { data } = await api.get('/reports/expense-by-category', { params });
  return data;
}
