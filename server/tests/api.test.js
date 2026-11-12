// End-to-end API tests. They start the real app against a TEST database and check the important rules.
//
//   1. Put a throw-away database in server/.env:   TEST_MONGO_URI=mongodb+srv://.../inventory_test
//      (the database name MUST contain "test": the tests wipe it)
//   2. npm test
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import 'dotenv/config';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

const uri = process.env.TEST_MONGO_URI;
if (!uri) throw new Error('Set TEST_MONGO_URI in server/.env (a database whose name contains "test").');
const dbName = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://')).pathname.slice(1);
if (!/test/i.test(dbName)) throw new Error(`Refusing to run: database "${dbName}" does not contain "test" in its name.`);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { default: mongoose } = await import('mongoose');
const { default: app } = await import('../src/app.js');
const { User, Alert } = await import('../src/models/index.js');

let server;
let base;
const tokens = {};
const ids = {};

// Small helper: call(method, path, token, body) -> { status, body }
async function call(method, path, token, body) {
  const res = await fetch(`${base}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}
const as = (role) => tokens[role];
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

before(async () => {
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init())); // make sure unique indexes exist
  for (const [role, email] of [['admin', 'a@t.com'], ['manager', 'm@t.com'], ['staff', 's@t.com']]) {
    await User.create({ name: `${role} user`, email, password: 'secret12', role });
  }
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
  for (const [role, email] of [['admin', 'a@t.com'], ['manager', 'm@t.com'], ['staff', 's@t.com']]) {
    const r = await call('POST', '/auth/login', null, { email, password: 'secret12' });
    assert.equal(r.status, 200);
    tokens[role] = r.body.token;
  }
});

after(async () => {
  server?.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('auth: no token is refused, staff cannot write products, manager can', async () => {
  assert.equal((await call('GET', '/products')).status, 401);
  const product = { name: 'Mouse', sku: 'wm-1', price: 600, costPrice: 400, category: 'Electronics', reorderLevel: 5 };
  assert.equal((await call('POST', '/products', as('staff'), product)).status, 403);
  const ok = await call('POST', '/products', as('manager'), product);
  assert.equal(ok.status, 201);
  ids.mouse = ok.body.id;
  assert.equal(ok.body.sku, 'WM-1', 'sku is upper-cased');
  assert.equal(ok.body.category, 'Electronics', 'category NAME is returned for the pages');
  assert.equal(ok.body.quantity, 0, 'new products start with 0 stock');
  assert.ok(ok.body.categoryId);
});

test('categories: created from a product, no duplicates, productCount, delete blocked while in use', async () => {
  const list = await call('GET', '/categories', as('staff'));
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0].productCount, 1);
  ids.electronics = list.body[0].id;
  assert.equal((await call('POST', '/categories', as('manager'), { name: 'electronics' })).status, 409, 'case-insensitive duplicate');
  assert.equal((await call('POST', '/categories', as('staff'), { name: 'Home' })).status, 403);
  const home = await call('POST', '/categories', as('manager'), { name: 'Home', description: 'Home items' });
  assert.equal(home.status, 201);
  assert.equal((await call('DELETE', `/categories/${ids.electronics}`, as('manager'))).status, 409);
  assert.equal((await call('DELETE', `/categories/${home.body.id}`, as('manager'))).status, 200);
});

test('suppliers: create, update, search, delete blocked once used', async () => {
  const s = await call('POST', '/suppliers', as('manager'), { name: 'ABC Tech', email: 'abc@x.com', phone: '999' });
  assert.equal(s.status, 201);
  ids.supplier = s.body.id;
  assert.equal((await call('POST', '/suppliers', as('manager'), { name: 'Bad', email: 'nope' })).status, 400);
  assert.equal((await call('PUT', `/suppliers/${ids.supplier}`, as('manager'), { phone: '123' })).body.phone, '123');
  assert.equal((await call('GET', '/suppliers?search=abc', as('staff'))).body.length, 1);
  const p = await call('POST', '/products', as('manager'), { name: 'Cable', sku: 'UC-2', price: 250, costPrice: 120, category: 'Electronics', supplier: 'ABC Tech', reorderLevel: 10 });
  assert.equal(p.status, 201);
  assert.equal(p.body.supplier, 'ABC Tech');
  ids.cable = p.body.id;
  assert.equal((await call('DELETE', `/suppliers/${ids.supplier}`, as('manager'))).status, 409);
});

test('products: validation, duplicate sku, quantity cannot be edited, filters, delete rules', async () => {
  assert.equal((await call('POST', '/products', as('manager'), { name: 'X', sku: 'X1', price: -5 })).status, 400);
  assert.equal((await call('POST', '/products', as('manager'), { name: 'Dup', sku: 'WM-1', price: 5 })).status, 409);
  assert.equal((await call('POST', '/products', as('manager'), { name: 'Y', sku: 'Y1', price: 5, supplier: 'No Such Supplier' })).status, 400);

  const upd = await call('PUT', `/products/${ids.mouse}`, as('manager'), { price: 650, quantity: 9999 });
  assert.equal(upd.body.price, 650);
  assert.equal(upd.body.quantity, 0, 'quantity in the body is ignored');
  await call('PUT', `/products/${ids.mouse}`, as('manager'), { price: 600 });

  assert.equal((await call('GET', '/products?search=cab', as('staff'))).body.length, 1);
  assert.equal((await call('GET', '/products?category=electronics', as('staff'))).body.length, 2);
  assert.equal((await call('GET', '/products?category=Nope', as('staff'))).body.length, 0);
  assert.equal((await call('GET', '/products?status=out', as('staff'))).body.length, 2);

  const tmp = await call('POST', '/products', as('manager'), { name: 'Temp', sku: 'TMP-1', price: 1 });
  assert.equal((await call('DELETE', `/products/${tmp.body.id}`, as('manager'))).status, 403, 'only admin deletes');
  assert.equal((await call('DELETE', `/products/${tmp.body.id}`, as('admin'))).status, 200, 'unused product can be deleted');
});

test('stock: in / out / adjust rules, movement history, alerts when crossing thresholds', async () => {
  const inn = await call('POST', '/stock/in', as('staff'), { product: ids.mouse, quantity: 20, reason: 'Opening stock' });
  assert.equal(inn.status, 201);
  assert.equal(inn.body.newQty, 20);
  assert.equal(inn.body.productName, 'Mouse');
  assert.equal(inn.body.performedBy, 'staff user');
  await call('POST', '/stock/in', as('staff'), { product: ids.cable, quantity: 30 });

  assert.equal((await call('POST', '/stock/out', as('staff'), { product: ids.mouse, quantity: 100 })).status, 400, 'cannot go below zero');
  assert.equal((await call('POST', '/stock/out', as('staff'), { product: ids.mouse, quantity: 0 })).status, 400);
  assert.equal((await call('POST', '/stock/adjust', as('staff'), { product: ids.mouse, newQty: 5, reason: 'count' })).status, 403);
  assert.equal((await call('POST', '/stock/adjust', as('manager'), { product: ids.mouse, newQty: 5 })).status, 400, 'reason required');

  // 20 -> 5 crosses the reorder level (5) : LOW_STOCK alert.  5 -> 0 : OUT_OF_STOCK alert.
  assert.equal((await call('POST', '/stock/adjust', as('manager'), { product: ids.mouse, newQty: 5, reason: 'Stock take' })).status, 201);
  assert.equal((await call('POST', '/stock/out', as('staff'), { product: ids.mouse, quantity: 5, reason: 'Damaged' })).status, 201);
  const types = (await Alert.find({ product: ids.mouse })).map((a) => a.type).sort();
  assert.deepEqual(types, ['LOW_STOCK', 'OUT_OF_STOCK']);

  const moves = await call('GET', `/stock/movements?product=${ids.mouse}`, as('staff'));
  assert.deepEqual(moves.body.map((m) => m.type), ['OUT', 'ADJUST', 'IN'], 'newest first');
  assert.equal(moves.body[1].quantity, 15, 'adjust stores the difference');

  await call('POST', '/stock/in', as('staff'), { product: ids.mouse, quantity: 50, reason: 'Restock' }); // mouse = 50
  const stock = await call('GET', '/stock', as('staff'));
  assert.equal(stock.body.find((p) => p.id === ids.mouse).quantity, 50);
});

test('sales: price from product, stock reduced, discount check, all-or-nothing, invoice numbers', async () => {
  const s1 = await call('POST', '/sales', as('staff'), {
    items: [{ product: ids.mouse, quantity: 2 }, { product: ids.cable, quantity: 4 }],
    discount: 100, customerName: 'Aman Traders', paymentMethod: 'upi',
  });
  assert.equal(s1.status, 201, JSON.stringify(s1.body));
  assert.match(s1.body.invoiceNumber, /^INV-\d{4}-0001$/);
  assert.equal(s1.body.totalAmount, 2 * 600 + 4 * 250 - 100); // 2100
  assert.equal(s1.body.itemCount, 6);
  assert.equal(s1.body.items.length, 2);
  ids.sale1 = s1.body.id;

  const stock = (await call('GET', '/stock', as('staff'))).body;
  assert.equal(stock.find((p) => p.id === ids.mouse).quantity, 48);
  assert.equal(stock.find((p) => p.id === ids.cable).quantity, 26);

  // a client trying to set its own price is ignored
  const cheat = await call('POST', '/sales', as('staff'), { items: [{ product: ids.mouse, quantity: 1, unitPrice: 1 }] });
  assert.equal(cheat.body.totalAmount, 600);

  assert.equal((await call('POST', '/sales', as('staff'), { items: [{ product: ids.mouse, quantity: 1 }], discount: 9999 })).status, 400);
  assert.equal((await call('POST', '/sales', as('staff'), { items: [] })).status, 400);

  // all-or-nothing: mouse is fine but cable is short -> NOTHING is saved or removed
  const before = (await call('GET', '/sales', as('staff'))).body.length;
  const bad = await call('POST', '/sales', as('staff'), { items: [{ product: ids.mouse, quantity: 1 }, { product: ids.cable, quantity: 500 }] });
  assert.equal(bad.status, 400);
  assert.match(bad.body.message, /Not enough stock/);
  assert.equal((await call('GET', '/sales', as('staff'))).body.length, before);
  const after = (await call('GET', '/stock', as('staff'))).body;
  assert.equal(after.find((p) => p.id === ids.mouse).quantity, 47, 'mouse unchanged by the failed sale');

  const detail = await call('GET', `/sales/${ids.sale1}`, as('staff'));
  assert.equal(detail.body.customerName, 'Aman Traders');
  assert.equal((await call('GET', '/sales?search=aman', as('staff'))).body.length, 1);
  assert.equal((await call('GET', '/sales?paymentMethod=upi', as('staff'))).body.length, 1);
});

test('sales: 12 simultaneous sales of the last 5 items -> exactly 5 succeed, never negative stock', async () => {
  const p = await call('POST', '/products', as('manager'), { name: 'Rare', sku: 'RARE-1', price: 100, reorderLevel: 1 });
  await call('POST', '/stock/in', as('manager'), { product: p.body.id, quantity: 5 });
  const results = await Promise.all(
    Array.from({ length: 12 }, () => call('POST', '/sales', as('staff'), { items: [{ product: p.body.id, quantity: 1 }] }))
  );
  assert.equal(results.filter((r) => r.status === 201).length, 5);
  assert.equal(results.filter((r) => r.status === 400).length, 7);
  const rare = (await call('GET', `/products/${p.body.id}`, as('staff'))).body;
  assert.equal(rare.quantity, 0);
  const numbers = results.filter((r) => r.status === 201).map((r) => r.body.invoiceNumber);
  assert.equal(new Set(numbers).size, 5, 'no duplicate invoice numbers');
  ids.rare = p.body.id;
  // history: a product with sales cannot be deleted
  assert.equal((await call('DELETE', `/products/${ids.rare}`, as('admin'))).status, 409);
});

test('purchase orders: flow draft -> ordered -> received adds stock once; permissions', async () => {
  const body = { supplier: ids.supplier, items: [{ product: ids.cable, quantity: 40, unitCost: 120 }, { product: ids.mouse, quantity: 10, unitCost: 400 }], notes: 'Refill' };
  assert.equal((await call('POST', '/purchase-orders', as('staff'), body)).status, 403);
  assert.equal((await call('POST', '/purchase-orders', as('manager'), { ...body, items: [] })).status, 400);
  const po = await call('POST', '/purchase-orders', as('manager'), body);
  assert.equal(po.status, 201);
  assert.match(po.body.orderNumber, /^PO-\d{4}-0001$/);
  assert.equal(po.body.totalAmount, 40 * 120 + 10 * 400);
  assert.equal(po.body.supplierName, 'ABC Tech');
  assert.equal(po.body.items[0].productName, 'Cable');
  assert.equal(po.body.status, 'draft');
  const id = po.body.id;

  assert.equal((await call('PATCH', `/purchase-orders/${id}/receive`, as('manager'))).status, 400, 'a draft cannot be received');
  assert.equal((await call('PATCH', `/purchase-orders/${id}/status`, as('manager'), { status: 'ordered' })).body.status, 'ordered');

  // two people press Receive at the same moment: stock must go up only once
  const cableBefore = (await call('GET', `/products/${ids.cable}`, as('staff'))).body.quantity;
  const both = await Promise.all([
    call('PATCH', `/purchase-orders/${id}/receive`, as('manager')),
    call('POST', `/purchase-orders/${id}/receive`, as('admin')),
  ]);
  assert.deepEqual(both.map((r) => r.status).sort(), [200, 400]);
  const cableAfter = (await call('GET', `/products/${ids.cable}`, as('staff'))).body.quantity;
  assert.equal(cableAfter, cableBefore + 40);

  const done = await call('GET', `/purchase-orders/${id}`, as('manager'));
  assert.equal(done.body.status, 'received');
  assert.ok(done.body.receivedDate);
  assert.equal((await Alert.countDocuments({ type: 'ORDER_RECEIVED' })), 1);
  assert.equal((await call('PATCH', `/purchase-orders/${id}/cancel`, as('manager'))).status, 400, 'received cannot be cancelled');

  const draft = await call('POST', '/purchase-orders', as('manager'), body);
  assert.equal((await call('PATCH', `/purchase-orders/${draft.body.id}/cancel`, as('manager'))).body.status, 'cancelled');
  assert.equal((await call('GET', '/purchase-orders?status=received', as('manager'))).body.length, 1);
});

test('expenses: validation, role rule, filters, delete', async () => {
  const e = { title: 'Office rent', category: 'office', amount: 1500, date: daysAgo(2) };
  assert.equal((await call('POST', '/expenses', as('staff'), e)).status, 403);
  assert.equal((await call('POST', '/expenses', as('manager'), { ...e, category: 'travel' })).status, 400);
  assert.equal((await call('POST', '/expenses', as('manager'), { ...e, amount: 0 })).status, 400);
  const ok = await call('POST', '/expenses', as('manager'), e);
  assert.equal(ok.status, 201);
  assert.equal(ok.body.createdBy, 'manager user');
  ids.expense = ok.body.id;
  // two older ones: 40 days ago (previous period) and 100 days ago
  await call('POST', '/expenses', as('manager'), { title: 'Old salaries', category: 'salaries', amount: 1000, date: daysAgo(40) });
  const old = await call('POST', '/expenses', as('manager'), { title: 'Ancient', category: 'other', amount: 77, date: daysAgo(100) });

  assert.equal((await call('GET', '/expenses', as('admin'))).body.length, 3);
  assert.equal((await call('GET', '/expenses?category=salaries', as('admin'))).body.length, 1);
  assert.equal((await call('GET', '/expenses?search=rent', as('admin'))).body.length, 1);
  assert.equal((await call('PUT', `/expenses/${ids.expense}`, as('manager'), { note: 'Nov' })).body.note, 'Nov');
  assert.equal((await call('DELETE', `/expenses/${old.body.id}`, as('manager'))).status, 200);
  assert.equal((await call('GET', '/expenses', as('admin'))).body.length, 2);
});

test('reports: summary, top products, sales by day, expense by category', async () => {
  assert.equal((await call('GET', '/reports/summary', as('staff'))).status, 403);
  assert.equal((await call('GET', '/reports/summary?days=0', as('admin'))).status, 400);

  // sales so far (all today): 2100 + 600 + 5 x 100 = 3200, from 1 + 1 + 5 = 7 sales
  const sum = (await call('GET', '/reports/summary', as('manager'))).body;
  assert.equal(sum.sales.total, 3200);
  assert.equal(sum.sales.count, 7);
  assert.equal(sum.sales.change, null, 'no sales in the previous period to compare with');
  assert.equal(sum.expenses.total, 1500);
  assert.equal(sum.expenses.change, 50, '1500 vs 1000 in the previous 30 days = +50%');
  assert.equal(sum.netProfit.total, 3200 - 1500);
  assert.equal(sum.inventory.totalProducts, 3);
  assert.equal(sum.inventory.outOfStock, 1, 'only the Rare product is at 0');
  assert.equal(sum.inventory.inStock + sum.inventory.lowStock + sum.inventory.outOfStock, 3);
  assert.ok(sum.inventory.stockValue > 0);

  const top = (await call('GET', '/reports/top-products?limit=2', as('admin'))).body;
  assert.equal(top.length, 2);
  assert.equal(top[0].name, 'Mouse'); // 2+1 units x 600 = 1800 revenue
  assert.equal(top[0].revenue, 1800);
  assert.equal(top[0].unitsSold, 3);
  assert.equal(top[0].sku, 'WM-1');
  const byQty = (await call('GET', '/reports/top-products?sortBy=quantity&limit=1', as('admin'))).body;
  assert.equal(byQty[0].unitsSold, 5, 'Rare sold 5 units, the most');

  const days = (await call('GET', '/reports/sales-by-day?days=7', as('admin'))).body;
  assert.equal(days.length, 7, 'one row per day, zero-filled');
  assert.equal(days.reduce((s, d) => s + d.sales, 0), 3200);
  assert.equal(days.reduce((s, d) => s + d.orders, 0), 7);
  assert.equal(days.filter((d) => d.sales === 0).length, 6, 'only today has sales');
  const range = (await call('GET', '/reports/sales-by-day?from=2026-01-01&to=2026-01-10', as('admin'))).body;
  assert.equal(range.length, 10);

  const cats = (await call('GET', '/reports/expense-by-category', as('admin'))).body;
  assert.equal(cats.total, 1500);
  assert.deepEqual(cats.categories.map((c) => [c.category, c.total, c.percentage]), [['office', 1500, 100]]);
  const wide = (await call('GET', '/reports/expense-by-category?days=90', as('admin'))).body;
  assert.equal(wide.total, 2500);
  assert.equal(wide.categories[0].category, 'office');
  assert.equal(wide.categories[0].percentage, 60);
});

test('alerts: list, unread count, mark one read, mark all read', async () => {
  const unread = (await call('GET', '/alerts/unread-count', as('staff'))).body.count;
  assert.ok(unread >= 3);
  const list = (await call('GET', '/alerts?unread=true', as('staff'))).body;
  assert.equal(list.length, unread);
  assert.equal((await call('PATCH', `/alerts/${list[0].id}/read`, as('staff'))).body.isRead, true);
  assert.equal((await call('GET', '/alerts/unread-count', as('staff'))).body.count, unread - 1);
  assert.equal((await call('PATCH', '/alerts/read-all', as('staff'))).status, 200);
  assert.equal((await call('GET', '/alerts/unread-count', as('staff'))).body.count, 0);
});

test('audit log: admin only, records who changed what', async () => {
  assert.equal((await call('GET', '/audit-logs', as('manager'))).status, 403);
  const logs = (await call('GET', '/audit-logs?entity=Product', as('admin'))).body;
  assert.ok(logs.length > 0);
  assert.ok(logs.some((l) => l.action === 'CREATE' && l.user.name === 'manager user'));
  assert.ok(logs.some((l) => l.action === 'STOCK_IN'));
});

test('unknown route gives a clean 404 json', async () => {
  const r = await call('GET', '/nothing-here', as('admin'));
  assert.equal(r.status, 404);
  assert.ok(r.body.message);
});
