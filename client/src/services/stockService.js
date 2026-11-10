import { products } from "../data/products";
import { delay } from "../utils/delay";

// OWNER: Brijesh (Inventory)
// Dummy-data version. Stock changes are kept in memory, so they work until you refresh the page.
// Product.quantity changes ONLY here, and every change also writes a StockMovement
// (same fields as server/src/models/StockMovement.js).
//
// Backend phase: replace each body with an API call, for example:
//   getStock:      const { data } = await api.get('/products'); return data;
//   getMovements:  const { data } = await api.get('/stock/movements'); return data;
//   stockIn:       const { data } = await api.post('/stock/in', { product, quantity, reason }); return data;
//   stockOut:      const { data } = await api.post('/stock/out', { product, quantity, reason }); return data;
//   adjustStock:   const { data } = await api.post('/stock/adjust', { product, newQty, reason }); return data;
// (the server fills in previousQty, newQty and performedBy)

let movements = [];

function findProduct(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) throw new Error("Product not found");
  return product;
}

function isWholeNumber(n) {
  return Number.isInteger(n);
}

// quantity is always positive; type gives the direction (same rule as the model)
function recordMovement({
  product,
  type,
  quantity,
  previousQty,
  newQty,
  reason,
  performedBy,
  referenceModel = "Manual",
  referenceId,
}) {
  const movement = {
    id: `m${Date.now()}${movements.length}`,
    product: product.id,
    productName: product.name,
    sku: product.sku,
    type,
    quantity,
    previousQty,
    newQty,
    reason: reason?.trim() || "",
    referenceModel,
    referenceId,
    performedBy,
    createdAt: new Date().toISOString(),
  };
  movements = [movement, ...movements];
  return { ...movement };
}

export async function getStock() {
  await delay();
  return products.map((p) => ({ ...p }));
}

// Newest first. Pass a productId to see the history of one product.
export async function getMovements(productId) {
  await delay();
  const list = productId
    ? movements.filter((m) => m.product === productId)
    : movements;
  return list.map((m) => ({ ...m }));
}

// referenceModel / referenceId are optional: a purchase order passes 'PurchaseOrder' and its id
export async function stockIn({
  productId,
  quantity,
  reason,
  performedBy,
  referenceModel,
  referenceId,
}) {
  await delay();
  const product = findProduct(productId);
  const qty = Number(quantity);
  if (!isWholeNumber(qty) || qty < 1)
    throw new Error("Quantity must be a whole number of at least 1");

  const previousQty = product.quantity;
  product.quantity = previousQty + qty;
  return recordMovement({
    product,
    type: "IN",
    quantity: qty,
    previousQty,
    newQty: product.quantity,
    reason,
    performedBy,
    referenceModel,
    referenceId,
  });
}

export async function stockOut({ productId, quantity, reason, performedBy }) {
  await delay();
  const product = findProduct(productId);
  const qty = Number(quantity);
  if (!isWholeNumber(qty) || qty < 1)
    throw new Error("Quantity must be a whole number of at least 1");
  if (qty > product.quantity)
    throw new Error(`Only ${product.quantity} in stock, cannot remove ${qty}`);

  const previousQty = product.quantity;
  product.quantity = previousQty - qty;
  return recordMovement({
    product,
    type: "OUT",
    quantity: qty,
    previousQty,
    newQty: product.quantity,
    reason,
    performedBy,
  });
}

// Adjust = set the stock to the counted number (e.g. after a stock take).
// The movement stores the difference as a positive quantity.
export async function adjustStock({ productId, newQty, reason, performedBy }) {
  await delay();
  const product = findProduct(productId);
  const target = Number(newQty);
  if (!isWholeNumber(target) || target < 0)
    throw new Error("New quantity must be a whole number, 0 or more");
  if (!reason || !reason.trim())
    throw new Error("A reason is required for an adjustment");
  if (target === product.quantity)
    throw new Error("New quantity is the same as the current stock");

  const previousQty = product.quantity;
  product.quantity = target;
  return recordMovement({
    product,
    type: "ADJUST",
    quantity: Math.abs(target - previousQty),
    previousQty,
    newQty: target,
    reason,
    performedBy,
  });
}
