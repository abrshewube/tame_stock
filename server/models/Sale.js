import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const saleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Sale date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    enum: ['Adama', 'AddisAbaba']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be at least 0.01']
  },
  price: {
    type: Number,
    // required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  description: {
    type: String,
    
    trim: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: [true, 'Transaction ID is required']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
saleSchema.index({ date: -1 });
saleSchema.index({ location: 1 });
saleSchema.index({ productId: 1 });

// Add pagination plugin
saleSchema.plugin(mongoosePaginate);

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
