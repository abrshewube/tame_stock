import express from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();
// GET /api/products/transactions - Transactions by date/location/type
router.get('/transactions', async (req, res) => {
  try {
    const { location, date, type } = req.query;
    if (!location || !date) {
      return res.status(400).json({ success: false, message: 'location and date are required' });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const products = await Product.find({ location }).select('_id name');
    const productIdToName = new Map(products.map(p => [p._id.toString(), p.name]));
    const productIds = products.map(p => p._id);

    const filter = { productId: { $in: productIds }, date: { $gte: startDate, $lte: endDate } };
    if (type === 'in' || type === 'out') {
      filter.type = type;
    }

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });
    const data = transactions.map(t => ({
      ...t.toObject(),
      productName: productIdToName.get(t.productId.toString()) || ''
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching transactions by date/location:', error);
    res.status(500).json({ success: false, message: 'Error fetching transactions' });
  }
});

// POST /api/products/transactions/bulk - Bulk stock-in for a single date
router.post('/transactions/bulk', async (req, res) => {
  try {
    const { date, location, description, items } = req.body;
    if (!date || !location || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields (date, location, items[])' });
    }
    for (const it of items) {
      if (!it.productId || !it.quantity || it.quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Each item requires productId and positive quantity' });
      }
    }
    const products = await Product.find({ location }).select('_id');
    const allowedIds = new Set(products.map(p => p._id.toString()));

    const created = [];
    for (const it of items) {
      if (!allowedIds.has(it.productId)) {
        return res.status(400).json({ success: false, message: 'Product does not belong to specified location' });
      }
      const txn = new Transaction({
        productId: it.productId,
        type: 'in',
        quantity: it.quantity,
        date: new Date(date),
        description
      });
      await txn.save();
      created.push(txn);
    }
    res.status(201).json({ success: true, message: 'Stock batch recorded successfully', data: created });
  } catch (error) {
    console.error('Error recording stock batch:', error);
    res.status(500).json({ success: false, message: 'Error recording stock batch' });
  }
});

// Validation middleware for products
const validateProduct = [
  body('name').notEmpty().trim().withMessage('Product name is required'),
  body('location').isIn(['Adama', 'Addis Ababa', 'Chemicals']).withMessage('Invalid location'),
  body('initialBalance').isFloat({ min: 0 }).withMessage('Initial balance must be a non-negative number')
];

// Validation middleware for transactions
const validateTransaction = [
  body('type').isIn(['in', 'out']).withMessage('Transaction type must be "in" or "out"'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('date').isISO8601().withMessage('Valid date is required')
];

// GET /api/products - Get all products with balance
router.get('/', async (req, res) => {
  try {
    const { location, search } = req.query;
    let filter = {};
    
    if (location) filter.location = location;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Sort products alphabetically by name
    // Sort products alphabetically A → Z, case-insensitive
  const products = await Product.find(filter)
  .collation({ locale: 'en', strength: 1 })
  .sort({ name: 1 });

    
    // Calculate balance for each product
    const productsWithBalance = await Promise.all(
      products.map(async (product) => {
        const transactions = await Transaction.find({ productId: product._id });
        const totalIn = transactions
          .filter(t => t.type === 'in')
          .reduce((sum, t) => sum + t.quantity, 0);
        const totalOut = transactions
          .filter(t => t.type === 'out')
          .reduce((sum, t) => sum + t.quantity, 0);
        const balance = product.initialBalance + totalIn - totalOut;
        return {
          ...product.toObject(),
          balance,
          totalIn: product.initialBalance + totalIn,
          totalOut
        };
      })
    );
    res.json({
      success: true,
      data: productsWithBalance,
      count: productsWithBalance.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});


// GET /api/products/location/:location - Get products by location
router.get('/location/:location', async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!['Adama', 'Addis Ababa','Chemicals'].includes(location)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location'
      });
    }

    const products = await Product.find({ location }).sort({ createdAt: -1 });
    
    // Calculate balance for each product
    const productsWithBalance = await Promise.all(
      products.map(async (product) => {
        const transactions = await Transaction.find({ productId: product._id });
        const totalIn = transactions
          .filter(t => t.type === 'in')
          .reduce((sum, t) => sum + t.quantity, 0);
        const totalOut = transactions
          .filter(t => t.type === 'out')
          .reduce((sum, t) => sum + t.quantity, 0);
        const balance = product.initialBalance + totalIn - totalOut;
        
        return {
          ...product.toObject(),
          balance,
          totalIn: product.initialBalance + totalIn,
          totalOut
        };
      })
    );

    res.json({
      success: true,
      data: productsWithBalance,
      count: productsWithBalance.length
    });
  } catch (error) {
    console.error('Error fetching products by location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products by location'
    });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Calculate balance
    const transactions = await Transaction.find({ productId: product._id });
    const totalIn = transactions
      .filter(t => t.type === 'in')
      .reduce((sum, t) => sum + t.quantity, 0);
    const totalOut = transactions
      .filter(t => t.type === 'out')
      .reduce((sum, t) => sum + t.quantity, 0);
    const balance = product.initialBalance + totalIn - totalOut;

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        balance,
        totalIn: product.initialBalance + totalIn,
        totalOut
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

// POST /api/products - Create new product
router.post('/', validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const product = new Product(req.body);
    const savedProduct = await product.save();

    // If initial balance is greater than 0, create an initial transaction
    if (req.body.initialBalance > 0) {
      const initialTransaction = new Transaction({
        productId: savedProduct._id,
        type: 'in',
        quantity: req.body.initialBalance,
        date: new Date(),
        description: 'Initial balance'
      });
      await initialTransaction.save();
    }

    res.status(201).json({
      success: true,
      data: {
        ...savedProduct.toObject(),
        balance: req.body.initialBalance,
        totalIn: req.body.initialBalance,
        totalOut: 0
      },
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating product'
    });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Calculate balance
    const transactions = await Transaction.find({ productId: product._id });
    const totalIn = transactions
      .filter(t => t.type === 'in')
      .reduce((sum, t) => sum + t.quantity, 0);
    const totalOut = transactions
      .filter(t => t.type === 'out')
      .reduce((sum, t) => sum + t.quantity, 0);
    const balance = product.initialBalance + totalIn - totalOut;

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        balance,
        totalIn: product.initialBalance + totalIn,
        totalOut
      },
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating product'
    });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete all related transactions
    await Transaction.deleteMany({ productId: req.params.id });

    res.json({
      success: true,
      message: 'Product and related transactions deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
});

// GET /api/products/:id/transactions - Get transactions for a product
router.get('/:id/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const productId = req.params.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let filter = { productId };
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

// POST /api/products/:id/transactions - Add transaction
router.post('/:id/transactions', validateTransaction, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const productId = req.params.id;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // For 'out' transactions, check if there's enough stock
    if (req.body.type === 'out') {
      const transactions = await Transaction.find({ productId });
      const totalIn = transactions
        .filter(t => t.type === 'in')
        .reduce((sum, t) => sum + t.quantity, 0);
      const totalOut = transactions
        .filter(t => t.type === 'out')
        .reduce((sum, t) => sum + t.quantity, 0);
      const currentBalance = product.initialBalance + totalIn - totalOut;

      if (req.body.quantity > currentBalance) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${currentBalance}, Requested: ${req.body.quantity}`
        });
      }
    }

    const transaction = new Transaction({
      ...req.body,
      productId
    });

    const savedTransaction = await transaction.save();

    res.status(201).json({
      success: true,
      data: savedTransaction,
      message: 'Transaction recorded successfully'
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating transaction'
    });
  }
});

// DELETE /api/products/:productId/transactions/:transactionId - Delete transaction
router.delete('/:productId/transactions/:transactionId', async (req, res) => {
  try {
    const { productId, transactionId } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: transactionId,
      productId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting transaction'
    });
  }
});

// PUT /api/products/:productId/transactions/:transactionId - Update transaction
router.put('/:productId/transactions/:transactionId', validateTransaction, async (req, res) => {
  try {
    const { productId, transactionId } = req.params;

    // Ensure transaction exists and belongs to product
    const transaction = await Transaction.findOne({ _id: transactionId, productId });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Only allow updating certain fields
    const updates = {
      quantity: req.body.quantity,
      date: new Date(req.body.date),
      description: req.body.description,
    };

    // Keep the original type unless explicitly provided and valid
    if (req.body.type === 'in' || req.body.type === 'out') {
      updates.type = req.body.type;
    }

    Object.assign(transaction, updates);
    await transaction.save();

    res.json({ success: true, data: transaction, message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(400).json({ success: false, message: error.message || 'Error updating transaction' });
  }
});

// POST /api/products/:id/clear-history - Clear all transaction history
router.post('/:id/clear-history', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete all transactions for this product
    await Transaction.deleteMany({ productId });

    res.json({
      success: true,
      message: 'Transaction history cleared successfully. Balance reset to initial balance.',
      data: {
        ...product.toObject(),
        balance: product.initialBalance,
        totalIn: 0,
        totalOut: 0
      }
    });
  } catch (error) {
    console.error('Error clearing transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing transaction history'
    });
  }
});

export default router;