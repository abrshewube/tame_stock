import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Package, DollarSign, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { recordSalesBatch } from '../services/saleService';

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

interface SaleFormData {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  description: string;
}

interface SaleFormState {
  productId: string;
  productName: string;
  quantity: string;
  price: string;
  description: string;
}

interface StockFormState {
  productId: string;
  quantity: string;
  date: string;
  description: string;
}

interface SaleFormProps {
  products: Product[];
  onSubmit: (data: SaleFormData, saleDate: string) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface StockFormProps {
  products: Product[];
  onSubmit: (data: { productId: string; quantity: number; date: string; description?: string }) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
  defaultDate?: string;
}

interface EditSaleFormProps {
  sale: Sale;
  products: Product[];
  onSubmit: (data: SaleFormData, saleDate: string) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const API_URL = 'https://tame-stock.onrender.com/api';

const LocationSalesPage = () => {
  const navigate = useNavigate();
  const location = useLocation().state?.location;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showBatchStockForm, setShowBatchStockForm] = useState(false);
  const [showEditSaleForm, setShowEditSaleForm] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stockIn, setStockIn] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditStockForm, setShowEditStockForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  useEffect(() => {
    if (location) {
      fetchProducts();
      fetchSales();
      fetchStockIn();
    }
  }, [location, selectedDate]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products?location=${location}`);

      setProducts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    }
  };

  const fetchSales = async () => {
    try {
      const response = await axios.get(`${API_URL}/sales?location=${location}&date=${selectedDate}`);
      const salesData = response.data.docs || response.data.data || [];
      setSales(salesData);
      const allSalesResponse = await axios.get(`${API_URL}/sales?location=${location}`);
      const allSales = (allSalesResponse.data.docs || allSalesResponse.data.data || []) as Sale[];
      const dates: string[] = Array.from(new Set(allSales.map((sale: Sale) => sale.date)));
      dates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
      setAvailableDates(dates);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data. Please try again.');
    }
  };

  const fetchStockIn = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/transactions`, {
        params: { location, date: selectedDate, type: 'in' }
      });
      setStockIn(response.data.data || []);
    } catch (err) {
      console.error('Error fetching stock-in:', err);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleAddSale = async (formData: SaleFormData, saleDate: string) => {
    try {
      setIsSubmitting(true);
      setError('');
      const saleData = {
        ...formData,
        date: saleDate,
        location: location!,
        total: formData.quantity * formData.price
      };
      await axios.post(`${API_URL}/sales`, saleData);
      setSuccess('Sale recorded successfully!');
      setShowSaleForm(false);
      fetchProducts();
      fetchSales();
      return true;
    } catch (err: any) {
      console.error('Error recording sale:', err);
      const errorMessage = err.response?.data?.message || 'Failed to record sale. Please try again.';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStock = async (formData: { productId: string; quantity: number; date: string; description?: string }) => {
    try {
      setIsSubmitting(true);
      setError('');
      const stockData = {
        productId: formData.productId,
        type: 'in',
        quantity: formData.quantity,
        date: formData.date,
        description: formData.description,
      };
      await axios.post(`${API_URL}/products/${formData.productId}/transactions`, stockData);
      setSuccess('Stock added successfully!');
      setShowStockForm(false);
      fetchProducts();
      return true;
    } catch (err: any) {
      console.error('Error adding stock:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add stock. Please try again.';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale);
    setShowEditSaleForm(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) return;
    try {
      setIsSubmitting(true);
      await axios.delete(`${API_URL}/sales/${saleId}`);
      setSuccess('Sale deleted successfully!');
      fetchSales();
    } catch (err: any) {
      console.error('Error deleting sale:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete sale. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStock = (txn: any) => {
    setSelectedTransaction(txn);
    setShowEditStockForm(true);
  };

  const handleDeleteStock = async (txn: any) => {
    if (!window.confirm('Delete this stock entry?')) return;
    try {
      setIsSubmitting(true);
      await axios.delete(`${API_URL}/products/${txn.productId}/transactions/${txn._id}`);
      setSuccess('Stock entry deleted successfully!');
      fetchProducts();
      fetchStockIn();
    } catch (err: any) {
      console.error('Error deleting stock:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete stock.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStock = async (payload: { productId: string; transactionId: string; quantity: number; date: string; description?: string }) => {
    try {
      setIsSubmitting(true);
      setError('');
      await axios.put(`${API_URL}/products/${payload.productId}/transactions/${payload.transactionId}`, {
        type: 'in',
        quantity: payload.quantity,
        date: payload.date,
        description: payload.description,
      });
      setSuccess('Stock entry updated successfully!');
      setShowEditStockForm(false);
      setSelectedTransaction(null);
      fetchProducts();
      fetchStockIn();
      return true;
    } catch (err: any) {
      console.error('Error updating stock:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update stock.';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSale = async (formData: SaleFormData, saleDate: string) => {
    try {
      setIsSubmitting(true);
      setError('');
      const saleData = {
        ...formData,
        date: saleDate,
        location: location!,
        total: formData.quantity * formData.price
      };
      await axios.put(`${API_URL}/sales/${selectedSale?._id}`, saleData);
      setSuccess('Sale updated successfully!');
      setShowEditSaleForm(false);
      fetchProducts();
      fetchSales();
      return true;
    } catch (err: any) {
      console.error('Error updating sale:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update sale. Please try again.';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalSalesForDate = (date: string) => {
    const dateSales = sales.filter(sale => sale.date === date);
    return dateSales.reduce((sum, sale) => sum + sale.total, 0);
  };

  const getSalesCountForDate = (date: string) => {
    return sales.filter(sale => sale.date === date).length;
  };

  // console.log(sales[0].description)
  if (!location) {
    return <div>Location not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{location} Sales Management</h1>
                <p className="text-gray-600">Manage sales and track inventory for {location}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/sales-history/${location}`, { state: { location } })}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Calendar className="h-5 w-5 mr-2" />
                View History
              </button>
              <button
                onClick={() => setShowSaleForm(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Sale
              </button>
              <button
                onClick={() => setShowBatchForm(true)}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Batch Sales
              </button>
              <button
                onClick={() => setShowStockForm(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Stock
              </button>
              <button
                onClick={() => setShowBatchStockForm(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Batch Stock
              </button>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Available Dates List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Available Dates
                </h2>
                {availableDates.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No sales recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {availableDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => handleDateSelect(date)}
                        className={`w-full p-3 rounded-lg border transition-colors text-left ${selectedDate === date
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{formatDate(date)}</span>
                          <span className="text-sm text-gray-500">
                            {getSalesCountForDate(date)} sales
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Total: ETB {getTotalSalesForDate(date).toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sales and Stock for Selected Date */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Sales for {formatDate(selectedDate)}
                      </h2>
                    </div>

                    <div className="text-sm text-gray-500">
                      {sales.length} sales • Total: ETB {sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                    </div>
                  </div>
                  {sales.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No sales recorded for this date</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sales.map((sale) => (
                        <div key={sale._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800">{sale.productName}</h3>
                              {sale.description && (
                                <p className="text-sm text-gray-600 mt-1">{sale.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Package className="h-4 w-4 mr-1" />
                                  Qty: {sale.quantity}
                                </span>
                                <span className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Price: ETB {sale.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-800">
                                ETB {sale.total.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(sale.createdAt).toLocaleTimeString()}
                              </div>
                              <div className="flex space-x-2 mt-2">
                                <button
                                  onClick={() => handleEditSale(sale)}
                                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                >
                                  <Edit2 className="h-4 w-4 mr-1" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSale(sale._id)}
                                  className="text-red-600 hover:text-red-800 text-sm flex items-center"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Stock In for {formatDate(selectedDate)}
                      </h2>
                    </div>
                  </div>
                  {stockIn.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No stock in for this date</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stockIn.map((txn) => (
                        <div key={txn._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800">{txn.productName}</h3>
                              {txn.description && (
                                <p className="text-sm text-gray-600 mt-1">{txn.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Package className="h-4 w-4 mr-1" />
                                  Qty: {txn.quantity}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                {new Date(txn.createdAt).toLocaleTimeString()}
                              </div>
                              <div className="flex space-x-2 mt-2">
                                <button
                                  onClick={() => handleEditStock(txn)}
                                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                >
                                  <Edit2 className="h-4 w-4 mr-1" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteStock(txn)}
                                  className="text-red-600 hover:text-red-800 text-sm flex items-center"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sale Form Modal */}
          {showSaleForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <SaleForm
                  products={products}
                  onSubmit={handleAddSale}
                  onCancel={() => setShowSaleForm(false)}
                  isSubmitting={isSubmitting}
                  defaultDate={selectedDate}
                />
              </div>
            </div>
          )}

          {/* Batch Sales Form Modal */}
          {showBatchForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <BatchSalesForm
                  products={products}
                  defaultDate={selectedDate}
                  locationName={location}
                  onSuccess={() => {
                    setShowBatchForm(false);
                    fetchProducts();
                    fetchSales();
                  }}
                  onCancel={() => setShowBatchForm(false)}
                />
              </div>
            </div>
          )}

          {/* Stock Form Modal */}
          {showStockForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <StockForm
                  products={products}
                  onSubmit={handleAddStock}
                  onCancel={() => setShowStockForm(false)}
                  isSubmitting={isSubmitting}
                  defaultDate={selectedDate}
                />
              </div>
            </div>
          )}

          {/* Batch Stock Form Modal */}
          {showBatchStockForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <BatchStockForm
                  products={products}
                  defaultDate={selectedDate}
                  locationName={location}
                  onSuccess={() => {
                    setShowBatchStockForm(false);
                    fetchProducts();
                    fetchStockIn();
                  }}
                  onCancel={() => setShowBatchStockForm(false)}
                />
              </div>
            </div>
          )}

          {/* Edit Sale Form Modal */}
          {showEditSaleForm && selectedSale && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <EditSaleForm
                  sale={selectedSale}
                  products={products}
                  onSubmit={handleUpdateSale}
                  onCancel={() => setShowEditSaleForm(false)}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Edit Stock Form Modal */}
          {showEditStockForm && selectedTransaction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <EditStockForm
                  transaction={selectedTransaction}
                  onSubmit={handleUpdateStock}
                  onCancel={() => setShowEditStockForm(false)}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sale Form Component
interface SaleFormProps {
  products: Product[];
  onSubmit: (data: SaleFormData, saleDate: string) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
  defaultDate?: string;
}

const SaleForm: React.FC<SaleFormProps> = ({ products, onSubmit, onCancel, isSubmitting, defaultDate }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const normalizeDateString = (d?: string) => {
    if (!d) return todayStr;
    return d.includes('T') ? d.split('T')[0] : d;
  };
  const [formData, setFormData] = useState<SaleFormState>({
    productId: '',
    productName: '',
    quantity: '',
    price: '',
    description: ''
  });
  const [saleDate, setSaleDate] = useState<string>(normalizeDateString(defaultDate));

  useEffect(() => {
    setSaleDate(normalizeDateString(defaultDate));
  }, [defaultDate]);
  const selectedProduct = products.find(p => p._id === formData.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity || !formData.price) {
      return;
    }
    const success = await onSubmit({
      ...formData,
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price)
    }, saleDate);
    if (success) {
      setFormData({
        productId: '',
        productName: '',
        quantity: '',
        price: '',
        description: ''
      });
      setSaleDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p._id === productId);
    setFormData(prev => ({
      ...prev,
      productId,
      productName: product?.name || '',
      price: product?.price.toString() || ''
    }));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Add New Sale</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
          <select
            value={formData.productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name} (Stock: {product.balance})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Add any additional details about this sale..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            max={selectedProduct?.balance || 1}
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={!selectedProduct}
          />
          {selectedProduct && (
            <p className="text-xs text-gray-500 mt-1">
              Available stock: {selectedProduct.balance}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit (ETB)</label>
          <input
            type="number"

            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={!selectedProduct}
          />
        </div>
        {formData.quantity && formData.price && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              Total: ETB {(parseFloat(formData.quantity) * parseFloat(formData.price)).toFixed(2)}
            </p>
          </div>
        )}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.productId || !formData.quantity || !formData.price}
            className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${isSubmitting || !formData.productId || !formData.quantity || !formData.price
              ? 'opacity-50 cursor-not-allowed'
              : ''
              }`}
          >
            {isSubmitting ? 'Processing...' : 'Record Sale'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Stock Form Component
const StockForm: React.FC<StockFormProps> = ({ products, onSubmit, onCancel, isSubmitting, defaultDate }) => {
  const normalizeDateString = (d?: string) => {
    if (!d) return new Date().toISOString().split('T')[0];
    return d.includes('T') ? d.split('T')[0] : d;
  };
  const [formData, setFormData] = useState<StockFormState>({
    productId: '',
    quantity: '',
    date: normalizeDateString(defaultDate),
    description: '',
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, date: normalizeDateString(defaultDate) }));
  }, [defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity) {
      return;
    }
    const success = await onSubmit({
      productId: formData.productId,
      quantity: parseFloat(formData.quantity),
      date: formData.date,
      description: formData.description,
    });
    if (success) {
      setFormData({
        productId: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Add Stock</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
          <select
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Add any additional details..."
          />
        </div>
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.productId || !formData.quantity}
            className={`flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${isSubmitting || !formData.productId || !formData.quantity ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isSubmitting ? 'Processing...' : 'Add Stock'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Edit Sale Form Component
const EditSaleForm: React.FC<EditSaleFormProps> = ({ sale, products, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState<SaleFormState>({
    productId: sale.productId,
    productName: sale.productName,
    quantity: sale.quantity.toString(),
    price: sale.price.toString(),
    description: sale.description || '',
  });
  const [saleDate, setSaleDate] = useState<string>(sale.date);
  const selectedProduct = products.find(p => p._id === formData.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity || !formData.price) {
      return;
    }
    const success = await onSubmit({
      ...formData,
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price)
    }, saleDate);
    if (success) {
      setFormData({
        productId: '',
        productName: '',
        quantity: '',
        price: '',
        description: ''
      });
      setSaleDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p._id === productId);
    setFormData(prev => ({
      ...prev,
      productId,
      productName: product?.name || '',
      price: product?.price.toString() || ''
    }));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Edit Sale</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
          <select
            value={formData.productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name} (Stock: {product.balance})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Add any additional details about this sale..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            max={selectedProduct?.balance || 1}
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={!selectedProduct}
          />
          {selectedProduct && (
            <p className="text-xs text-gray-500 mt-1">
              Available stock: {selectedProduct.balance}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit (ETB)</label>
          <input
            type="number"

            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={!selectedProduct}
          />
        </div>
        {formData.quantity && formData.price && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              Total: ETB {(parseFloat(formData.quantity) * parseFloat(formData.price)).toFixed(2)}
            </p>
          </div>
        )}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.productId || !formData.quantity || !formData.price}
            className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${isSubmitting || !formData.productId || !formData.quantity || !formData.price
              ? 'opacity-50 cursor-not-allowed'
              : ''
              }`}
          >
            {isSubmitting ? 'Processing...' : 'Update Sale'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Edit Stock Form Component
interface EditStockFormProps {
  transaction: any;
  onSubmit: (payload: { productId: string; transactionId: string; quantity: number; date: string; description?: string }) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const EditStockForm: React.FC<EditStockFormProps> = ({ transaction, onSubmit, onCancel, isSubmitting }) => {
  const normalizeDateString = (d?: string) => {
    if (!d) return new Date().toISOString().split('T')[0];
    return d.includes('T') ? d.split('T')[0] : d;
  };
  const [quantity, setQuantity] = useState<string>(String(transaction.quantity || ''));
  const [date, setDate] = useState<string>(normalizeDateString(transaction.date));
  const [description, setDescription] = useState<string>(transaction.description || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity) return;
    await onSubmit({
      productId: String(transaction.productId),
      transactionId: String(transaction._id),
      quantity: parseFloat(quantity),
      date,
      description,
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Edit Stock Entry</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="text-sm text-gray-600">Product</div>
          <div className="font-medium text-gray-800">{transaction.productName || '—'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Add any additional details..."
          />
        </div>
        <div className="flex space-x-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting || !quantity} className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${isSubmitting || !quantity ? 'opacity-50 cursor-not-allowed' : ''}`}>{isSubmitting ? 'Processing...' : 'Update Stock'}</button>
        </div>
      </form>
    </div>
  );
};

export default LocationSalesPage;

interface BatchRow {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  price: string;
}

interface BatchSalesFormProps {
  products: Product[];
  defaultDate: string;
  locationName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const BatchSalesForm: React.FC<BatchSalesFormProps> = ({ products, defaultDate, locationName, onSuccess, onCancel }) => {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [batchDate, setBatchDate] = useState<string>((defaultDate && defaultDate.includes('T')) ? defaultDate.split('T')[0] : defaultDate);
  const [commonDescription, setCommonDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const addRow = () => {
    setRows(prev => ([...prev, { id: Math.random().toString(36).slice(2), productId: '', productName: '', quantity: '', price: '' }]));
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<BatchRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleProductChange = (id: string, productId: string) => {
    const product = products.find(p => p._id === productId);
    updateRow(id, { productId, productName: product?.name || '', price: product ? String(product.price) : '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!rows.length) {
      setError('Please add at least one sale.');
      return;
    }
    // Validate rows
    for (const r of rows) {
      if (!r.productId || !r.quantity) {
        setError('Each row must have product, quantity, and price.');
        return;
      }
    }
    try {
      setSubmitting(true);
      await recordSalesBatch({
        date: batchDate,
        location: locationName,
        description: commonDescription,
        sales: rows.map(r => ({
          productId: r.productId,
          productName: r.productName,
          quantity: parseFloat(r.quantity),
          price: parseFloat(r.price)
        }))
      });
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to record sales batch.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Add Batch Sales</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Common Description (e.g., Ethiopian Date)</label>
            <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value={commonDescription} onChange={(e) => setCommonDescription(e.target.value)} placeholder="Enter Ethiopian date or notes shared for all" />
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((row) => {
            const product = products.find(p => p._id === row.productId);
            return (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-gray-200 rounded-lg p-3">
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
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (ETB)</label>
                  <input type="number" value={row.price} onChange={(e) => updateRow(row.id, { price: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-600 mb-1">Total</div>
                  <div className="font-medium">{row.quantity && row.price ? `ETB ${(parseFloat(row.quantity) * parseFloat(row.price)).toFixed(2)}` : '—'}</div>
                </div>
                <div className="md:col-span-1 flex md:justify-end">
                  <button type="button" onClick={() => removeRow(row.id)} className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Delete</button>
                </div>
              </div>
            );
          })}
          <button type="button" onClick={addRow} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">+ Add Row</button>
        </div>

        <div className="flex space-x-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting || rows.length === 0} className={`flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors ${submitting || rows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>{submitting ? 'Processing...' : 'Submit All Sales'}</button>
        </div>
      </form>
    </div>
  );
};

interface BatchStockRow {
  id: string;
  productId: string;
  quantity: string;
}

interface BatchStockFormProps {
  products: Product[];
  defaultDate: string;
  locationName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const BatchStockForm: React.FC<BatchStockFormProps> = ({ products, defaultDate, locationName, onSuccess, onCancel }) => {
  const [rows, setRows] = useState<BatchStockRow[]>([]);
  const [batchDate, setBatchDate] = useState<string>((defaultDate && defaultDate.includes('T')) ? defaultDate.split('T')[0] : defaultDate);
  const [commonDescription, setCommonDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const addRow = () => setRows(prev => ([...prev, { id: Math.random().toString(36).slice(2), productId: '', quantity: '' }]));
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));
  const updateRow = (id: string, updates: Partial<BatchStockRow>) => setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!rows.length) { setError('Please add at least one stock item.'); return; }
    for (const r of rows) {
      if (!r.productId || !r.quantity) { setError('Each row must have product and quantity.'); return; }
    }
    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/products/transactions/bulk`, {
        date: batchDate,
        location: locationName,
        description: commonDescription,
        items: rows.map(r => ({ productId: r.productId, quantity: parseFloat(r.quantity) }))
      });
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to record stock batch.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Add Batch Stock</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Common Description</label>
            <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value={commonDescription} onChange={(e) => setCommonDescription(e.target.value)} placeholder="Note for all stock entries" />
          </div>
        </div>
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.id} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end border border-gray-200 rounded-lg p-3">
              <div className="md:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select value={row.productId} onChange={(e) => updateRow(row.id, { productId: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
                  <option value="">Select a product</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" min="1" value={row.quantity} onChange={(e) => updateRow(row.id, { quantity: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div className="md:col-span-1 flex md:justify-end">
                <button type="button" onClick={() => removeRow(row.id)} className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Delete</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addRow} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">+ Add Row</button>
        </div>
        <div className="flex space-x-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting || rows.length === 0} className={`flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors ${submitting || rows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>{submitting ? 'Processing...' : 'Submit All Stock'}</button>
        </div>
      </form>
    </div>
  );
};
