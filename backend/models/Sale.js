import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  sale_id: { type: Number, required: true },
  branch: { type: String, default: '' },
  city: { type: String, default: '' },
  customer_type: { type: String, default: '' },
  gender: { type: String, default: '' },
  product_name: { type: String, default: '' },
  product_category: { type: String, default: '' },
  unit_price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  tax: { type: Number, default: 0 },
  total_price: { type: Number, default: 0 },
  reward_points: { type: Number, default: 0 }
}, {
  timestamps: true,
  strict: false // Allow additional fields from CSV
});

// Unique index on sale_id within each collection (each company has its own collection)
saleSchema.index({ sale_id: 1 }, { unique: true });

export default mongoose.model('Sale', saleSchema);

