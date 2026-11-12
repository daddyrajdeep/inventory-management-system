// Turns database documents into the exact JSON the frontend pages use.
// The pages show names (category name, supplier name, who did it), so we send those next to the ids.

const idOf = (value) => (value && value._id ? String(value._id) : value ? String(value) : null);
const nameOf = (value) => (value && typeof value === 'object' && 'name' in value ? value.name : undefined);

// Product: needs  .populate('category', 'name').populate('supplier', 'name')
export function serializeProduct(product) {
  const p = product.toJSON();
  const status = p.quantity === 0 ? 'out' : p.quantity <= p.reorderLevel ? 'low' : 'ok';
  return {
    ...p,
    category: nameOf(product.category) ?? '', // the pages show the name
    categoryId: idOf(product.category),
    supplier: nameOf(product.supplier) ?? '',
    supplierId: idOf(product.supplier),
    stockStatus: status, // 'ok' | 'low' | 'out'
  };
}

// StockMovement: needs  .populate('product', 'name sku').populate('performedBy', 'name')
export function serializeMovement(movement) {
  const m = movement.toJSON();
  return {
    id: m.id,
    product: idOf(movement.product),
    productName: nameOf(movement.product),
    sku: movement.product?.sku,
    type: m.type,
    quantity: m.quantity,
    previousQty: m.previousQty,
    newQty: m.newQty,
    reason: m.reason || '',
    referenceModel: m.referenceModel,
    referenceId: m.referenceId ? String(m.referenceId) : undefined,
    performedBy: nameOf(movement.performedBy) ?? idOf(movement.performedBy),
    performedById: idOf(movement.performedBy),
    createdAt: m.createdAt,
  };
}

// PurchaseOrder: needs  .populate('supplier', 'name').populate('items.product', 'name sku').populate('createdBy', 'name')
export function serializeOrder(order) {
  const o = order.toJSON();
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    supplier: idOf(order.supplier),
    supplierName: nameOf(order.supplier),
    items: order.items.map((i) => ({
      product: idOf(i.product),
      productName: nameOf(i.product),
      sku: i.product?.sku,
      quantity: i.quantity,
      unitCost: i.unitCost,
    })),
    status: o.status,
    totalAmount: o.totalAmount,
    expectedDate: o.expectedDate ?? null,
    receivedDate: o.receivedDate ?? null,
    notes: o.notes || '',
    createdBy: nameOf(order.createdBy) ?? idOf(order.createdBy),
    createdAt: o.createdAt,
  };
}

// Sale: needs  .populate('soldBy', 'name')      withItems = true for the detail view
export function serializeSale(sale, withItems = false) {
  const s = sale.toJSON();
  const out = {
    id: s.id,
    invoiceNumber: s.invoiceNumber,
    customerName: s.customerName || 'Walk-in',
    paymentMethod: s.paymentMethod,
    discount: s.discount,
    totalAmount: s.totalAmount,
    itemCount: sale.items.reduce((sum, i) => sum + i.quantity, 0), // total units
    lineCount: sale.items.length,
    soldBy: nameOf(sale.soldBy) ?? idOf(sale.soldBy),
    createdAt: s.createdAt,
  };
  if (withItems) out.items = s.items.map((i) => ({ ...i, product: String(i.product) }));
  return out;
}

// Expense: needs  .populate('createdBy', 'name')
export function serializeExpense(expense) {
  const e = expense.toJSON();
  return { ...e, createdBy: nameOf(expense.createdBy) ?? idOf(expense.createdBy) };
}
