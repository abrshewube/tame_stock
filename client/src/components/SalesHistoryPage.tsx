import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Package, DollarSign, TrendingUp, Clock, Download } from 'lucide-react';
import axios from 'axios';
import ExportSalesModal from './ExportSalesModal';

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

const API_URL = 'https://tame-stock.onrender.com/api';

const SalesHistoryPage = () => {
  const navigate = useNavigate();
  const { location } = useParams<{ location: string }>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateSummaries, setDateSummaries] = useState<DateSummary[]>([]);
  const [salesForSelectedDate, setSalesForSelectedDate] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateOnly, setExportDateOnly] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        const products = [...new Set(dateSales.map((sale: Sale) => sale.productName))] as string[];
        
        return {
          date,
          salesCount: dateSales.length,
          totalAmount,
          products
        };
      });

      // Sort by date (newest first) - dates are now strings in YYYY-MM-DD format
      summaries.sort((a, b) => b.date.localeCompare(a.date));
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

  const handleExportDate = (date: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent date selection
    setExportDateOnly(date);
    setShowExportModal(true);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
    setExportDateOnly(undefined);
  };

  const formatDate = (dateString: string) => {
    // Handle both string dates (YYYY-MM-DD) and ISO date strings
    const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // Helper function to get display name for locations
  const getLocationDisplayName = (location: string): string => {
    const displayNames: Record<string, string> = {
      Adama: "Adama",
      AddisAbaba: "Pysaa Seeds",
      Chemicals: "Pysaa Chemicals"
    };
    return displayNames[location] || location;
  };

  if (!location) {
    return <div>Location not found</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="relative inline-flex">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Package className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">Loading sales history...</p>
          <p className="mt-2 text-sm text-gray-500">Fetching your data</p>
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -20px) scale(1.1); }
            50% { transform: translate(-20px, 20px) scale(0.9); }
            75% { transform: translate(20px, 20px) scale(1.05); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}} />
      </div>
    );
  }

  if (selectedDate) {
    // Show sales for selected date
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Header - More Compact */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={handleBackToDates}
                  className="flex items-center text-blue-600 hover:text-blue-800 mr-3"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    Sales for {formatDate(selectedDate)}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {salesForSelectedDate.length} sales • Total: {salesForSelectedDate.reduce((sum: number, sale: Sale) => sum + sale.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Sales List - Beautiful Enhanced Version */}
            <div className="backdrop-blur-lg bg-white/80 rounded-2xl shadow-xl border border-white/50 p-6">
              {salesForSelectedDate.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl mb-4">
                    <Calendar className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Sales Yet</h3>
                  <p className="text-sm text-gray-500">No sales recorded for this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {salesForSelectedDate.map((sale, index) => (
                    <div 
                      key={sale._id} 
                      className="group relative bg-gradient-to-r from-white to-blue-50/30 rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shine rounded-xl"></div>
                      
                      <div className="relative z-10 flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                              <Package className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{sale.productName}</h3>
                          </div>
                          {sale.description && (
                            <p className="text-xs text-gray-600 ml-12 mb-2 italic">{sale.description}</p>
                          )}
                          <div className="flex items-center space-x-4 ml-12 text-xs text-gray-500">
                            <span className="flex items-center px-2 py-1 bg-gray-100 rounded-full">
                              <Package className="h-3 w-3 mr-1" />
                              {sale.quantity} units
                            </span>
                            <span className="flex items-center px-2 py-1 bg-gray-100 rounded-full">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {sale.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="flex items-center px-2 py-1 bg-gray-100 rounded-full">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-md font-bold group-hover:shadow-lg transition-shadow">
                            {sale.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes shine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              .animate-shine {
                animation: shine 1.5s ease-in-out;
              }
            `}} />
          </div>
        </div>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(dateSummaries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDates = dateSummaries.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Show list of dates
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-40 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header - More Compact */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-blue-600 hover:text-blue-800 mr-3"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{getLocationDisplayName(location)} Sales History</h1>
                <p className="text-sm text-gray-600">View sales history by date</p>
              </div>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Dates List - Beautiful Enhanced Version */}
          <div className="backdrop-blur-lg bg-white/80 rounded-2xl shadow-2xl border border-white/50 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-3">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  Sales History
                </h2>
                <p className="text-sm text-gray-500 mt-1 ml-14">Browse sales by date</p>
              </div>
              {dateSummaries.length > 0 && (
                <div className="text-right">
                  <div className="inline-flex items-center px-3 py-1 bg-blue-100 rounded-full">
                    <span className="text-sm font-semibold text-blue-700">
                      {dateSummaries.length} dates
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {dateSummaries.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-4">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Sales Yet</h3>
                <p className="text-sm text-gray-500">Start recording sales to see them here</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedDates.map((summary, index) => (
                  <div
                    key={summary.date}
                    className="group relative overflow-hidden"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <button
                      onClick={() => handleDateSelect(summary.date)}
                      className="w-full text-left relative"
                    >
                      <div className="relative bg-gradient-to-r from-white to-indigo-50/50 rounded-xl p-4 border-2 border-gray-200 group-hover:border-blue-400 transition-all duration-300 transform group-hover:scale-[1.02] group-hover:shadow-xl">
                        {/* Animated Border Gradient */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex-1 flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-base group-hover:text-blue-600 transition-colors">
                                {formatDate(summary.date)}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  <Package className="h-3 w-3 mr-1" />
                                  {summary.products.length} products
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  {summary.salesCount} sales
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-md font-bold text-base group-hover:shadow-lg transition-shadow">
                                {summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleExportDate(summary.date, e)}
                              className="p-2.5 text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl transition-all transform hover:scale-110 shadow-md hover:shadow-lg"
                              title="Export this date to Excel"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-4 gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
              </>
            )}
          </div>

          {/* Summary Stats - Beautiful Enhanced Version */}
          {dateSummaries.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-3 w-14 h-14 flex items-center justify-center">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{dateSummaries.length}</p>
                  <p className="text-sm text-blue-100 font-medium">Days with Sales</p>
                </div>
              </div>
              
              <div className="group relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-3 w-14 h-14 flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {dateSummaries.reduce((sum: number, summary: DateSummary) => sum + summary.salesCount, 0)}
                  </p>
                  <p className="text-sm text-green-100 font-medium">Total Sales</p>
                </div>
              </div>
              
              <div className="group relative bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-3 w-14 h-14 flex items-center justify-center">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {dateSummaries.reduce((sum: number, summary: DateSummary) => sum + summary.totalAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-purple-100 font-medium">Total Revenue (ETB)</p>
                </div>
              </div>
            </div>
          )}

          {/* Export Sales Modal */}
          <ExportSalesModal
            isOpen={showExportModal}
            onClose={handleCloseExportModal}
            location={location}
            locationDisplayName={getLocationDisplayName(location)}
            singleDate={exportDateOnly}
          />
        </div>
      </div>
    </div>
  );
};

export default SalesHistoryPage;
