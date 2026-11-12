import api from "./api";

// OWNER: Brijesh (Inventory)
// Real API version. The server changes the quantity and writes the history in one transaction,
// and it fills in previousQty, newQty and who did it (the logged-in user).
// Function names and inputs are the same as the dummy version, so Inventory.jsx works unchanged.

// All products with their current quantity.
// Uses Rudra's GET /products route (it must be merged into main for this to work).
export async function getStock() {
  const { data } = await api.get("/products");
  return data;
}

// Newest first. Pass a productId to see the history of one product.
export async function getMovements(productId) {
  const { data } = await api.get("/stock/movements", {
    params: productId ? { productId } : {},
  });
  return data; // array of { id, product, productName, sku, type, quantity, previousQty, newQty, reason, performedBy, createdAt }
}

export async function stockIn({ productId, quantity, reason }) {
  const { data } = await api.post("/stock/in", {
    productId,
    quantity: Number(quantity),
    reason,
  });
  return data;
}

export async function stockOut({ productId, quantity, reason }) {
  const { data } = await api.post("/stock/out", {
    productId,
    quantity: Number(quantity),
    reason,
  });
  return data;
}

// Adjust = set the stock to the counted number (e.g. after a stock take).
export async function adjustStock({ productId, newQty, reason }) {
  const { data } = await api.post("/stock/adjust", {
    productId,
    newQuantity: Number(newQty),
    reason,
  });
  return data;
}
