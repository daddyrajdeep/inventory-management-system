import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'ORDER_RECEIVED'], required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

alertSchema.index({ isRead: 1, createdAt: -1 }); // powers the notification bell badge

export default mongoose.model('Alert', alertSchema);
