// Creates demo data so you can log in and see a full dashboard. Safe to run many times:
// existing users are skipped, and demo products/sales/expenses are only added when there are no products yet.
// Run:  npm run seed      (DEMO PASSWORDS: never use these on a real, deployed system)
import 'dotenv/config';
import './../config/mongooseSetup.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { User, Category, Supplier, Product, Sale, Expense, PurchaseOrder, Alert } from '../models/index.js';
import { nextNumber } from '../utils/sequence.js';

const demoUsers = [
  { name: 'Admin User', email: 'admin@demo.com', password: 'Admin@123', role: 'admin' },
  { name: 'Priya Manager', email: 'priya@demo.com', password: 'Manager@123', role: 'manager' },
  { name: 'Rahul Staff', email: 'rahul@demo.com', password: 'Staff@123', role: 'staff' },
  { name: 'Sneha Staff', email: 'sneha@demo.com', password: 'Staff@123', role: 'staff', isActive: false },
];

await connectDB();

// ---------- users ----------
for (const data of demoUsers) {
  const exists = await User.findOne({ email: data.email });
  if (exists) {
    console.log(`skipped  ${data.email} (already exists)`);
    continue;
  }
  await User.create(data);
  console.log(`created  ${data.email}  password: ${data.password}  role: ${data.role}`);
}

// ---------- demo business data ----------
if ((await Product.countDocuments()) > 0) {
  console.log('Products already exist, so demo products, sales and expenses were NOT added.');
} else {
  const admin = await User.findOne({ email: 'admin@demo.com' });
  const staff = await User.findOne({ email: 'rahul@demo.com' });

  const cats = Object.fromEntries(
    (await Category.insertMany(['Electronics', 'Stationery', 'Home', 'Furniture'].map((name) => ({ name })))).map((c) => [c.name, c._id])
  );
  const sups = await Supplier.insertMany([
    { name: 'ABC Technologies', contactPerson: 'Anil Das', email: 'abc@example.com', phone: '9876543210', address: 'Kolkata' },
    { name: 'Global Stationers', contactPerson: 'Meera Shah', email: 'global@example.com', phone: '9876543211', address: 'Howrah' },
    { name: 'Modern Furniture', contactPerson: 'Karan Roy', email: 'modern@example.com', phone: '9876543212', address: 'Kolkata' },
  ]);

  // quantity is set directly here (seeding only). In the app, stock only changes through the stock service.
  const products = await Product.insertMany([
    { name: 'Wireless Mouse', sku: 'WM-001', category: cats.Electronics, supplier: sups[0]._id, costPrice: 380, price: 599, quantity: 120, reorderLevel: 20, rating: 4 },
    { name: 'USB-C Cable', sku: 'UC-002', category: cats.Electronics, supplier: sups[0]._id, costPrice: 120, price: 249, quantity: 8, reorderLevel: 25, rating: 3 },
    { name: 'Notebook A5', sku: 'NB-003', category: cats.Stationery, supplier: sups[1]._id, costPrice: 45, price: 79, quantity: 340, reorderLevel: 50, rating: 4 },
    { name: 'Desk Lamp', sku: 'DL-004', category: cats.Home, supplier: sups[2]._id, costPrice: 520, price: 899, quantity: 0, reorderLevel: 10, rating: 5 },
    { name: 'Water Bottle 1L', sku: 'WB-005', category: cats.Home, supplier: sups[1]._id, costPrice: 190, price: 349, quantity: 64, reorderLevel: 15, rating: 4 },
    { name: 'Office Chair', sku: 'OC-006', category: cats.Furniture, supplier: sups[2]._id, costPrice: 3600, price: 5499, quantity: 12, reorderLevel: 5, rating: 5 },
    { name: 'HDMI Cable', sku: 'HC-007', category: cats.Electronics, supplier: sups[0]._id, costPrice: 170, price: 329, quantity: 15, reorderLevel: 20, rating: 3 },
    { name: 'Sticky Notes', sku: 'SN-008', category: cats.Stationery, supplier: sups[1]._id, costPrice: 28, price: 59, quantity: 210, reorderLevel: 40, rating: 4 },
  ]);

  // A small repeatable pseudo-random generator, so every run produces the same demo data
  let seed = 42;
  const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pickOne = (list) => list[Math.floor(rand() * list.length)];
  const daysAgo = (n, hour = 11) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, Math.floor(rand() * 60), 0, 0);
    return d;
  };

  // ~120 days of sales, 0-2 invoices a day
  const customers = ['Walk-in', 'Walk-in', 'Walk-in', 'Aman Traders', 'City Mart', 'TechMart Pvt. Ltd.', 'Campus Stores', 'Bright Solutions'];
  let saleCount = 0;
  for (let day = 120; day >= 0; day--) {
    for (let n = Math.floor(rand() * 3); n > 0; n--) {
      const picked = [...products].sort(() => rand() - 0.5).slice(0, 1 + Math.floor(rand() * 3));
      const items = picked.map((p) => ({ product: p._id, name: p.name, quantity: 1 + Math.floor(rand() * 4), unitPrice: p.price }));
      const gross = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      await Sale.create({
        invoiceNumber: await nextNumber('INV'),
        items,
        discount: rand() < 0.2 ? Math.round(gross * 0.05) : 0,
        customerName: pickOne(customers),
        paymentMethod: pickOne(['cash', 'upi', 'upi', 'card']),
        soldBy: rand() < 0.5 ? admin._id : staff._id,
        createdAt: daysAgo(day), // backdated, so the charts have history
      });
      saleCount++;
    }
  }

  // ~6 months of expenses
  const expenseTemplates = [
    ['Shop rent', 'office', 25000, 1],
    ['Electricity bill', 'office', 4200, 1],
    ['Employee salaries', 'salaries', 65000, 1],
    ['Accountant fees', 'professional', 6000, 1],
    ['Packaging and delivery', 'other', 3500, 2],
  ];
  let expenseCount = 0;
  for (let month = 5; month >= 0; month--) {
    for (const [title, category, amount, times] of expenseTemplates) {
      for (let t = 0; t < times; t++) {
        const jitter = 0.9 + rand() * 0.2;
        await Expense.create({
          title, category, amount: Math.round(amount * jitter), createdBy: admin._id,
          date: daysAgo(month * 30 + 3 + t * 12, 10),
        });
        expenseCount++;
      }
    }
  }

  // two purchase orders to play with
  await PurchaseOrder.create({
    orderNumber: await nextNumber('PO'), supplier: sups[0]._id, status: 'ordered', createdBy: admin._id,
    items: [{ product: products[1]._id, quantity: 50, unitCost: 120 }], expectedDate: daysAgo(-7), notes: 'Low stock refill',
  });
  await PurchaseOrder.create({
    orderNumber: await nextNumber('PO'), supplier: sups[2]._id, status: 'draft', createdBy: admin._id,
    items: [{ product: products[3]._id, quantity: 20, unitCost: 520 }], expectedDate: daysAgo(-14),
  });

  await Alert.create([
    { type: 'OUT_OF_STOCK', product: products[3]._id, message: 'Desk Lamp is out of stock' },
    { type: 'LOW_STOCK', product: products[1]._id, message: 'USB-C Cable is low on stock (8 left, reorder level 25)' },
    { type: 'LOW_STOCK', product: products[6]._id, message: 'HDMI Cable is low on stock (15 left, reorder level 20)' },
  ]);

  console.log(`created  4 categories, 3 suppliers, ${products.length} products, ${saleCount} sales, ${expenseCount} expenses, 2 purchase orders, 3 alerts`);
}

await mongoose.disconnect();
console.log('Seeding finished.');
