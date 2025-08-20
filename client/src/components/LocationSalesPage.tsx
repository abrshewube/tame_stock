import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Package, DollarSign, MapPin } from 'lucide-react';
import axios from 'axios';

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

interface SaleFormProps {
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
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (location) {
      fetchProducts();
      fetchSales();
    }
  }, [location, selectedDate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products?location=${location}`);
      setProducts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await axios.get(`${API_URL}/sales?location=${location}&date=${selectedDate}`);
      const salesData = response.data.docs || response.data.data || [];
      setSales(salesData);

      const allSalesResponse = await axios.get(`${API_URL}/sales?location=${location}`);
      const allSales = allSalesResponse.data.docs || allSalesResponse.data.data || [];
      const dates = [...new Set(allSales.map((sale: Sale) => sale.date))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      setAvailableDates(dates);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data. Please try again.');
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
                        className={`w-full p-3 rounded-lg border transition-colors text-left ${
                          selectedDate === date
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
            {/* Sales for Selected Date */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Sales for {formatDate(selectedDate)}
                  </h2>
                  <div className="text-sm text-gray-500">
                    {sales.length} sales • Total: ETB {sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                  </div>
                </div>
                {sales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No sales recorded for this date</p>
                    <button
                      onClick={() => setShowSaleForm(true)}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Add your first sale
                    </button>
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
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sale Form Component
const SaleForm: React.FC<SaleFormProps> = ({
  products,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<SaleFormState>({
    productId: '',
    productName: '',
    quantity: '',
    price: '',
    description: ''
  });
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const selectedProduct = products.find(p => p._id === formData.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId || !formData.quantity || !formData.price) {
      return;
    }

    const success = await onSubmit({
      ...formData,
      quantity: parseInt(formData.quantity),
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
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Add any additional details about this sale..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            min="1"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price per Unit (ETB)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
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
            className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${
              isSubmitting || !formData.productId || !formData.quantity || !formData.price
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

export default LocationSalesPage;
