import api from "./api";

// Admin / manager only. Shapes follow serializeOrder in server/src/utils/serializers.js.

// GET /api/purchase-orders?status=   (newest first)
export async function getOrders(params) {
  const { data } = await api.get("/purchase-orders", { params });
  return data;
}

// GET /api/purchase-orders/:id
export async function getOrderById(id) {
  const { data } = await api.get(`/purchase-orders/${id}`);
  return data;
}

// POST /api/purchase-orders
// payload: { supplier, items: [{ product, quantity, unitCost }], expectedDate, notes, status: 'draft' | 'ordered' }
// The server assigns orderNumber (PO-YYYY-NNNN) and createdBy.
export async function createOrder({
  supplier,
  items,
  expectedDate,
  notes,
  status = "draft",
}) {
  const { data } = await api.post("/purchase-orders", {
    supplier,
    items: items.map((i) => ({
      product: i.product,
      quantity: Number(i.quantity),
      unitCost: Number(i.unitCost),
    })),
    expectedDate: expectedDate || undefined,
    notes: notes?.trim() || "",
    status,
  });
  return data;
}

// PATCH /api/purchase-orders/:id/status   body: { status: 'ordered' | 'cancelled' }
// Allowed moves: draft -> ordered/cancelled, ordered -> cancelled. "received" only through receiveOrder().
export async function updateOrderStatus(id, status) {
  const { data } = await api.patch(`/purchase-orders/${id}/status`, { status });
  return data;
}

// POST /api/purchase-orders/:id/receive
// The server marks the order received and adds every item to stock in one transaction.
export async function receiveOrder(id) {
  const { data } = await api.post(`/purchase-orders/${id}/receive`);
  return data;
}

// Convenience: cancel via the status endpoint.
export async function cancelOrder(id) {
  return updateOrderStatus(id, "cancelled");
}
