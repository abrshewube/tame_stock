import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import axios from 'axios';

type Location = 'Adama' | 'Addis Ababa';

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

const API_URL = 'http://localhost:5000/api';

const DailySalesPage = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState<Location>('Adama');
  const [selectedProduct, setSelectedProduct] = useState<{ _id: string; name: string; price: number } | null>(null);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
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

    if (!selectedProduct || !quantity || !price) {
      setError('Please fill in all fields');
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    const priceNum = parseFloat(price);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please enter a valid price');
      return;
    }

    const saleData = {
      date,
      location,
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      quantity: quantityNum,
      price: priceNum
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Record Daily Sales</h1>
            </div>
            <button
              onClick={() => navigate('/sales-history')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <History className="h-5 w-5 mr-2" />
              View History
            </button>
          </div>
          <div className="p-6">
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as Location)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Adama">Adama</option>
                  <option value="Addis Ababa">Addis Ababa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
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
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Sold
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!selectedProduct}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Unit (ETB)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!selectedProduct}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedProduct || !quantity || !price}
                  className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSubmitting || !selectedProduct || !quantity || !price
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {isSubmitting ? 'Processing...' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySalesPage;
