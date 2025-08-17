import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import Sale from '../models/Sale.js';

const router = express.Router();

// Record a new sale
router.post('/', async (req, res) => {
  try {
    const { productId, productName, date, location, quantity, price } = req.body;
    
    // Validate input
    if (!productId || !productName || !date || !location || !quantity || price === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (quantity <= 0 || price < 0) {
      return res.status(400).json({ message: 'Invalid quantity or price' });
    }

    // Check if product exists and has enough stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.balance < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Create a transaction for the sale (outgoing stock)
    const transaction = new Transaction({
      productId,
      type: 'out',
      quantity,
      date: new Date(date),
      description: `Sale of ${quantity} units at ${price} ETB each`
    });

    await transaction.save();

    // Update product balance
    product.balance -= quantity;
    await product.save();

    // Record the sale
    const sale = new Sale({
      productId,
      productName,
      date: new Date(date),
      location,
      quantity,
      price,
      total: quantity * price,
      transactionId: transaction._id
    });

    await sale.save();
    
    res.status(201).json({
      message: 'Sale recorded successfully',
      sale: {
        ...sale.toObject(),
        transactionId: transaction._id
      }
    });
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(500).json({ message: 'Error recording sale', error: error.message });
  }
});

// Get sales summary by date range and location
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    
    const match = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }
    
    if (location) match.location = location;

    const sales = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            location: '$location'
          },
          totalSales: { $sum: '$total' },
          totalItems: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': -1, '_id.location': 1 } }
    ]);

    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ message: 'Error fetching sales summary', error: error.message });
  }
});

// Get detailed sales with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      date, 
      location, 
      search = '', 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const query = {};
    
    // Date filter
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    // Location filter
    if (location) query.location = location;
    
    // Search by product name
    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { date: -1, createdAt: -1 },
      select: '-__v'
    };

    // Execute query with pagination
    const result = await Sale.paginate(query, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ 
      message: 'Error fetching sales', 
      error: error.message 
    });
  }
});

export default router;
