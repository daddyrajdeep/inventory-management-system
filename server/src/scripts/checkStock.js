// Quick health check of the stock helper against YOUR database (Atlas).
// It creates one temporary product, tries the important cases, prints PASS or FAIL, then deletes everything it made.
// Run:  npm run check:stock
import 'dotenv/config';
import '../config/mongooseSetup.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { Product, StockMovement, Alert } from '../models/index.js';
import { changeStock, runInTransaction } from '../services/stockService.js';

const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push([true, name]);
  } catch (err) {
    results.push([false, `${name}  ->  ${err.message}`]);
  }
}
const expectEqual = (actual, expected, what) => {
  if (actual !== expected) throw new Error(`${what}: expected ${expected}, got ${actual}`);
};

await connectDB();
const userId = new mongoose.Types.ObjectId();
const product = await Product.create({
  name: 'Stock check item', sku: `CHECK-${Date.now()}`, price: 1, quantity: 5, reorderLevel: 2,
});
const qty = async () => (await Product.findById(product._id)).quantity;
const base = { productId: product._id, userId };

try {
  await check('IN adds stock (5 + 3 = 8)', async () => {
    await changeStock({ ...base, type: 'IN', quantity: 3 });
    expectEqual(await qty(), 8, 'quantity');
  });
  await check('OUT removes stock (8 - 2 = 6)', async () => {
    await changeStock({ ...base, type: 'OUT', quantity: 2 });
    expectEqual(await qty(), 6, 'quantity');
  });
  await check('taking more than available is refused and changes nothing', async () => {
    let refused = false;
    try {
      await changeStock({ ...base, type: 'OUT', quantity: 100 });
    } catch {
      refused = true;
    }
    if (!refused) throw new Error('it should have been refused');
    expectEqual(await qty(), 6, 'quantity');
  });
  await check('12 people taking 1 at the same time from a stock of 5: exactly 5 succeed', async () => {
    await changeStock({ ...base, type: 'ADJUST', newQuantity: 5 });
    const outcomes = await Promise.allSettled(
      Array.from({ length: 12 }, () => changeStock({ ...base, type: 'OUT', quantity: 1 }))
    );
    expectEqual(outcomes.filter((o) => o.status === 'fulfilled').length, 5, 'successful takes');
    expectEqual(await qty(), 0, 'final quantity');
  });
  await check('a failure inside a transaction undoes the stock change (transactions work)', async () => {
    try {
      await runInTransaction(async (session) => {
        await changeStock({ ...base, type: 'IN', quantity: 10, session });
        throw new Error('simulated failure');
      });
    } catch {
      /* expected */
    }
    expectEqual(await qty(), 0, 'quantity after rollback');
  });
  await check('every change was written to the movement history (1 IN + 1 OUT + 1 ADJUST + 5 OUT = 8)', async () => {
    expectEqual(await StockMovement.countDocuments({ product: product._id }), 8, 'movements');
  });
} finally {
  await StockMovement.deleteMany({ product: product._id });
  await Alert.deleteMany({ product: product._id });
  await Product.deleteOne({ _id: product._id });
  await mongoose.disconnect();
}

console.log('');
for (const [ok, name] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
const failed = results.filter(([ok]) => !ok).length;
console.log(failed === 0 ? '\nAll checks passed. The stock helper works on this database.' : `\n${failed} check(s) FAILED.`);
process.exit(failed === 0 ? 0 : 1);
