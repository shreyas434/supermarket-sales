import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  isDefault: { type: Boolean, default: false }, // true for hardcoded data
  csvHeaders: [String], // Store original CSV headers
  totalRecords: { type: Number, default: 0 },
  collectionName: { type: String, required: true, unique: true } // MongoDB collection name for this company
}, {
  timestamps: true
});

export default mongoose.model('Company', companySchema);

