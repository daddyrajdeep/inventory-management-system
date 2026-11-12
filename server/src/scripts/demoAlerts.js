// Creates FAKE products and triggers real alerts through the stock helper, so you can see the bell working
// before any stock screen exists.   Run:  npm run demo:alerts        Remove it all later:  npm run demo:alerts -- --clean
import 'dotenv/config';
import '../config/mongooseSetup.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { Product, StockMovement, Alert } from '../models/index.js';
import { changeStock } from '../services/stockService.js';

const demo = [
  // starts above the reorder level, takes it below -> LOW_STOCK alert
  { name: 'Demo Desk Lamp', sku: 'DEMO-LAMP', price: 899, quantity: 8, reorderLevel: 5, take: 4 },
  // takes everything -> OUT_OF_STOCK alert
  { name: 'Demo USB-C Cable', sku: 'DEMO-CABLE', price: 249, quantity: 2, reorderLevel: 3, take: 2 },
  // stays healthy -> no alert (shows that only real shortages alert)
  { name: 'Demo Notebook', sku: 'DEMO-NOTE', price: 79, quantity: 100, reorderLevel: 10, take: 5 },
];

await connectDB();

if (process.argv.includes('--clean')) {
  const products = await Product.find({ sku: /^DEMO-/ });
  const ids = products.map((p) => p._id);
  const alerts = await Alert.deleteMany({ product: { $in: ids } });
  const moves = await StockMovement.deleteMany({ product: { $in: ids } });
  const removed = await Product.deleteMany({ _id: { $in: ids } });
  console.log(`Removed ${removed.deletedCount} demo products, ${moves.deletedCount} movements, ${alerts.deletedCount} alerts.`);
} else {
  const userId = new mongoose.Types.ObjectId();
  for (const d of demo) {
    // reset the demo product to its starting point, then take stock out through the real helper
    const product = await Product.findOneAndUpdate(
      { sku: d.sku },
      { $set: { name: d.name, price: d.price, quantity: d.quantity, reorderLevel: d.reorderLevel, isActive: true } },
      { upsert: true, returnDocument: 'after' }
    );
    const { product: result } = await changeStock({
      productId: product._id, type: 'OUT', quantity: d.take, reason: 'demo alert', userId,
    });
    console.log(`${d.name}: ${result.previousQty} -> ${result.newQty} (reorder level ${d.reorderLevel})`);
  }
  console.log(`\nUnread alerts in the database now: ${await Alert.countDocuments({ isRead: false })}`);
  console.log('Open the app: the bell should show them within 30 seconds, or click it to load the list now.');
}

await mongoose.disconnect();
