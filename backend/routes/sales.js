import express from 'express';
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Company from '../models/Company.js';

const router = express.Router();

// Helper to get the right Sale model based on company
const getSaleModel = async (companyId) => {
  if (!companyId || companyId === 'main-company') {
    // Default company uses the default Sale model
    console.log('📦 Using default Sale model for:', companyId || 'null');
    return Sale;
  }
  
  // Get company to find collection name
  const company = await Company.findById(companyId);
  if (!company) {
    console.log('⚠️ Company not found for ID:', companyId, '- using default model');
    return Sale; // Fallback to default
  }
  
  if (!company.collectionName) {
    console.log('⚠️ Company has no collectionName:', companyId, '- using default model');
    return Sale; // Fallback to default
  }
  
  console.log('📦 Using collection:', company.collectionName, 'for company:', company.name);
  // Return dynamic model for this company's collection
  return mongoose.model(company.collectionName, Sale.schema, company.collectionName);
};

// GET all sales with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, branch, city, customer_type, product_category, companyId } = req.query;
    const query = {};
    
    if (branch) query.branch = branch;
    if (city) query.city = city;
    if (customer_type) query.customer_type = customer_type;
    if (product_category) query.product_category = product_category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // If companyId specified, query that company's collection, otherwise query all
    if (companyId && companyId !== 'all') {
      const SaleModel = await getSaleModel(companyId);
      const sales = await SaleModel.find(query)
        .sort({ sale_id: 1 })
        .skip(skip)
        .limit(parseInt(limit));
      const total = await SaleModel.countDocuments(query);
      
      res.json({
        sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
      return;
    }
    
    // Query all companies - combine results from default + all company collections
    const allSales = [];
    
    // Get default sales (from default Sale collection)
    const defaultSales = await Sale.find(query).sort({ sale_id: 1 });
    allSales.push(...defaultSales.map(s => ({ ...s.toObject(), companyId: null })));
    
    // Get sales from all uploaded companies
    const companies = await Company.find({ isDefault: false });
    for (const company of companies) {
      if (company.collectionName) {
        const CompanySale = mongoose.model(company.collectionName, Sale.schema, company.collectionName);
        const companySales = await CompanySale.find(query).sort({ sale_id: 1 });
        allSales.push(...companySales.map(s => ({ ...s.toObject(), companyId: company._id.toString() })));
      }
    }
    
    // Sort and paginate combined results
    allSales.sort((a, b) => a.sale_id - b.sale_id);
    const total = allSales.length;
    const paginatedSales = allSales.slice(skip, skip + parseInt(limit));
    
    res.json({
      sales: paginatedSales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    return;

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single sale by ID
router.get('/:id', async (req, res) => {
  try {
    const { companyId } = req.query;
    const SaleModel = await getSaleModel(companyId);
    const sale = await SaleModel.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new sale
router.post('/', async (req, res) => {
  try {
    const { companyId, ...saleData } = req.body;
    const SaleModel = await getSaleModel(companyId);
    
    // Generate unique sale_id if not provided
    if (!saleData.sale_id) {
      const maxSale = await SaleModel.findOne()
        .sort({ sale_id: -1 })
        .select('sale_id')
        .lean();
      saleData.sale_id = maxSale ? maxSale.sale_id + 1 : 1;
    }
    
    const sale = new SaleModel(saleData);
    await sale.save();
    res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT update sale
router.put('/:id', async (req, res) => {
  try {
    const { companyId, ...updateData } = req.body;
    const SaleModel = await getSaleModel(companyId);
    const sale = await SaleModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE sale
router.delete('/:id', async (req, res) => {
  try {
    const { companyId } = req.query;
    const SaleModel = await getSaleModel(companyId);
    const sale = await SaleModel.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json({ message: 'Sale deleted successfully', sale });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET analytics/statistics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { companyId } = req.query;
    
    // If specific company, query only that collection
    if (companyId && companyId !== 'all' && companyId !== 'main-company') {
      const SaleModel = await getSaleModel(companyId);
      const totalSales = await SaleModel.countDocuments();
      const totalRevenue = await SaleModel.aggregate([
        { $group: { _id: null, total: { $sum: '$total_price' } } }
      ]);
      
      const salesByBranch = await SaleModel.aggregate([
        { $group: { _id: '$branch', count: { $sum: 1 }, revenue: { $sum: '$total_price' } } }
      ]);
      
      const salesByCity = await SaleModel.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 }, revenue: { $sum: '$total_price' } } }
      ]);
      
      const salesByCategory = await SaleModel.aggregate([
        { $group: { _id: '$product_category', count: { $sum: 1 }, revenue: { $sum: '$total_price' } } }
      ]);
      
      const salesByCustomerType = await SaleModel.aggregate([
        { $group: { _id: '$customer_type', count: { $sum: 1 }, revenue: { $sum: '$total_price' } } }
      ]);
      
      res.json({
        totalSales,
        totalRevenue: totalRevenue[0]?.total || 0,
        salesByBranch,
        salesByCity,
        salesByCategory,
        salesByCustomerType
      });
      return;
    }
    
    // Aggregate across all collections (default + all companies)
    let totalSales = 0;
    let totalRevenue = 0;
    const salesByBranchMap = {};
    const salesByCityMap = {};
    const salesByCategoryMap = {};
    const salesByCustomerTypeMap = {};
    
    // Process default collection
    const defaultSales = await Sale.find().lean();
    totalSales += defaultSales.length;
    defaultSales.forEach(sale => {
      totalRevenue += sale.total_price || 0;
      salesByBranchMap[sale.branch] = (salesByBranchMap[sale.branch] || { count: 0, revenue: 0 });
      salesByBranchMap[sale.branch].count++;
      salesByBranchMap[sale.branch].revenue += sale.total_price || 0;
      
      salesByCityMap[sale.city] = (salesByCityMap[sale.city] || { count: 0, revenue: 0 });
      salesByCityMap[sale.city].count++;
      salesByCityMap[sale.city].revenue += sale.total_price || 0;
      
      salesByCategoryMap[sale.product_category] = (salesByCategoryMap[sale.product_category] || { count: 0, revenue: 0 });
      salesByCategoryMap[sale.product_category].count++;
      salesByCategoryMap[sale.product_category].revenue += sale.total_price || 0;
      
      salesByCustomerTypeMap[sale.customer_type] = (salesByCustomerTypeMap[sale.customer_type] || { count: 0, revenue: 0 });
      salesByCustomerTypeMap[sale.customer_type].count++;
      salesByCustomerTypeMap[sale.customer_type].revenue += sale.total_price || 0;
    });
    
    // Process all company collections
    const companies = await Company.find({ isDefault: false });
    for (const company of companies) {
      if (company.collectionName) {
        const CompanySale = mongoose.model(company.collectionName, Sale.schema, company.collectionName);
        const companySales = await CompanySale.find().lean();
        totalSales += companySales.length;
        companySales.forEach(sale => {
          totalRevenue += sale.total_price || 0;
          salesByBranchMap[sale.branch] = (salesByBranchMap[sale.branch] || { count: 0, revenue: 0 });
          salesByBranchMap[sale.branch].count++;
          salesByBranchMap[sale.branch].revenue += sale.total_price || 0;
          
          salesByCityMap[sale.city] = (salesByCityMap[sale.city] || { count: 0, revenue: 0 });
          salesByCityMap[sale.city].count++;
          salesByCityMap[sale.city].revenue += sale.total_price || 0;
          
          salesByCategoryMap[sale.product_category] = (salesByCategoryMap[sale.product_category] || { count: 0, revenue: 0 });
          salesByCategoryMap[sale.product_category].count++;
          salesByCategoryMap[sale.product_category].revenue += sale.total_price || 0;
          
          salesByCustomerTypeMap[sale.customer_type] = (salesByCustomerTypeMap[sale.customer_type] || { count: 0, revenue: 0 });
          salesByCustomerTypeMap[sale.customer_type].count++;
          salesByCustomerTypeMap[sale.customer_type].revenue += sale.total_price || 0;
        });
      }
    }
    
    // Convert maps to arrays
    const salesByBranch = Object.entries(salesByBranchMap).map(([_id, data]) => ({ _id, ...data }));
    const salesByCity = Object.entries(salesByCityMap).map(([_id, data]) => ({ _id, ...data }));
    const salesByCategory = Object.entries(salesByCategoryMap).map(([_id, data]) => ({ _id, ...data }));
    const salesByCustomerType = Object.entries(salesByCustomerTypeMap).map(([_id, data]) => ({ _id, ...data }));

    res.json({
      totalSales,
      totalRevenue,
      salesByBranch,
      salesByCity,
      salesByCategory,
      salesByCustomerType
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

