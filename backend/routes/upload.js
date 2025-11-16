import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Company from '../models/Company.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to parse CSV with any format
function parseCSV(csvText) {
  return new Promise((resolve, reject) => {
    const results = [];
    const headers = [];
    let isFirstRow = true;

    const lines = csvText.split('\n').filter(line => line.trim());
    
    lines.forEach((line, index) => {
      // Handle quoted fields and commas
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add last value

      if (isFirstRow) {
        headers.push(...values);
        isFirstRow = false;
      } else if (values.length > 0 && values.some(v => v)) {
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        results.push(row);
      }
    });

    resolve({ headers, data: results });
  });
}

// POST upload CSV
router.post('/', upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvText = req.file.buffer.toString('utf-8');
    const { headers, data } = await parseCSV(csvText);

    if (data.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or invalid' });
    }

    // Create company record with unique collection name
    const companyName = req.body.companyName || `Uploaded Company - ${new Date().toLocaleDateString()}`;
    const collectionName = `sales_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Log CSV headers for debugging
    console.log('📋 CSV Headers detected:', headers);
    
    const company = new Company({
      name: companyName,
      csvHeaders: headers,
      totalRecords: data.length,
      isDefault: false,
      collectionName: collectionName
    });
    await company.save();

    // Create dynamic model for this company's collection
    const CompanySale = mongoose.model(collectionName, Sale.schema, collectionName);
    
    // Get max sale_id for this company to ensure uniqueness
    const maxSaleId = await CompanySale.findOne()
      .sort({ sale_id: -1 })
      .select('sale_id')
      .lean();
    let nextSaleId = maxSaleId ? maxSaleId.sale_id + 1 : 1;

    // Smart field mapping with fuzzy matching
    const normalizeFieldName = (name) => {
      return name.toLowerCase()
        .replace(/[_\s-]/g, '')
        .replace(/[^a-z0-9]/g, '');
    };

    const findField = (possibleNames, headers, row) => {
      // First try exact match (case-insensitive, ignoring spaces/underscores)
      for (const name of possibleNames) {
        const normalized = normalizeFieldName(name);
        for (const header of headers) {
          if (normalizeFieldName(header) === normalized) {
            const value = row[header];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
        }
      }
      
      // Try partial match (contains)
      for (const name of possibleNames) {
        const normalized = normalizeFieldName(name);
        for (const header of headers) {
          const headerNormalized = normalizeFieldName(header);
          if (headerNormalized.includes(normalized) || normalized.includes(headerNormalized)) {
            const value = row[header];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
        }
      }
      
      return null;
    };

    // Track field mappings for first row to help with debugging
    let fieldMapping = {};
    
    // Map CSV data to Sale schema (fully dynamic)
    const sales = data.map((row, index) => {
      // Generate unique sale_id
      const csvSaleId = findField(['sale_id', 'id', 'saleid', 'saleid', 'transaction_id', 'transactionid'], headers, row);
      const baseSaleId = csvSaleId ? parseInt(csvSaleId) || nextSaleId++ : nextSaleId++;
      
      // Map fields dynamically - no hardcoded defaults
      const branch = findField(['branch', 'store', 'location', 'store_name', 'storename', 'branch_name', 'branchname', 'outlet', 'shop'], headers, row) || '';
      const city = findField(['city', 'store_city', 'storecity', 'location_city', 'locationcity', 'area', 'region'], headers, row) || '';
      const customer_type = findField(['customer_type', 'customertype', 'customer type', 'type', 'member_type', 'membertype', 'customer_category', 'customercategory', 'membership'], headers, row) || '';
      const gender = findField(['gender', 'sex', 'customer_gender', 'customergender'], headers, row) || '';
      const product_name = findField(['product_name', 'productname', 'product name', 'product', 'item', 'item_name', 'itemname', 'product_title', 'producttitle', 'description', 'item_description'], headers, row) || '';
      const product_category = findField(['product_category', 'productcategory', 'product category', 'category', 'cat', 'item_category', 'itemcategory', 'product_type', 'producttype', 'class'], headers, row) || '';
      const unit_price = parseFloat(findField(['unit_price', 'unitprice', 'unit price', 'price', 'cost', 'item_price', 'itemprice', 'unitcost', 'unit_cost', 'selling_price', 'sellingprice'], headers, row) || 0);
      const quantity = parseInt(findField(['quantity', 'qty', 'amount', 'item_quantity', 'itemquantity', 'qty_sold', 'qtysold', 'units', 'units_sold'], headers, row) || 1);
      const tax = parseFloat(findField(['tax', 'tax_amount', 'taxamount', 'tax_price', 'taxprice', 'tax_value', 'taxvalue', 'vat', 'gst'], headers, row) || 0);
      const total_price = parseFloat(findField(['total_price', 'totalprice', 'total price', 'total', 'amount', 'sale_total', 'saletotal', 'grand_total', 'grandtotal', 'revenue', 'sales_amount'], headers, row) || 0);
      const reward_points = parseInt(findField(['reward_points', 'rewardpoints', 'reward points', 'points', 'rewards', 'loyalty_points', 'loyaltypoints', 'points_earned', 'pointsearned'], headers, row) || 0);
      
      const sale = {
        sale_id: baseSaleId,
        branch,
        city,
        customer_type,
        gender,
        product_name,
        product_category,
        unit_price,
        quantity,
        tax,
        total_price,
        reward_points
      };
      
      // Log field mapping for first row only (for debugging)
      if (index === 0) {
        fieldMapping = {
          branch: branch || 'NOT FOUND',
          city: city || 'NOT FOUND',
          customer_type: customer_type || 'NOT FOUND',
          gender: gender || 'NOT FOUND',
          product_name: product_name || 'NOT FOUND',
          product_category: product_category || 'NOT FOUND',
          unit_price: unit_price || 'NOT FOUND',
          quantity: quantity || 'NOT FOUND',
          tax: tax || 'NOT FOUND',
          total_price: total_price || 'NOT FOUND',
          reward_points: reward_points || 'NOT FOUND'
        };
        console.log('🔍 Field mapping result:', fieldMapping);
      }

      // Auto-calculate total_price if unit_price and quantity are available but total_price is missing/zero
      if ((!sale.total_price || sale.total_price === 0) && sale.unit_price && sale.quantity) {
        const subtotal = sale.unit_price * sale.quantity;
        if (!sale.tax || sale.tax === 0) {
          sale.tax = subtotal * 0.05; // Default 5% tax if not provided
        }
        sale.total_price = subtotal + sale.tax;
      }

      // Store any additional fields from CSV that don't match our schema
      const schemaFields = ['sale_id', 'branch', 'city', 'customer_type', 'gender', 'product_name', 'product_category', 'unit_price', 'quantity', 'tax', 'total_price', 'reward_points'];
      headers.forEach(header => {
        if (!schemaFields.includes(header) && row[header] !== undefined && row[header] !== null && row[header] !== '') {
          sale[header] = row[header];
        }
      });

      return sale;
    });

    // Save sales to company's collection - handle duplicates gracefully
    let savedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < sales.length; i += batchSize) {
      const batch = sales.slice(i, i + batchSize);
      try {
        await CompanySale.insertMany(batch, { ordered: false });
        savedCount += batch.length;
      } catch (error) {
        // Handle duplicate key errors - insert one by one
        if (error.code === 11000) {
          for (const sale of batch) {
            try {
              await CompanySale.create(sale);
              savedCount++;
            } catch (dupError) {
              // Skip duplicates - sale_id already exists in this collection
              console.log(`Skipping duplicate: sale_id ${sale.sale_id} in collection ${collectionName}`);
            }
          }
        } else {
          throw error;
        }
      }
    }

    // Update company with actual saved count
    company.totalRecords = savedCount;
    await company.save();

    res.status(201).json({
      message: `CSV uploaded successfully. ${savedCount} records imported.`,
      company: {
        id: company._id,
        name: company.name,
        totalRecords: company.totalRecords,
        uploadedAt: company.uploadedAt
      },
      fieldMapping: fieldMapping, // Include field mapping info for debugging
      csvHeaders: headers // Include original headers
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all companies (including default example)
router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.find().sort({ isDefault: -1, uploadedAt: -1 }); // Default first, then by upload date
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE company and its collection
router.delete('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default company' });
    }

    // Delete the company's collection
    if (company.collectionName) {
      const CompanySale = mongoose.model(company.collectionName, Sale.schema, company.collectionName);
      await CompanySale.collection.drop().catch(err => {
        console.log(`Collection ${company.collectionName} may not exist:`, err.message);
      });
    }

    // Delete the company record
    await Company.findByIdAndDelete(req.params.id);

    res.json({ message: 'Company and all its data deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

