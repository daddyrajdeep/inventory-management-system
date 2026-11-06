import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot, so old sales stay correct if the product changes
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, default: 0 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true }, // e.g. INV-2026-0001
    items: { type: [saleItemSchema], validate: (v) => v.length > 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0 },
    customerName: { type: String, trim: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi'], default: 'cash' },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

saleSchema.pre('validate', function () {
  this.items.forEach((i) => {
    i.subtotal = i.quantity * i.unitPrice;
  });
  const gross = this.items.reduce((sum, i) => sum + i.subtotal, 0);
  this.totalAmount = Math.max(gross - this.discount, 0);
});

saleSchema.index({ createdAt: -1 });
saleSchema.index({ 'items.product': 1 }); // for the "popular products" report

export default mongoose.model('Sale', saleSchema);
