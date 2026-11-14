// Seeds a coherent demo business so every page reconciles: products, categories, suppliers,
// users/roles, purchase orders (received/ordered/draft/cancelled), ~6 months of sales and the
// matching stock movements, expenses, and alerts derived from the final stock.
//
// Run:  npm run seed            (idempotent: skips users that exist; skips business data if products exist)
//       npm run seed -- --reset (clears business data and re-seeds; KEEPS user accounts)
//
// Stock math reconciles exactly: opening + received + adjustments - sold = final quantity.
// DEMO PASSWORDS: never use these on a real, deployed system.
import 'dotenv/config';
import './../config/mongooseSetup.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { User, Category, Supplier, Product, Sale, StockMovement, Expense, PurchaseOrder, Alert, Counter } from '../models/index.js';
import { nextNumber } from '../utils/sequence.js';

const RESET = process.argv.includes('--reset');

if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  console.error('Refusing to seed demo users with published passwords in production. Use --force if you really mean it.');
  process.exit(1);
}

const demoUsers = [
  { name: 'Admin User', email: 'admin@demo.com', password: 'Admin@123', role: 'admin' },
  { name: 'Priya Manager', email: 'priya@demo.com', password: 'Manager@123', role: 'manager' },
  { name: 'Rahul Staff', email: 'rahul@demo.com', password: 'Staff@123', role: 'staff' },
  { name: 'Sneha Staff', email: 'sneha@demo.com', password: 'Staff@123', role: 'staff', isActive: false },
];

await connectDB();

// ---------- users (always preserved) ----------
for (const data of demoUsers) {
  const exists = await User.findOne({ email: data.email });
  if (exists) { console.log(`skipped  ${data.email} (already exists)`); continue; }
  await User.create(data);
  console.log(`created  ${data.email}  password: ${data.password}  role: ${data.role}`);
}

// ---------- optional reset of business data (keeps users) ----------
if (RESET) {
  await Promise.all([
    Category.deleteMany({}), Supplier.deleteMany({}), Product.deleteMany({}),
    Sale.deleteMany({}), StockMovement.deleteMany({}), Expense.deleteMany({}),
    PurchaseOrder.deleteMany({}), Alert.deleteMany({}), Counter.deleteMany({}),
  ]);
  console.log('reset    cleared business data (users kept)');
}

