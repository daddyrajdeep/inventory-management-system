import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    barcode: { type: String, trim: true },
    description: { type: String, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    image: { url: String, publicId: String }, // Cloudinary
    costPrice: { type: Number, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0 },
    // Never edit quantity directly. Change it only through the stock service,
    // which also writes a StockMovement inside a transaction.
    quantity: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 10, min: 0 },
    unit: { type: String, default: 'pcs' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.reorderLevel;
});

productSchema.index({ name: 'text', sku: 'text' }); // powers the search bar
productSchema.index({ category: 1 });
productSchema.index({ quantity: 1 }); // fast low-stock queries

export default mongoose.model('Product', productSchema);
