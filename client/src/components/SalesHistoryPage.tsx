import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Package, DollarSign, TrendingUp, Clock } from 'lucide-react';
import axios from 'axios';

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

interface DateSummary {
  date: string;
  salesCount: number;
  totalAmount: number;
  products: string[];
}

const API_URL = 'http://localhost:5000/api';

const SalesHistoryPage = () => {
  const navigate = useNavigate();
  const { location } = useParams<{ location: string }>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateSummaries, setDateSummaries] = useState<DateSummary[]>([]);
  const [salesForSelectedDate, setSalesForSelectedDate] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location) {
      fetchSalesHistory();
    }
  }, [location]);

  useEffect(() => {
    if (selectedDate) {
      fetchSalesForDate(selectedDate);
    }
  }, [selectedDate, location]);

  const fetchSalesHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${API_URL}/sales?location=${location}`);
      const allSales = response.data.docs || response.data.data || [];
      
      // Group sales by date and create summaries
      const salesByDate = allSales.reduce((acc: { [key: string]: Sale[] }, sale: Sale) => {
        if (!acc[sale.date]) {
          acc[sale.date] = [];
        }
        acc[sale.date].push(sale);
        return acc;
      }, {});

      // Create date summaries
      const summaries: DateSummary[] = Object.keys(salesByDate).map(date => {
        const dateSales = salesByDate[date];
        const totalAmount = dateSales.reduce((sum: number, sale: Sale) => sum + sale.total, 0);
        const products = [...new Set(dateSales.map((sale: Sale) => sale.productName))];
        
        return {
          date,
          salesCount: dateSales.length,
          totalAmount,
          products
        };
      });

      // Sort by date (newest first)
      summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDateSummaries(summaries);
      
    } catch (err) {
      console.error('Error fetching sales history:', err);
      setError('Failed to load sales history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesForDate = async (date: string) => {
    try {
      const response = await axios.get(`${API_URL}/sales?location=${location}&date=${date}`);
      const salesData = response.data.docs || response.data.data || [];
      setSalesForSelectedDate(salesData);
    } catch (err) {
      console.error('Error fetching sales for date:', err);
      setError('Failed to load sales for selected date. Please try again.');
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleBackToDates = () => {
    setSelectedDate(null);
    setSalesForSelectedDate([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (!location) {
    return <div>Location not found</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales history...</p>
        </div>
      </div>
    );
  }

  if (selectedDate) {
    // Show sales for selected date
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <button
                  onClick={handleBackToDates}
                  className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Dates
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Sales for {formatDate(selectedDate)}
                  </h1>
                  <p className="text-gray-600">
                    {salesForSelectedDate.length} sales • Total: ETB {salesForSelectedDate.reduce((sum: number, sale: Sale) => sum + sale.total, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Sales List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {salesForSelectedDate.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No sales recorded for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {salesForSelectedDate.map((sale) => (
                    <div key={sale._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 text-lg">{sale.productName}</h3>
                          {sale.description && (
                            <p className="text-sm text-gray-600 mt-1">{sale.description}</p>
                          )}
                          <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Package className="h-4 w-4 mr-2" />
                              Quantity: {sale.quantity}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Price: ETB {sale.price.toFixed(2)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {new Date(sale.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-semibold text-gray-800">
                            ETB {sale.total.toFixed(2)}
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
    );
  }

  // Show list of dates
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{location} Sales History</h1>
                <p className="text-gray-600">View sales history by date</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Dates List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Sales by Date
            </h2>
            
            {dateSummaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No sales recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dateSummaries.map((summary) => (
                  <button
                    key={summary.date}
                    onClick={() => handleDateSelect(summary.date)}
                    className="w-full p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800 text-lg">
                              {formatDate(summary.date)}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {summary.products.length} different products sold
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-800">
                          ETB {summary.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {summary.salesCount} sales
                        </div>
                      </div>
                    </div>
                    
                    {/* Product preview */}
                    {summary.products.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Products sold:</p>
                        <div className="flex flex-wrap gap-1">
                          {summary.products.slice(0, 3).map((product, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {product}
                            </span>
                          ))}
                          {summary.products.length > 3 && (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{summary.products.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {dateSummaries.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="p-3 bg-blue-100 rounded-full mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{dateSummaries.length}</p>
                <p className="text-sm text-gray-600">Days with Sales</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="p-3 bg-green-100 rounded-full mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {dateSummaries.reduce((sum: number, summary: DateSummary) => sum + summary.salesCount, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Sales</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="p-3 bg-purple-100 rounded-full mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  ETB {dateSummaries.reduce((sum: number, summary: DateSummary) => sum + summary.totalAmount, 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesHistoryPage;