// ---------- demo business data ----------
if (!RESET && (await Product.countDocuments()) > 0) {
  console.log('Products already exist, so business data was NOT added. Use --reset to rebuild it.');
} else {
  const admin = await User.findOne({ email: 'admin@demo.com' });
  const staff = await User.findOne({ email: 'rahul@demo.com' });
  const manager = await User.findOne({ email: 'priya@demo.com' });
  if (!admin || !staff || !manager) {
    console.error('Demo users admin@demo.com, priya@demo.com and rahul@demo.com are required. Nothing else was added.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const cats = Object.fromEntries(
    (await Category.insertMany(
      ['Electronics', 'Stationery', 'Home', 'Furniture', 'Grocery', 'Personal Care'].map((name) => ({ name }))
    )).map((c) => [c.name, c._id])
  );
  const sups = await Supplier.insertMany([
    { name: 'ABC Technologies', contactPerson: 'Anil Das', email: 'abc@example.com', phone: '9876543210', address: 'Kolkata' },
    { name: 'Global Stationers', contactPerson: 'Meera Shah', email: 'global@example.com', phone: '9876543211', address: 'Howrah' },
    { name: 'Modern Furniture', contactPerson: 'Karan Roy', email: 'modern@example.com', phone: '9876543212', address: 'Kolkata' },
    { name: 'Daily Needs Co', contactPerson: 'Farah Khan', email: 'daily@example.com', phone: '9876543213', address: 'Durgapur' },
    { name: 'Hygiene Plus', contactPerson: 'Ravi Menon', email: 'hygiene@example.com', phone: '9876543214', address: 'Siliguri' },
  ]);
  const [abc, global, modern, daily, hygiene] = sups;

  // finalQty = the quantity the demo ENDS with. Edge cases: out of stock (0) and low (<= reorder).
  const catalogue = [
    { name: 'Wireless Mouse', sku: 'WM-001', barcode: '8901001000011', category: cats.Electronics, supplier: abc._id, costPrice: 380, price: 599, finalQty: 120, reorderLevel: 20, unit: 'pcs' },
    { name: 'USB-C Cable', sku: 'UC-002', barcode: '8901001000028', category: cats.Electronics, supplier: abc._id, costPrice: 120, price: 249, finalQty: 8, reorderLevel: 25, unit: 'pcs' },
    { name: 'Notebook A5', sku: 'NB-003', barcode: '8901002000035', category: cats.Stationery, supplier: global._id, costPrice: 45, price: 79, finalQty: 340, reorderLevel: 50, unit: 'pcs' },
    { name: 'Desk Lamp', sku: 'DL-004', barcode: '8901003000042', category: cats.Home, supplier: daily._id, costPrice: 520, price: 899, finalQty: 0, reorderLevel: 10, unit: 'pcs' },
    { name: 'Water Bottle 1L', sku: 'WB-005', barcode: '8901003000059', category: cats.Home, supplier: daily._id, costPrice: 190, price: 349, finalQty: 64, reorderLevel: 15, unit: 'pcs' },
    { name: 'Office Chair', sku: 'OC-006', barcode: '8901004000066', category: cats.Furniture, supplier: modern._id, costPrice: 3600, price: 5499, finalQty: 12, reorderLevel: 5, unit: 'pcs' },
    { name: 'HDMI Cable', sku: 'HC-007', barcode: '8901001000073', category: cats.Electronics, supplier: abc._id, costPrice: 170, price: 329, finalQty: 15, reorderLevel: 20, unit: 'pcs' },
    { name: 'Sticky Notes', sku: 'SN-008', barcode: '8901002000080', category: cats.Stationery, supplier: global._id, costPrice: 28, price: 59, finalQty: 210, reorderLevel: 40, unit: 'pcs' },
    { name: 'Bluetooth Speaker', sku: 'BS-009', barcode: '8901001000097', category: cats.Electronics, supplier: abc._id, costPrice: 1100, price: 1799, finalQty: 6, reorderLevel: 10, unit: 'pcs' },
    { name: 'Mechanical Keyboard', sku: 'KB-010', barcode: '8901001000103', category: cats.Electronics, supplier: abc._id, costPrice: 1500, price: 2499, finalQty: 45, reorderLevel: 15, unit: 'pcs' },
    { name: 'Gel Pen Pack', sku: 'GP-011', barcode: '8901002000110', category: cats.Stationery, supplier: global._id, costPrice: 60, price: 120, finalQty: 3, reorderLevel: 30, unit: 'pack' },
    { name: 'Storage Box', sku: 'SB-012', barcode: '8901003000127', category: cats.Home, supplier: daily._id, costPrice: 240, price: 449, finalQty: 80, reorderLevel: 20, unit: 'pcs' },
    { name: 'Wall Clock', sku: 'CK-013', barcode: '8901003000134', category: cats.Home, supplier: daily._id, costPrice: 300, price: 599, finalQty: 22, reorderLevel: 10, unit: 'pcs' },
    { name: 'Study Table', sku: 'TB-014', barcode: '8901004000141', category: cats.Furniture, supplier: modern._id, costPrice: 4200, price: 6999, finalQty: 4, reorderLevel: 5, unit: 'pcs' },
    { name: 'Coffee Beans 1kg', sku: 'CB-015', barcode: '8901005000158', category: cats.Grocery, supplier: daily._id, costPrice: 480, price: 799, finalQty: 0, reorderLevel: 25, unit: 'kg' },
    { name: 'Green Tea 100g', sku: 'GT-016', barcode: '8901005000165', category: cats.Grocery, supplier: daily._id, costPrice: 110, price: 199, finalQty: 150, reorderLevel: 40, unit: 'pack' },
    { name: 'Hand Sanitizer 500ml', sku: 'HP-017', barcode: '8901006000172', category: cats.PersonalCare, supplier: hygiene._id, costPrice: 90, price: 179, finalQty: 9, reorderLevel: 20, unit: 'bottle' },
    { name: 'Bath Towel', sku: 'TW-018', barcode: '8901003000189', category: cats.Home, supplier: hygiene._id, costPrice: 180, price: 349, finalQty: 60, reorderLevel: 15, unit: 'pcs' },
  ];

  // Deterministic PRNG so every run produces the same demo.
  let seed = 42;
  const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pickOne = (list) => list[Math.floor(rand() * list.length)];
  const shuffle = (list) => { const out = [...list]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; };
  const daysAgo = (n, hour = 11) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(hour, Math.floor(rand() * 60), 0, 0); return d; };

  // ~6 months of sales, 0-3 invoices a day. Planned first so opening stock can cover them.
  const customers = ['Walk-in', 'Walk-in', 'Walk-in', 'Aman Traders', 'City Mart', 'TechMart Pvt. Ltd.', 'Campus Stores', 'Bright Solutions', 'Neha Gupta', 'Rohan Ltd.'];
  const planned = [];
  for (let day = 180; day >= 0; day--) {
    for (let n = Math.floor(rand() * 4); n > 0; n--) {
      const picked = shuffle(catalogue).slice(0, 1 + Math.floor(rand() * 3));
      const items = picked.map((p) => ({ product: p.sku, name: p.name, quantity: 1 + Math.floor(rand() * 4), unitPrice: p.price }));
      const gross = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      planned.push({
        items,
        discount: rand() < 0.2 ? Math.round(gross * 0.05) : 0,
        customerName: pickOne(customers),
        paymentMethod: pickOne(['cash', 'upi', 'upi', 'card']),
        soldBy: rand() < 0.5 ? admin._id : staff._id,
        createdAt: daysAgo(day),
      });
    }
  }
  const soldTotals = new Map();
  for (const sale of planned) for (const i of sale.items) soldTotals.set(i.product, (soldTotals.get(i.product) || 0) + i.quantity);

  // Received purchase orders (old) add stock; pending ones (recent) do not.
  const receivedPOs = [
    { supplier: abc._id, items: [{ sku: 'WM-001', quantity: 60, unitCost: 380 }] },
    { supplier: global._id, items: [{ sku: 'NB-003', quantity: 100, unitCost: 45 }, { sku: 'SN-008', quantity: 80, unitCost: 28 }] },
  ];
  const receivedTotals = new Map();
  for (const po of receivedPOs) for (const i of po.items) receivedTotals.set(i.sku, (receivedTotals.get(i.sku) || 0) + i.quantity);

  // A couple of stock adjustments (damage / stock take).
  const adjustments = [
    { sku: 'WM-001', delta: -3, reason: 'Damaged in transit' },
    { sku: 'NB-003', delta: 5, reason: 'Stock take correction' },
  ];
  const adjustDeltas = new Map(adjustments.map((a) => [a.sku, a.delta]));

  // opening = final + sold - received - adjust  (guarantees the ledger reconciles to finalQty)
  const openingOf = (p) => p.finalQty + (soldTotals.get(p.sku) || 0) - (receivedTotals.get(p.sku) || 0) - (adjustDeltas.get(p.sku) || 0);
  for (const p of catalogue) {
    if (openingOf(p) < 0) { console.error(`Seed math error: opening stock for ${p.sku} would be negative.`); await mongoose.disconnect(); process.exit(1); }
  }

  const products = await Product.insertMany(catalogue.map((p) => { const { finalQty, ...fields } = p; return { ...fields, quantity: openingOf(p) }; }));
  const bySku = new Map(products.map((p) => [p.sku, p]));
  const running = new Map(products.map((p) => [p.sku, p.quantity]));

  // Opening stock movements (before everything else).
  await StockMovement.insertMany(products.map((p) => ({
    product: p._id, type: 'IN', quantity: p.quantity, previousQty: 0, newQty: p.quantity,
    reason: 'Opening stock (seed)', performedBy: admin._id, createdAt: daysAgo(182, 9),
  })));

  // Received POs + their IN movements (dated before the sales period).
  for (const po of receivedPOs) {
    const order = await PurchaseOrder.create({
      orderNumber: await nextNumber('PO'), supplier: po.supplier, status: 'received', createdBy: manager._id,
      items: po.items.map((i) => ({ product: bySku.get(i.sku)._id, quantity: i.quantity, unitCost: i.unitCost })),
      expectedDate: daysAgo(185), receivedDate: daysAgo(181, 10), createdAt: daysAgo(186), notes: 'Opening refill',
    });
    for (const i of po.items) {
      const previousQty = running.get(i.sku); const newQty = previousQty + i.quantity; running.set(i.sku, newQty);
      await StockMovement.create({ product: bySku.get(i.sku)._id, type: 'IN', quantity: i.quantity, previousQty, newQty, reason: `Received ${order.orderNumber}`, referenceModel: 'PurchaseOrder', referenceId: order._id, performedBy: manager._id, createdAt: daysAgo(181, 10) });
    }
  }

  // Adjustments (before sales).
  for (const a of adjustments) {
    const previousQty = running.get(a.sku); const newQty = previousQty + a.delta; running.set(a.sku, newQty);
    await StockMovement.create({ product: bySku.get(a.sku)._id, type: 'ADJUST', quantity: Math.abs(a.delta), previousQty, newQty, reason: a.reason, performedBy: manager._id, createdAt: daysAgo(181, 12) });
  }

  // Sales + their OUT movements, chronologically.
  let saleCount = 0;
  for (const plan of planned) {
    const sale = await Sale.create({ ...plan, invoiceNumber: await nextNumber('INV'), items: plan.items.map((i) => ({ ...i, product: bySku.get(i.product)._id })) });
    for (const i of plan.items) {
      const previousQty = running.get(i.product); const newQty = previousQty - i.quantity; running.set(i.product, newQty);
      await StockMovement.create({ product: bySku.get(i.product)._id, type: 'OUT', quantity: i.quantity, previousQty, newQty, reason: `Sold on ${sale.invoiceNumber}`, referenceModel: 'Sale', referenceId: sale._id, performedBy: plan.soldBy, createdAt: plan.createdAt });
    }
    saleCount++;
  }
  for (const p of products) await Product.updateOne({ _id: p._id }, { quantity: running.get(p.sku) });

  // Pending / cancelled purchase orders (recent activity; do not change stock).
  await PurchaseOrder.create({ orderNumber: await nextNumber('PO'), supplier: daily._id, status: 'ordered', createdBy: manager._id, items: [{ product: bySku.get('CB-015')._id, quantity: 50, unitCost: 480 }, { product: bySku.get('GT-016')._id, quantity: 40, unitCost: 110 }], expectedDate: daysAgo(-5), createdAt: daysAgo(2), notes: 'Restock grocery' });
  await PurchaseOrder.create({ orderNumber: await nextNumber('PO'), supplier: hygiene._id, status: 'draft', createdBy: manager._id, items: [{ product: bySku.get('HP-017')._id, quantity: 30, unitCost: 90 }, { product: bySku.get('TW-018')._id, quantity: 20, unitCost: 180 }], expectedDate: daysAgo(-10), createdAt: daysAgo(1) });
  await PurchaseOrder.create({ orderNumber: await nextNumber('PO'), supplier: modern._id, status: 'cancelled', createdBy: admin._id, items: [{ product: bySku.get('TB-014')._id, quantity: 10, unitCost: 4200 }], createdAt: daysAgo(8), notes: 'Supplier could not fulfil' });

  // ~6 months of expenses.
  const expenseTemplates = [
    ['Shop rent', 'office', 25000, 1], ['Electricity bill', 'office', 4200, 1],
    ['Employee salaries', 'salaries', 65000, 1], ['Accountant fees', 'professional', 6000, 1],
    ['Packaging and delivery', 'other', 3500, 2],
  ];
  let expenseCount = 0;
  for (let month = 5; month >= 0; month--) {
    for (const [title, category, amount, times] of expenseTemplates) {
      for (let t = 0; t < times; t++) {
        await Expense.create({ title, category, amount: Math.round(amount * (0.9 + rand() * 0.2)), createdBy: admin._id, date: daysAgo(month * 30 + 3 + t * 12, 10) });
        expenseCount++;
      }
    }
  }

  // Alerts derived from the FINAL stock, so they always match the Inventory page.
  const finalProducts = await Product.find();
  const alerts = [];
  for (const p of finalProducts) {
    if (p.quantity === 0) alerts.push({ type: 'OUT_OF_STOCK', product: p._id, message: `${p.name} is out of stock` });
    else if (p.quantity <= p.reorderLevel) alerts.push({ type: 'LOW_STOCK', product: p._id, message: `${p.name} is low on stock (${p.quantity} left, reorder level ${p.reorderLevel})` });
  }
  if (alerts.length) await Alert.create(alerts);

  const revenue = (await Sale.find()).reduce((s, x) => s + x.totalAmount, 0);
  console.log(`created  ${Object.keys(cats).length} categories, ${sups.length} suppliers, ${products.length} products, ${saleCount} sales, ${expenseCount} expenses, ${receivedPOs.length + 3} purchase orders, ${alerts.length} alerts`);
  console.log(`reconciled: final stock set from opening + received + adjustments - sold; sales revenue ₹${revenue.toLocaleString('en-IN')}`);
}

await mongoose.disconnect();
console.log('Seeding finished.');
