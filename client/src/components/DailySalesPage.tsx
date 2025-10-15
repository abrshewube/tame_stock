import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import axios from 'axios';

type Location = 'Adama' | 'AddisAbaba' | 'Chemicals';

interface Product {
  _id: string;
  name: string;
  balance: number;
  price: number;
  location: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

const API_URL = 'https://tame.ok1bingo.com/api';

const DailySalesPage = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState<Location>('Adama');
  const [selectedProduct, setSelectedProduct] = useState<{ _id: string; name: string; price: number } | null>(null);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch products when location changes
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await axios.get<ApiResponse<Product[]>>(
          `${API_URL}/products?location=${location}`
        );
        setProducts(response.data.data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [location]);

  // Update price when product changes
  useEffect(() => {
    if (selectedProduct) {
      setPrice(selectedProduct.price.toString());
    } else {
      setPrice('');
    }
  }, [selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedProduct || !quantity ) {
      setError('Please fill in all fields');
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    const priceNum = parseFloat(price);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

   

    const saleData = {
      date,
      location,
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      quantity: quantityNum,
      price: priceNum,
      description
    };

    try {
      setIsSubmitting(true);
      
      await axios.post<ApiResponse<{ sale: any; transaction: any }>>(
        `${API_URL}/sales`,
        saleData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccess('Sale recorded successfully!');
      
      // Reset form
      setQuantity('');
      setPrice('');
      setDescription('');
      setSelectedProduct(null);
      
      // Refresh products to update stock
      const productsResponse = await axios.get<ApiResponse<Product[]>>(
        `${API_URL}/products?location=${location}`
      );
      setProducts(productsResponse.data.data || []);
      
    } catch (err: any) {
      console.error('Error recording sale:', err);
      const errorMessage = err.response?.data?.message || 'Failed to record sale. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <div className="backdrop-blur-lg bg-white/80 rounded-2xl shadow-xl border border-white/50 p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/')}
                  className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all mr-4 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Record Daily Sales
                    </h1>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-11">Track your sales efficiently</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/sales-history')}
                className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <History className="h-5 w-5 mr-2" />
                View History
              </button>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Decorative Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="h-8 w-8" />
                  <div>
                    <h2 className="text-xl font-bold">Sales Form</h2>
                    <p className="text-sm text-blue-100">Fill in the details below</p>
                  </div>
                </div>
                <TrendingUp className="h-12 w-12 opacity-20" />
              </div>
            </div>

            <div className="p-8">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-700 px-5 py-4 rounded-xl mb-6 shadow-lg flex items-center space-x-2 animate-slide-up">
                <div className="p-1 bg-red-200 rounded-full">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-100 border-2 border-green-300 text-green-700 px-5 py-4 rounded-xl mb-6 shadow-lg flex items-center space-x-2 animate-slide-up">
                <div className="p-1 bg-green-200 rounded-full">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📍 Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value as Location)}
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  >
                    <option value="Adama">Adama</option>
                    <option value="AddisAbaba">Pysaa Seeds</option>
                    <option value="Chemicals">Pysaa Chemicals</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📦 Product
                </label>
                <select
                  value={selectedProduct?._id || ''}
                  onChange={(e) => {
                    const product = products.find(p => p._id === e.target.value);
                    setSelectedProduct(product ? { 
                      _id: product._id, 
                      name: product.name, 
                      price: product.price 
                    } : null);
                  }}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  disabled={isLoading || products.length === 0}
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} (Stock: {product.balance})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔢 Quantity Sold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                    disabled={!selectedProduct}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💰 Price per Unit (ETB)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                    disabled={!selectedProduct}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows={3}
                  placeholder="Add any additional details about this sale..."
                />
              </div>

              {quantity && price && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {(parseInt(quantity) * parseFloat(price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedProduct || !quantity || !price}
                  className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-semibold text-lg shadow-lg transform hover:scale-[1.02] transition-all ${
                    isSubmitting || !selectedProduct || !quantity || !price
                      ? 'opacity-50 cursor-not-allowed transform-none'
                      : ''
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Record Sale
                    </span>
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySalesPage;
