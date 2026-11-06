import mongoose from 'mongoose';

const poItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // e.g. PO-2026-0001
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: { type: [poItemSchema], validate: (v) => v.length > 0 },
    status: {
      type: String,
      enum: ['draft', 'ordered', 'received', 'cancelled'],
      default: 'draft',
    },
    totalAmount: { type: Number, default: 0 },
    expectedDate: Date,
    receivedDate: Date,
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

purchaseOrderSchema.pre('validate', function () {
  this.totalAmount = this.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
});

purchaseOrderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
