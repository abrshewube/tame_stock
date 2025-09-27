import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import Sale from '../models/Sale.js';

const router = express.Router();

// Bulk record sales for a single date
router.post('/bulk', async (req, res) => {
  try {
    const { date, location, description, sales } = req.body;

    if (!date || !location || !Array.isArray(sales) || sales.length === 0) {
      return res.status(400).json({ message: 'Missing required fields (date, location, sales[])' });
    }

    // Basic validation for each sale item
    for (const item of sales) {
      const { productId, productName, quantity, price } = item || {};
      if (!productId || !productName || !quantity ) {
        return res.status(400).json({ message: 'Each sale requires productId, productName, quantity' });
      }
      if (quantity <= 0 ) {
        return res.status(400).json({ message: 'Invalid quantity  in one of the sales' });
      }
    }

    const created = [];

    // Process sequentially to maintain stock integrity
    for (const item of sales) {
      const { productId, productName, quantity, price } = item;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      if (product.balance < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const transaction = new Transaction({
        productId,
        type: 'out',
        quantity,
        date: date,
        description: `Sale of ${quantity} units at ${price} ETB each`
      });
      await transaction.save();

      product.balance -= quantity;
      await product.save();

      const sale = new Sale({
        productId,
        productName,
        date: date,
        location,
        quantity,
        price,
        total: quantity * price,
        transactionId: transaction._id,
        description
      });
      await sale.save();

      created.push({ ...sale.toObject(), transactionId: transaction._id });
    }

    res.status(201).json({ message: 'Sales batch recorded successfully', sales: created });
  } catch (error) {
    console.error('Error recording sales batch:', error);
    res.status(500).json({ message: 'Error recording sales batch', error: error.message });
  }
});

// Record a new sale
router.post('/', async (req, res) => {
  try {
    const { productId, productName, date, location, quantity, price,description } = req.body;
    
    // Validate input
    if (!productId || !productName || !date || !location || !quantity ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (quantity <= 0 ) {
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
      date: date,
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
      date: date,
      location,
      quantity,
      price,
      total: quantity * price,
      transactionId: transaction._id,
      description
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
    console.log(location)
    
    const match = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = startDate;
      if (endDate) match.date.$lte = endDate;
    }

    
    if (location) match.location = location;

    const sales = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: '$date',
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
      startDate,
      endDate,
      location, 
      search = '', 
      page = 1, 
      limit = 1000
    } = req.query;
    
    const query = {};
    
    // Date filter - support both single date and date range
    if (date) {
      query.date = date;
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }
    console.log(location)
    
    // Location filter
    if (location) query.location = location;
    
    // Search by product name
    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10) || 1000,
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
// Update a sale
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, productName, date, location, quantity, price } = req.body;

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const product = await Product.findById(productId || sale.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Revert old sale quantity back to product balance
    product.balance += sale.quantity;

    // Validate new quantity/price
    if (quantity <= 0 || price < 0) {
      return res.status(400).json({ message: 'Invalid quantity or price' });
    }

    if (product.balance < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Deduct new quantity
    product.balance -= quantity;
    await product.save();

    // Update sale
    sale.productId = productId || sale.productId;
    sale.productName = productName || sale.productName;
    sale.date = date || sale.date;
    sale.location = location || sale.location;
    sale.quantity = quantity;
    sale.price = price;
    sale.total = quantity * price;
    await sale.save();

    // Update linked transaction
    if (sale.transactionId) {
      await Transaction.findByIdAndUpdate(sale.transactionId, {
        productId: sale.productId,
        type: 'out',
        quantity: sale.quantity,
        date: sale.date,
        description: `Updated sale of ${sale.quantity} units at ${sale.price} ETB each`
      });
    }

    res.json({ message: 'Sale updated successfully', sale });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ message: 'Error updating sale', error: error.message });
  }
});

// Delete all sales for a specific date and location
router.delete('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { location } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    if (!location) {
      return res.status(400).json({ message: 'Location parameter is required' });
    }

    // Find all sales for the specified date and location
    const salesToDelete = await Sale.find({ date, location });
    
    if (salesToDelete.length === 0) {
      return res.json({ 
        message: 'No sales found for the specified date and location',
        deletedCount: 0
      });
    }

    let deletedCount = 0;

    // Process each sale
    for (const sale of salesToDelete) {
      // Restore stock balance
      const product = await Product.findById(sale.productId);
      if (product) {
        product.balance += sale.quantity;
        await product.save();
      }

      // Delete linked transaction
      if (sale.transactionId) {
        await Transaction.findByIdAndDelete(sale.transactionId);
      }

      // Delete the sale
      await sale.deleteOne();
      deletedCount++;
    }

    res.json({ 
      message: `Successfully deleted ${deletedCount} sales for ${date}`,
      deletedCount,
      date,
      location
    });
  } catch (error) {
    console.error('Error deleting sales for date:', error);
    res.status(500).json({ 
      message: 'Error deleting sales for date', 
      error: error.message 
    });
  }
});

// Delete a sale
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const product = await Product.findById(sale.productId);
    if (product) {
      // Restore stock balance when sale is deleted
      product.balance += sale.quantity;
      await product.save();
    }

    // Delete linked transaction
    if (sale.transactionId) {
      await Transaction.findByIdAndDelete(sale.transactionId);
    }

    await sale.deleteOne();

    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: 'Error deleting sale', error: error.message });
  }
});


export default router;
