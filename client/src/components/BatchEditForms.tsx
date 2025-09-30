import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://tame-stock.onrender.com/api';

interface Product {
  _id: string;
  name: string;
  balance: number;
  price: number;
  location: string;
}

interface Sale {
  _id: string;
  productId: string;
  productName: string;
  date: string;
  location: string;
  quantity: number;
  price: number;
  description?: string;
  total: number;
  createdAt: string;
}

const formatDate = (dateString: string) => {
  const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Batch Edit Sales Form Component
interface BatchEditSalesFormProps {
  sales: Sale[];
  products: Product[];
  defaultDate: string;
  locationName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BatchEditSalesForm: React.FC<BatchEditSalesFormProps> = ({ sales, products, defaultDate, locationName, onSuccess, onCancel }) => {
  const [rows, setRows] = useState<Array<{
    id: string;
    saleId: string;
    productId: string;
    productName: string;
    quantity: string;
    price: string;
    description: string;
  }>>([]);
  const [batchDate, setBatchDate] = useState<string>((defaultDate && defaultDate.includes('T')) ? defaultDate.split('T')[0] : defaultDate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Initialize rows with existing sales data
  useEffect(() => {
    const initialRows = sales.map(sale => ({
      id: sale._id,
      saleId: sale._id,
      productId: sale.productId,
      productName: sale.productName,
      quantity: sale.quantity.toString(),
      price: sale.price.toString(),
      description: sale.description || ''
    }));
    setRows(initialRows);
  }, [sales]);

  const updateRow = (id: string, updates: Partial<typeof rows[0]>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleProductChange = (id: string, productId: string) => {
    const product = products.find(p => p._id === productId);
    updateRow(id, { productId, productName: product?.name || '', price: product ? String(product.price) : '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!rows.length) {
      setError('No sales to update.');
      return;
    }

    // Validate rows
    for (const r of rows) {
      if (!r.productId || !r.quantity || !r.price) {
        setError('Each sale must have product, quantity, and price.');
        return;
      }
    }

    try {
      setSubmitting(true);
      
      // Update each sale
      for (const row of rows) {
        await axios.put(`${API_URL}/sales/${row.saleId}`, {
          productId: row.productId,
          productName: row.productName,
          date: batchDate,
          location: locationName,
          quantity: parseFloat(row.quantity),
          price: parseFloat(row.price),
          description: row.description
        });
      }

      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update sales.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Edit Sales for {formatDate(batchDate)}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} required />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {rows.map((row) => {
            const product = products.find(p => p._id === row.productId);
            return (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select value={row.productId} onChange={(e) => handleProductChange(row.id, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="">Select a product</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name} (Stock: {p.balance})</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min="0.01" step="0.01" max={product?.balance || undefined} value={row.quantity} onChange={(e) => updateRow(row.id, { quantity: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (ETB)</label>
                  <input type="number" step="0.01" value={row.price} onChange={(e) => updateRow(row.id, { price: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={row.description} onChange={(e) => updateRow(row.id, { description: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Optional" />
                </div>
                <div className="md:col-span-1 flex md:justify-end">
                  <button type="button" onClick={() => removeRow(row.id)} className="px-3 py-2 border border-gray-300 text-red-600 rounded-md hover:bg-red-50" title="Remove this sale">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex space-x-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting || rows.length === 0} className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${submitting || rows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>{submitting ? 'Updating...' : `Update ${rows.length} Sale(s)`}</button>
        </div>
      </form>
    </div>
  );
};

// Batch Edit Stock Form Component
interface BatchEditStockFormProps {
  stockEntries: any[];
  products: Product[];
  defaultDate: string;
  locationName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BatchEditStockForm: React.FC<BatchEditStockFormProps> = ({ stockEntries, products, defaultDate, locationName, onSuccess, onCancel }) => {
  const [rows, setRows] = useState<Array<{
    id: string;
    transactionId: string;
    productId: string;
    productName: string;
    quantity: string;
    description: string;
  }>>([]);
  const [batchDate, setBatchDate] = useState<string>((defaultDate && defaultDate.includes('T')) ? defaultDate.split('T')[0] : defaultDate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Initialize rows with existing stock data
  useEffect(() => {
    const initialRows = stockEntries.map(stock => ({
      id: stock._id,
      transactionId: stock._id,
      productId: stock.productId,
      productName: stock.productName || '',
      quantity: stock.quantity.toString(),
      description: stock.description || ''
    }));
    setRows(initialRows);
  }, [stockEntries]);

  const updateRow = (id: string, updates: Partial<typeof rows[0]>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleProductChange = (id: string, productId: string) => {
    const product = products.find(p => p._id === productId);
    updateRow(id, { productId, productName: product?.name || '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!rows.length) {
      setError('No stock entries to update.');
      return;
    }

    // Validate rows
    for (const r of rows) {
      if (!r.productId || !r.quantity) {
        setError('Each stock entry must have product and quantity.');
        return;
      }
    }

    try {
      setSubmitting(true);
      
      // Update each stock entry
      for (const row of rows) {
        await axios.put(`${API_URL}/products/${row.productId}/transactions/${row.transactionId}`, {
          type: 'in',
          quantity: parseFloat(row.quantity),
          date: batchDate,
          description: row.description
        });
      }

      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update stock entries.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Edit Stock for {formatDate(batchDate)}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} required />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {rows.map((row) => {
            return (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select value={row.productId} onChange={(e) => handleProductChange(row.id, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="">Select a product</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min="0.01" step="0.01" value={row.quantity} onChange={(e) => updateRow(row.id, { quantity: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={row.description} onChange={(e) => updateRow(row.id, { description: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Optional" />
                </div>
                <div className="md:col-span-1 flex md:justify-end">
                  <button type="button" onClick={() => removeRow(row.id)} className="px-3 py-2 border border-gray-300 text-red-600 rounded-md hover:bg-red-50" title="Remove this stock entry">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex space-x-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting || rows.length === 0} className={`flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors ${submitting || rows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>{submitting ? 'Updating...' : `Update ${rows.length} Stock Entr${rows.length === 1 ? 'y' : 'ies'}`}</button>
        </div>
      </form>
    </div>
  );
};
