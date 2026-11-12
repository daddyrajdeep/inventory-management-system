import mongoose from 'mongoose';

// Gives out the next number for invoices and purchase orders.
// One document per series and year, e.g.  { _id: 'INV-2026', seq: 41 }
const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

export default mongoose.model('Counter', counterSchema);
