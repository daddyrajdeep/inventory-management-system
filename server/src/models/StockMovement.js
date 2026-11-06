import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['IN', 'OUT', 'ADJUST'], required: true },
    quantity: { type: Number, required: true, min: 1 }, // always positive; type gives direction
    previousQty: { type: Number, required: true },
    newQty: { type: Number, required: true },
    reason: { type: String, trim: true },
    // Optional link to what caused the movement (a sale, a purchase order, or manual)
    referenceModel: { type: String, enum: ['Sale', 'PurchaseOrder', 'Manual'], default: 'Manual' },
    referenceId: { type: mongoose.Schema.Types.ObjectId, refPath: 'referenceModel' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

stockMovementSchema.index({ product: 1, createdAt: -1 });

export default mongoose.model('StockMovement', stockMovementSchema);
