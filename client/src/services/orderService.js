import { products } from "../data/products";
import { stockIn } from "./stockService";
import { delay } from "../utils/delay";

// OWNER: Shilpa (Purchase Orders)
// Dummy-data version. Orders are kept in memory, so they work until you refresh the page.
// Field names follow server/src/models/PurchaseOrder.js.
//
// Backend phase: replace each body with an API call, for example:
//   getOrders:         const { data } = await api.get('/purchase-orders'); return data;
//   createOrder:       const { data } = await api.post('/purchase-orders', payload); return data;
//   updateOrderStatus: const { data } = await api.patch(`/purchase-orders/${id}/status`, { status }); return data;
//   receiveOrder:      const { data } = await api.post(`/purchase-orders/${id}/receive`); return data;
// (the server adds the stock and writes the StockMovements inside one transaction)

// Temporary supplier list until the Suppliers page (feature/categories-suppliers) has its own service.
// Backend phase: replace with  await api.get('/suppliers')
const suppliers = [
  { id: "s1", name: "TechSource Pvt Ltd", isActive: true },
  { id: "s2", name: "Paper World", isActive: true },
  { id: "s3", name: "HomeGoods Traders", isActive: true },
];

const productInfo = (id) => products.find((p) => p.id === id);

let counter = 2;
let orders = [
  {
    id: "po1",
    orderNumber: "PO-2026-0001",
    supplier: "s1",
    supplierName: "TechSource Pvt Ltd",
    items: [
      {
        product: "p2",
        productName: "USB-C Cable",
        sku: "UC-002",
        quantity: 50,
        unitCost: 120,
      },
    ],
    status: "ordered",
    totalAmount: 6000,
    expectedDate: "2026-11-20",
    receivedDate: null,
    notes: "Low stock refill",
    createdBy: "admin@demo.com",
    createdAt: "2026-11-05T10:00:00.000Z",
  },
  {
    id: "po2",
    orderNumber: "PO-2026-0002",
    supplier: "s3",
    supplierName: "HomeGoods Traders",
    items: [
      {
        product: "p4",
        productName: "Desk Lamp",
        sku: "DL-004",
        quantity: 20,
        unitCost: 450,
      },
    ],
    status: "draft",
    totalAmount: 9000,
    expectedDate: "2026-11-25",
    receivedDate: null,
    notes: "",
    createdBy: "admin@demo.com",
    createdAt: "2026-11-07T10:00:00.000Z",
  },
];

const total = (items) =>
  items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
const copy = (o) => ({ ...o, items: o.items.map((i) => ({ ...i })) });

function findOrder(id) {
  const order = orders.find((o) => o.id === id);
  if (!order) throw new Error("Order not found");
  return order;
}

export async function getSuppliers() {
  await delay();
  return suppliers.filter((s) => s.isActive).map((s) => ({ ...s }));
}

// Newest first
export async function getOrders() {
  await delay();
  return orders.map(copy);
}

// payload: { supplier, items: [{ product, quantity, unitCost }], expectedDate, notes, createdBy, status }
export async function createOrder({
  supplier,
  items,
  expectedDate,
  notes,
  createdBy,
  status = "draft",
}) {
  await delay();
  const sup = suppliers.find((s) => s.id === supplier);
  if (!sup) throw new Error("Please choose a supplier");
  if (!items || items.length === 0) throw new Error("Add at least one item");

  const lines = items.map((i) => {
    const p = productInfo(i.product);
    const quantity = Number(i.quantity);
    const unitCost = Number(i.unitCost);
    if (!p) throw new Error("Product not found");
    if (!Number.isInteger(quantity) || quantity < 1)
      throw new Error(
        `Quantity for ${p.name} must be a whole number of at least 1`,
      );
    if (!(unitCost >= 0))
      throw new Error(`Unit cost for ${p.name} cannot be negative`);
    return {
      product: p.id,
      productName: p.name,
      sku: p.sku,
      quantity,
      unitCost,
    };
  });

  counter += 1;
  const order = {
    id: `po${Date.now()}`,
    orderNumber: `PO-${new Date().getFullYear()}-${String(counter).padStart(4, "0")}`,
    supplier: sup.id,
    supplierName: sup.name,
    items: lines,
    status,
    totalAmount: total(lines),
    expectedDate: expectedDate || null,
    receivedDate: null,
    notes: notes?.trim() || "",
    createdBy,
    createdAt: new Date().toISOString(),
  };
  orders = [order, ...orders];
  return copy(order);
}

// Allowed moves: draft -> ordered, draft/ordered -> cancelled. "received" only through receiveOrder().
export async function updateOrderStatus(id, status) {
  await delay();
  const order = findOrder(id);
  const allowed = { draft: ["ordered", "cancelled"], ordered: ["cancelled"] };
  if (!allowed[order.status]?.includes(status)) {
    throw new Error(`Cannot change a ${order.status} order to ${status}`);
  }
  order.status = status;
  return copy(order);
}

// Marks the order received AND adds every item to stock (one StockMovement per item).
export async function receiveOrder(id, performedBy) {
  await delay();
  const order = findOrder(id);
  if (order.status !== "ordered")
    throw new Error("Only an ordered purchase order can be received");

  for (const item of order.items) {
    await stockIn({
      productId: item.product,
      quantity: item.quantity,
      reason: `Received ${order.orderNumber}`,
      performedBy,
      referenceModel: "PurchaseOrder",
      referenceId: order.id,
    });
  }
  order.status = "received";
  order.receivedDate = new Date().toISOString();
  return copy(order);
}
