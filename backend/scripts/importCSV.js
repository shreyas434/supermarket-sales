import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Sale from '../models/Sale.js';
import Company from '../models/Company.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supermarket_sales';

async function importCSV() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read CSV file - try multiple possible locations
    const possiblePaths = [
      path.join(__dirname, '../../supermarket_sales.csv'),
      path.join(process.cwd(), 'supermarket_sales.csv'),
      path.join(__dirname, '../../../supermarket_sales.csv')
    ];
    
    let csvPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        csvPath = p;
        break;
      }
    }
    
    if (!csvPath) {
      throw new Error('CSV file not found. Please ensure supermarket_sales.csv is in the project root.');
    }
    
    console.log(`📂 Reading CSV from: ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV - handle quoted fields properly
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log(`📊 Found ${lines.length - 1} records to import`);
    console.log(`📋 Headers: ${headers.join(', ')}`);
    
    // Clear existing default data only
    await Sale.deleteMany({ companyId: null });
    console.log('🗑️  Cleared existing default data');
    
    // Create or update default company
    let defaultCompany = await Company.findOne({ isDefault: true });
    if (!defaultCompany) {
      defaultCompany = new Company({
        name: 'Supermarket Sales Company',
        isDefault: true,
        csvHeaders: headers,
        totalRecords: 0,
        collectionName: 'sales' // Default collection name
      });
      await defaultCompany.save();
      console.log('✅ Created default company');
    }
    
    // Import data
    const sales = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple CSV parsing (handles basic cases)
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length >= 11) {
        const sale = {
          sale_id: parseInt(values[0]) || i,
          branch: values[1] || '',
          city: values[2] || '',
          customer_type: values[3] || '',
          gender: values[4] || '',
          product_name: values[5] || '',
          product_category: values[6] || '',
          unit_price: parseFloat(values[7]) || 0,
          quantity: parseInt(values[8]) || 0,
          tax: parseFloat(values[9]) || 0,
          total_price: parseFloat(values[10]) || 0,
          reward_points: parseInt(values[11]) || 0
        };
        sales.push(sale);
      }
    }
    
    // Insert in batches with default company ID
    const batchSize = 100;
    for (let i = 0; i < sales.length; i += batchSize) {
      const batch = sales.slice(i, i + batchSize).map(sale => ({
        ...sale,
        companyId: null // Default company has null companyId
      }));
      await Sale.insertMany(batch, { ordered: false });
      console.log(`✅ Imported ${Math.min(i + batchSize, sales.length)}/${sales.length} records`);
    }
    
    // Update default company record count
    defaultCompany.totalRecords = sales.length;
    await defaultCompany.save();
    
    console.log('🎉 Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Import error:', error);
    process.exit(1);
  }
}

importCSV();

