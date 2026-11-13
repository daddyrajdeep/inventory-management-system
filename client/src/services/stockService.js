import api from "./api";

// OWNER: Brijesh (Inventory)
// Product.quantity changes only through these stock endpoints. The server records the
// StockMovement (previousQty, newQty, performedBy from the login token) and any low-stock alert.

// GET /api/stock  ->  active products with stockStatus ('ok' | 'low' | 'out')
export async function getStock() {
  const { data } = await api.get("/stock");
  return data;
}

// GET /api/stock/movements?product=&type=&limit=  (newest first)
export async function getMovements({ product, type, limit } = {}) {
  const params = {};
  if (product) params.product = product;
  if (type) params.type = type;
  if (limit) params.limit = limit;
  const { data } = await api.get("/stock/movements", { params });
  return data;
}

// POST /api/stock/in  body: { product, quantity, reason }
export async function stockIn({ productId, quantity, reason }) {
  const { data } = await api.post("/stock/in", {
    product: productId,
    quantity: Number(quantity),
    reason,
  });
  return data;
}

// POST /api/stock/out  body: { product, quantity, reason }
export async function stockOut({ productId, quantity, reason }) {
  const { data } = await api.post("/stock/out", {
    product: productId,
    quantity: Number(quantity),
    reason,
  });
  return data;
}

// POST /api/stock/adjust  body: { product, newQty, reason }  (admin / manager; reason required)
export async function adjustStock({ productId, newQty, reason }) {
  const { data } = await api.post("/stock/adjust", {
    product: productId,
    newQty: Number(newQty),
    reason,
  });
  return data;
}
