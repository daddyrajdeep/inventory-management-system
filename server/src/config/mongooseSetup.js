import mongoose from 'mongoose';

// Makes EVERY model send "id" (not "_id") and no "__v" in API responses, because the frontend uses `id`.
// IMPORTANT: this file must be imported BEFORE any model is loaded (it is the first import in app.js).
mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    if (ret._id !== undefined) {
      ret.id = String(ret._id);
      delete ret._id;
    }
    return ret;
  },
});
