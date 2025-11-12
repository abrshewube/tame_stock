import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Package, Edit2, Trash2, X, Download, TrendingUp, ShoppingCart, Sparkles, Star, Zap } from 'lucide-react';
import axios from 'axios';
import { recordSalesBatch } from '../services/saleService';
import ExportSalesModal from './ExportSalesModal';
import { BatchEditSalesForm, BatchEditStockForm } from './BatchEditForms';

// Helper function to get display name for locations
const getLocationDisplayName = (location: string): string => {
  const displayNames: Record<string, string> = {
    Adama: "Adama",
    AddisAbaba: "Pysaa Seeds",
    Chemicals: "Pysaa Chemicals"
  };
  return displayNames[location] || location;
};

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
  receiver?: string;
}

interface SaleFormData {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  description: string;
  receiver?: string;
}

interface SaleFormState {
  productId: string;
  productName: string;
  quantity: string;
  price: string;
  description: string;
  receiver: string;
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

const API_URL = 'https://tame.ok1bingo.com/api';
const DEFAULT_RECEIVER_ORDER = ['Tame', 'Dawit', 'Cash', 'Abraraw', 'Meseret', 'Adama'];
const RECEIVER_OPTIONS = [...DEFAULT_RECEIVER_ORDER, 'Other'];

const sortReceiverEntries = (entries: [string, number][]) => {
  return entries.sort((a, b) => {
    const indexA = DEFAULT_RECEIVER_ORDER.indexOf(a[0]);
    const indexB = DEFAULT_RECEIVER_ORDER.indexOf(b[0]);
    if (indexA === -1 && indexB === -1) {
      return a[0].localeCompare(b[0]);
    }
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
};

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
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditStockForm, setShowEditStockForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [showBatchEditSalesForm, setShowBatchEditSalesForm] = useState(false);
  const [showBatchEditStockForm, setShowBatchEditStockForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [exportDateOnly, setExportDateOnly] = useState<string | undefined>(undefined);
  const [receiverTotalsForDate, setReceiverTotalsForDate] = useState<Record<string, number>>({});
  const receiverSummaryEntries = useMemo(
    () =>
      sortReceiverEntries(
        Object.entries(receiverTotalsForDate).filter(([, total]) => total > 0)
      ),
    [receiverTotalsForDate]
  );

  useEffect(() => {
    if (location) {
      fetchProducts();
      fetchAvailableDates();
    }
  }, [location]);

  useEffect(() => {
    if (location && selectedDate) {
      // Update sales from allSales instead of making API call
      if (allSales.length > 0) {
        const salesData = allSales.filter(sale => 
          sale.date === selectedDate && 
          sale._id && 
          sale.quantity > 0
        );
        console.log('Sales for selected date:', salesData);
        setSales(salesData);
      }
      fetchStockIn();
    }
  }, [location, selectedDate, allSales]);

  useEffect(() => {
    const totals = sales.reduce((acc, sale) => {
      if (sale.receiver) {
        const key = sale.receiver;
        const totalValue = sale.total ?? sale.quantity * sale.price;
        acc[key] = (acc[key] || 0) + totalValue;
      }
      return acc;
    }, {} as Record<string, number>);

    setReceiverTotalsForDate(totals);
  }, [sales]);

  // Reset to page 1 if current page is beyond total pages after filtering
  useEffect(() => {
    const validDates = availableDates.filter(date => {
      const count = getSalesCountForDate(date);
      const total = getTotalSalesForDate(date);
      return count > 0 && total > 0;
    });
    const maxPages = Math.ceil(validDates.length / itemsPerPage);
    if (currentPage > maxPages && maxPages > 0) {
      setCurrentPage(1);
    }
  }, [availableDates, allSales, currentPage]);

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
      console.log('Fetching sales for location:', location, 'date:', selectedDate);
      
      // Use allSales data if available (more reliable and faster)
      if (allSales.length > 0) {
        const salesData = allSales.filter(sale => 
          sale.date === selectedDate && 
          sale._id && 
          sale.quantity > 0
        );
        console.log('Sales data for selected date (from allSales):', salesData);
        setSales(salesData);
      } else {
        // Fallback to API call if allSales is empty
        const response = await axios.get(`${API_URL}/sales?location=${location}&date=${selectedDate}`);
        console.log("selected data",response.data)
        const salesData = response.data.docs || response.data.data || [];
        console.log('Sales data for selected date (from API):', salesData);
        setSales(salesData);
      }
      
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data. Please try again.');
    }
  };

  const fetchAvailableDates = async () => {
    try {
      console.log('Fetching all sales for location:', location);
      
      // Fetch all sales for this location with a high limit to get all records
      const allSalesResponse = await axios.get(`${API_URL}/sales`, {
        params: {
          location: location,
          limit: 10000 // Get all sales
        }
      });
      const allSalesData = (allSalesResponse.data.docs || allSalesResponse.data.data || []) as Sale[];
      console.log('All sales for location:', allSalesData);
      console.log('Total sales fetched:', allSalesData.length);
      
      // Store all sales for use in calculations
      setAllSales(allSalesData);
      
      // Group sales by date - only include VALID sales
      const salesByDate: { [key: string]: { count: number; total: number } } = {};
      allSalesData.forEach(sale => {
        // Only include sales with valid data
        if (sale.date && sale._id && sale.quantity > 0 && (sale.total > 0 || (sale.quantity * sale.price) > 0)) {
          if (!salesByDate[sale.date]) {
            salesByDate[sale.date] = { count: 0, total: 0 };
          }
          salesByDate[sale.date].count += 1;
          salesByDate[sale.date].total += sale.total;
        }
      });
      
      // Only include dates that have at least 1 VALID sale with total > 0
      const dates: string[] = Object.keys(salesByDate).filter(date => 
        salesByDate[date].count > 0 && salesByDate[date].total > 0
      );
      dates.sort((a: string, b: string) => b.localeCompare(a));
      
      console.log('Sales by date:', salesByDate);
      console.log('Available dates (with valid sales):', dates);
      setAvailableDates(dates);
      
    } catch (err) {
      console.error('Error fetching available dates:', err);
      setError('Failed to load available dates. Please try again.');
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

  const handleDateToggle = (date: string) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(prev => prev.filter(d => d !== date));
    } else {
      setSelectedDates(prev => [...prev, date]);
    }
  };

  const handleSelectAllDates = () => {
    // Use validAvailableDates (filtered dates with actual valid sales)
    const validDates = availableDates.filter(date => {
      const count = getSalesCountForDate(date);
      const total = getTotalSalesForDate(date);
      return count > 0 && total > 0;
    });
    if (selectedDates.length === validDates.length) {
      setSelectedDates([]);
    } else {
      setSelectedDates([...validDates]);
    }
  };

  const handleBulkDeleteDates = async () => {
    if (selectedDates.length === 0) {
      setError('Please select at least one date to delete.');
      return;
    }

    const confirmMessage = `Are you sure you want to delete all sales for ${selectedDates.length} selected date(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      let totalDeletedCount = 0;
      let datesWithSales = 0;
      let datesWithoutSales = 0;
      
      for (const date of selectedDates) {
        // Ensure date is in YYYY-MM-DD format
        let normalizedDate = date;
        if (typeof date === 'string') {
          if (date.includes('T')) {
            normalizedDate = date.split('T')[0];
          }
          normalizedDate = normalizedDate.trim();
        }
        
        console.log('Deleting sales for date:', normalizedDate, 'location:', location);
        
        try {
          const response = await axios.delete(`${API_URL}/sales/date/${normalizedDate}`, {
            params: { location }
          });
          const { deletedCount } = response.data;
          
          if (deletedCount > 0) {
            datesWithSales++;
            totalDeletedCount += deletedCount;
          } else {
            datesWithoutSales++;
          }
        } catch (err) {
          console.error(`Error deleting sales for date ${date}:`, err);
          // Continue with other dates even if one fails
        }
      }

      // Create success message based on what was processed
      let successMessage = '';
      if (datesWithSales > 0 && datesWithoutSales > 0) {
        successMessage = `Successfully deleted ${totalDeletedCount} sales from ${datesWithSales} date(s). ${datesWithoutSales} date(s) had no sales and were removed from the list.`;
      } else if (datesWithSales > 0) {
        successMessage = `Successfully deleted ${totalDeletedCount} sales from ${datesWithSales} date(s)!`;
      } else {
        successMessage = `${datesWithoutSales} date(s) had no sales and were removed from the list.`;
      }
      
      setSuccess(successMessage);
      setSelectedDates([]);

      // Refresh all data
      await Promise.all([
        fetchProducts(),
        fetchAvailableDates(),
        fetchStockIn()
      ]);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err: any) {
      console.error('Error bulk deleting dates:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete selected dates. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDate = async (date: string) => {
    const salesCount = getSalesCountForDate(date);
    const totalAmount = getTotalSalesForDate(date);
    
    if (!window.confirm(`Are you sure you want to delete all ${salesCount} sales (Total: ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB) for ${formatDate(date)}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');
      
      // Ensure date is in YYYY-MM-DD format (should already be from database)
      let normalizedDate = date;
      if (typeof date === 'string') {
        // If it contains 'T', it's an ISO string, extract the date part
        if (date.includes('T')) {
          normalizedDate = date.split('T')[0];
        }
        // Trim any whitespace
        normalizedDate = normalizedDate.trim();
      }
      
      console.log('=== FRONTEND DELETE REQUEST ===');
      console.log('Original date:', date);
      console.log('Date type:', typeof date);
      console.log('Normalized date:', normalizedDate);
      console.log('Location:', location);
      console.log('Expected sales count:', salesCount);
      
      // Use the new endpoint to delete all sales for the date
      // Don't encode the date if it's already in YYYY-MM-DD format
      const response = await axios.delete(`${API_URL}/sales/date/${normalizedDate}`, {
        params: { location }
      });
      
      console.log('Delete response:', response.data);
      
      const { deletedCount, errors } = response.data;
      
      if (errors && errors.length > 0) {
        console.error('Some sales failed to delete:', errors);
        setError(`Deleted ${deletedCount} sales, but ${errors.length} failed. Check console for details.`);
      }
      
      // Immediately update local state - remove date from list regardless of deletedCount
      setAvailableDates(prev => prev.filter(d => d !== date));
      setAllSales(prev => prev.filter(sale => sale.date !== date));
      
      // If this was the selected date, switch to the next available date
      if (selectedDate === date) {
        const remainingDates = availableDates.filter(d => d !== date);
        if (remainingDates.length > 0) {
          setSelectedDate(remainingDates[0]);
        } else {
          setSelectedDate(new Date().toISOString().split('T')[0]);
        }
      }
      
      // Show appropriate success message
      if (deletedCount === 0) {
        setSuccess(`Date ${formatDate(date)} has been removed from the list.`);
      } else {
        setSuccess(`Successfully deleted ${deletedCount} sales for ${formatDate(date)}! Stock balances have been restored.`);
      }
      
      // Refresh all data from server
      await Promise.all([
        fetchProducts(),
        fetchAvailableDates(),
        fetchStockIn()
      ]);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err: any) {
      console.error('Error deleting sales for date:', err);
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete sales for this date. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSale = async (formData: SaleFormData, saleDate: string) => {
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');
      
      const saleData = {
        ...formData,
        date: saleDate,
        location: location!,
        total: formData.quantity * formData.price,
        receiver: formData.receiver
      };
      
      console.log('Adding sale:', saleData);
      await axios.post(`${API_URL}/sales`, saleData);
      
      setSuccess('Sale recorded successfully!');
      setShowSaleForm(false);
      
      // Refresh all data
      await Promise.all([
        fetchProducts(),
        fetchAvailableDates(),
        fetchStockIn()
      ]);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
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
      setError('');
      setSuccess('');
      
      console.log('Deleting sale:', saleId);
      await axios.delete(`${API_URL}/sales/${saleId}`);
      
      // Remove the sale from local state immediately
      setAllSales(prev => prev.filter(s => s._id !== saleId));
      setSales(prev => prev.filter(s => s._id !== saleId));
      
      setSuccess('Sale deleted successfully!');
      
      // Refresh all data from server to ensure consistency
      await Promise.all([
        fetchProducts(),
        fetchAvailableDates(),
        fetchStockIn()
      ]);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
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
      setSuccess('');
      
      const saleData = {
        ...formData,
        date: saleDate,
        location: location!,
        total: formData.quantity * formData.price,
        receiver: formData.receiver
      };
      
      console.log('Updating sale:', saleData);
      await axios.put(`${API_URL}/sales/${selectedSale?._id}`, saleData);
      
      setSuccess('Sale updated successfully!');
      setShowEditSaleForm(false);
      
      // Refresh all data
      await Promise.all([
        fetchProducts(),
        fetchAvailableDates(),
        fetchStockIn()
      ]);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
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
    // Handle both string dates (YYYY-MM-DD) and ISO date strings
    const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalSalesForDate = (date: string) => {
    // Only include VALID sales with proper data
    const dateSales = allSales.filter(sale => 
      sale.date === date && 
      sale._id && 
      sale.quantity > 0 && 
      (sale.total > 0 || (sale.quantity * sale.price) > 0)
    );
    return dateSales.reduce((sum, sale) => sum + sale.total, 0);
  };

  const getSalesCountForDate = (date: string) => {
    // Only count sales with valid _id, quantity > 0, and total > 0
    return allSales.filter(sale => 
      sale.date === date && 
      sale._id && 
      sale.quantity > 0 && 
      (sale.total > 0 || (sale.quantity * sale.price) > 0)
    ).length;
  };

  const getDateDescription = (date: string) => {
    // Get the first sale's description for this date (if any)
    const dateSales = allSales.filter(sale => sale.date === date && sale.description);
    if (dateSales.length > 0) {
      // Return the most common description for this date
      const descriptions = dateSales.map(s => s.description).filter(Boolean);
      if (descriptions.length > 0) {
        // Find the most frequent description
        const descCounts: { [key: string]: number } = {};
        descriptions.forEach(desc => {
          if (desc) descCounts[desc] = (descCounts[desc] || 0) + 1;
        });
        const mostCommon = Object.entries(descCounts).sort((a, b) => b[1] - a[1])[0];
        return mostCommon ? mostCommon[0] : '';
      }
    }
    return '';
  };

  // Filter out dates with no VALID sales (must have sales with amount > 0) BEFORE pagination
  const validAvailableDates = availableDates.filter(date => {
    const count = getSalesCountForDate(date);
    const total = getTotalSalesForDate(date);
    // Only include dates with sales that have valid count and total > 0
    return count > 0 && total > 0;
  });

  // Pagination logic using validAvailableDates
  const totalPages = Math.ceil(validAvailableDates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDates = validAvailableDates.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExportDateSales = () => {
    setExportDateOnly(selectedDate);
    setShowExportModal(true);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
    setExportDateOnly(undefined);
  };

  // console.log(sales[0].description)
  if (!location) {
    return <div>Location not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
        
        {/* Floating Decorative Icons */}
        <Sparkles className="absolute top-1/4 right-1/3 h-6 w-6 text-yellow-400 opacity-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <Star className="absolute top-2/3 right-1/4 h-5 w-5 text-pink-400 opacity-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <Zap className="absolute bottom-1/4 left-1/3 h-6 w-6 text-purple-400 opacity-20 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
        <Package className="absolute top-1/3 left-1/4 h-5 w-5 text-blue-400 opacity-20 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.8s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header - Beautiful Enhanced */}
          <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-white/50 p-4 mb-4">
            <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                  className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all mr-3 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                  <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{getLocationDisplayName(location)} Sales</h1>
                  <p className="text-sm text-gray-600">Manage sales and track inventory</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/sales-history/${location}`, { state: { location } })}
                className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Calendar className="h-4 w-4 mr-1" />
                History
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all text-sm shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              <button
                onClick={() => setShowSaleForm(true)}
                className="flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all text-sm shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-1" />
                Sale
              </button>
              <button
                onClick={() => setShowBatchForm(true)}
                className="flex items-center px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all text-sm shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-1" />
                Batch Sales
              </button>
              <button
                onClick={() => setShowStockForm(true)}
                className="flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all text-sm shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-1" />
                Stock
              </button>
              <button
                onClick={() => setShowBatchStockForm(true)}
                className="flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all text-sm shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-1" />
                Batch Stock
              </button>
            </div>
            </div>
          </div>

          {/* Error and Success Messages - Enhanced */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 shadow-lg backdrop-blur-sm flex items-center space-x-2">
              <div className="p-1 bg-red-200 rounded-full">
                <X className="h-4 w-4 text-red-600" />
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 border-2 border-green-300 text-green-700 px-4 py-3 rounded-xl mb-4 shadow-lg backdrop-blur-sm flex items-center space-x-2">
              <div className="p-1 bg-green-200 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-medium">{success}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Available Dates List - Beautiful Enhanced */}
            <div className="lg:col-span-1">
              <div className="backdrop-blur-lg bg-white/80 rounded-2xl shadow-2xl border border-white/50 p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-2">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      Dates
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 ml-11">
                      Select date
                    </p>
                  </div>
                  {validAvailableDates.length > 0 && (
                    <div className="flex flex-col items-end space-y-1">
                      <button
                        onClick={handleSelectAllDates}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {selectedDates.length === validAvailableDates.length ? 'Unselect' : 'Select All'}
                      </button>
                      {selectedDates.length > 0 && (
                        <button
                          onClick={handleBulkDeleteDates}
                          disabled={isSubmitting}
                          className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                        >
                          Delete ({selectedDates.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {validAvailableDates.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-3">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">No sales recorded yet</p>
                    {availableDates.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">Found {availableDates.length} date(s) with no valid sales</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      {paginatedDates.map((date) => {
                      const isSelected = selectedDates.includes(date);
                      const isActive = selectedDate === date;
                      const salesCount = getSalesCountForDate(date);
                      const totalAmount = getTotalSalesForDate(date);
                      const dateDesc = getDateDescription(date);
                      
                      // Skip dates with no valid sales or 0 total
                      if (salesCount === 0 || totalAmount === 0) {
                        console.log(`Skipping date ${date} - count: ${salesCount}, total: ${totalAmount}`);
                        return null;
                      }
                      
                      return (
                        <div
                          key={date}
                          className="group relative"
                          onClick={() => handleDateSelect(date)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleDateToggle(date);
                          }}
                        >
                          <div className={`relative w-full p-3 rounded-xl border-2 transition-all cursor-pointer transform hover:scale-[1.02] ${
                            isActive
                              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg'
                              : isSelected
                              ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                          }`}>
                            {/* Glow Effect */}
                            {isActive && (
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 opacity-20 blur-sm -z-10"></div>
                            )}
                            
                          <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2 flex-1">
                                <div className={`p-1.5 rounded-lg ${
                                  isActive 
                                    ? 'bg-blue-200' 
                                    : isSelected 
                                    ? 'bg-green-200' 
                                    : 'bg-gray-100 group-hover:bg-blue-100'
                                }`}>
                                  <Calendar className={`h-3 w-3 ${
                                    isActive 
                                      ? 'text-blue-700' 
                                      : isSelected 
                                      ? 'text-green-700' 
                                      : 'text-gray-600'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <div className={`font-semibold text-xs ${
                                    isActive 
                                      ? 'text-blue-700' 
                                      : isSelected 
                                      ? 'text-green-700' 
                                      : 'text-gray-800'
                                  }`}>
                                    {formatDate(date)}
                                  </div>
                                  {dateDesc && (
                                    <div className="text-xs text-gray-500 italic mt-0.5 line-clamp-1">
                                      {dateDesc}
                                    </div>
                                  )}
                                </div>
                          </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDate(date);
                              }}
                              disabled={isSubmitting}
                                className="p-1 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all transform hover:scale-110 disabled:opacity-50"
                              title="Delete all sales for this date"
                            >
                                <X className="h-3 w-3" />
                            </button>
                            </div>
                            <div className="flex items-center space-x-2 mt-2 text-xs">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                                isActive ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {salesCount} {salesCount === 1 ? 'sale' : 'sales'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                                isActive ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Controls - Beautiful Enhanced */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-4 gap-1.5">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium rounded-lg hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                      >
                        Prev
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let page;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md transform hover:scale-105 ${
                                currentPage === page
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-300'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium rounded-lg hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                      >
                        Next
                      </button>
                  </div>
                  )}
                  </>
                )}
              </div>
            </div>

            {/* Sales and Stock for Selected Date - Beautiful Enhanced */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="backdrop-blur-lg bg-white/80 rounded-2xl shadow-2xl border border-white/50 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                          <ShoppingCart className="h-4 w-4 text-white" />
                        </div>
                        <h2 className="text-base font-bold text-gray-800">
                          Sales
                      </h2>
                    </div>
                      <p className="text-xs text-gray-500">{formatDate(selectedDate)}</p>
                      <div className="inline-flex items-center space-x-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {sales.length} sales
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {sales.reduce((sum, sale) => sum + sale.total, 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setShowSaleForm(true)}
                        className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:scale-110"
                        title="Add new sale"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowBatchEditSalesForm(true)}
                        className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg transform hover:scale-110"
                        title="Edit all sales for this date"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleExportDateSales}
                        className="p-2 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg transform hover:scale-110"
                        title="Export sales for this date"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {sales.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-3">
                        <ShoppingCart className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-1">No Sales Yet</p>
                      <p className="text-xs text-gray-500">Add a sale to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      {sales.map((sale, index) => (
                        <div 
                          key={sale._id} 
                          className="group relative bg-gradient-to-r from-white to-green-50/30 border-2 border-gray-200 rounded-xl p-3 hover:border-green-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          {/* Subtle Glow */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/0 to-emerald-400/0 group-hover:from-green-400/10 group-hover:to-emerald-400/10 transition-all duration-300"></div>
                          
                          <div className="relative z-10 flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="p-1 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                  <Package className="h-3 w-3 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800 text-sm group-hover:text-green-600 transition-colors">{sale.productName}</h3>
                              </div>
                              {sale.description && (
                                <p className="text-xs text-gray-600 ml-8 mb-1 italic">{sale.description}</p>
                              )}
                              {sale.receiver && (
                                <p className="text-xs text-blue-600 ml-8 mb-1 font-semibold">
                                  Receiver: {sale.receiver}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 ml-8 text-xs">
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 rounded-full">
                                  {sale.quantity} units
                                </span>
                                {sale.price > 0 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 rounded-full">
                                    {sale.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB
                                  </span>
                                )}
                                {sale.receiver && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    {sale.receiver}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-sm font-bold text-xs group-hover:shadow-md transition-shadow">
                                {sale.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(sale.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                              <div className="flex space-x-1 mt-1.5">
                                <button
                                  onClick={() => handleEditSale(sale)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-all"
                                  title="Edit"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSale(sale._id)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {receiverSummaryEntries.length > 0 && (
                    <div className="mt-4 border-t border-gray-200 pt-3">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Totals by Receiver
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {receiverSummaryEntries.map(([receiverName, total]) => (
                          <div
                            key={receiverName}
                            className="flex items-center justify-between px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-lg"
                          >
                            <span className="text-xs font-medium text-blue-700">{receiverName}</span>
                            <span className="text-xs font-semibold text-blue-900">
                              {total.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} ETB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <style dangerouslySetInnerHTML={{__html: `
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: #f1f1f1;
                      border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: linear-gradient(to bottom, #10b981, #059669);
                      border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: linear-gradient(to bottom, #059669, #047857);
                    }
                  `}} />
                </div>
                <div className="backdrop-blur-lg bg-white/80 rounded-2xl shadow-2xl border border-white/50 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <h2 className="text-base font-bold text-gray-800">
                          Stock In
                      </h2>
                    </div>
                      <p className="text-xs text-gray-500">{formatDate(selectedDate)}</p>
                      <div className="inline-flex items-center space-x-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {stockIn.length} entries
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setShowStockForm(true)}
                        className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:scale-110"
                        title="Add new stock"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowBatchEditStockForm(true)}
                        className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-110"
                        title="Edit all stock for this date"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {stockIn.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex p-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl mb-3">
                        <Package className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-1">No Stock In Yet</p>
                      <p className="text-xs text-gray-500">Add stock to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar-purple">
                      {stockIn.map((txn, index) => (
                        <div 
                          key={txn._id} 
                          className="group relative bg-gradient-to-r from-white to-purple-50/30 border-2 border-gray-200 rounded-xl p-3 hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          {/* Subtle Glow */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/0 to-indigo-400/0 group-hover:from-purple-400/10 group-hover:to-indigo-400/10 transition-all duration-300"></div>
                          
                          <div className="relative z-10 flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="p-1 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                  <Package className="h-3 w-3 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800 text-sm group-hover:text-purple-600 transition-colors">{txn.productName}</h3>
                              </div>
                              {txn.description && (
                                <p className="text-xs text-gray-600 ml-8 mb-1 italic">{txn.description}</p>
                              )}
                              <div className="flex items-center space-x-2 ml-8 text-xs">
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 rounded-full">
                                  {txn.quantity} units
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-xs text-gray-500 mb-1">
                                {new Date(txn.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleEditStock(txn)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-all"
                                  title="Edit"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStock(txn)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <style dangerouslySetInnerHTML={{__html: `
                    .custom-scrollbar-purple::-webkit-scrollbar {
                      width: 6px;
                    }
                    .custom-scrollbar-purple::-webkit-scrollbar-track {
                      background: #f1f1f1;
                      border-radius: 10px;
                    }
                    .custom-scrollbar-purple::-webkit-scrollbar-thumb {
                      background: linear-gradient(to bottom, #a855f7, #7c3aed);
                      border-radius: 10px;
                    }
                    .custom-scrollbar-purple::-webkit-scrollbar-thumb:hover {
                      background: linear-gradient(to bottom, #7c3aed, #6d28d9);
                    }
                  `}} />
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
                  onSuccess={async () => {
                    setShowBatchForm(false);
                    await Promise.all([
                      fetchProducts(),
                      fetchAvailableDates(),
                      fetchSales(),
                      fetchStockIn()
                    ]);
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
                  onSuccess={async () => {
                    setShowBatchStockForm(false);
                    await Promise.all([
                      fetchProducts(),
                      fetchAvailableDates(),
                      fetchSales(),
                      fetchStockIn()
                    ]);
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

          {/* Export Sales Modal */}
          <ExportSalesModal
            isOpen={showExportModal}
            onClose={handleCloseExportModal}
            location={location}
            locationDisplayName={getLocationDisplayName(location)}
            singleDate={exportDateOnly}
          />

          {/* Batch Edit Sales Modal */}
          {showBatchEditSalesForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <BatchEditSalesForm
                  sales={sales}
                  products={products}
                  defaultDate={selectedDate}
                  locationName={location}
                  onSuccess={async () => {
                    setShowBatchEditSalesForm(false);
                    await Promise.all([
                      fetchProducts(),
                      fetchAvailableDates(),
                      fetchSales(),
                      fetchStockIn()
                    ]);
                  }}
                  onCancel={() => setShowBatchEditSalesForm(false)}
                />
              </div>
            </div>
          )}

          {/* Batch Edit Stock Modal */}
          {showBatchEditStockForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <BatchEditStockForm
                  stockEntries={stockIn}
                  products={products}
                  defaultDate={selectedDate}
                  onSuccess={async () => {
                    setShowBatchEditStockForm(false);
                    await Promise.all([
                      fetchProducts(),
                      fetchAvailableDates(),
                      fetchSales(),
                      fetchStockIn()
                    ]);
                  }}
                  onCancel={() => setShowBatchEditStockForm(false)}
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
    description: '',
    receiver: ''
  });
  const [receiverSelection, setReceiverSelection] = useState<string>('');
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
    const receiverValue = formData.receiver.trim();
    const success = await onSubmit({
      productId: formData.productId,
      productName: formData.productName,
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      description: formData.description,
      receiver: receiverValue
    }, saleDate);
    if (success) {
      setFormData({
        productId: '',
        productName: '',
        quantity: '',
        price: '',
        description: '',
        receiver: ''
      });
      setSaleDate(new Date().toISOString().split('T')[0]);
      setReceiverSelection('');
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Receiver</label>
          {receiverSelection === 'Other' ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.receiver}
                onChange={(e) => setFormData(prev => ({ ...prev, receiver: e.target.value }))}
                placeholder="Enter receiver name"
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  setReceiverSelection('');
                  setFormData(prev => ({ ...prev, receiver: '' }));
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
            </div>
          ) : (
            <select
              value={receiverSelection || formData.receiver}
              onChange={(e) => {
                const value = e.target.value;
                setReceiverSelection(value);
                setFormData(prev => ({ ...prev, receiver: value === 'Other' ? '' : value }));
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select receiver</option>
              {RECEIVER_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
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
              Total: {(parseFloat(formData.quantity) * parseFloat(formData.price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
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
    receiver: sale.receiver || '',
  });
  const [saleDate, setSaleDate] = useState<string>(sale.date);
  const [receiverSelection, setReceiverSelection] = useState<string>(() => {
    if (!sale.receiver) return '';
    return RECEIVER_OPTIONS.includes(sale.receiver) ? sale.receiver : 'Other';
  });
  const selectedProduct = products.find(p => p._id === formData.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity || !formData.price) {
      return;
    }
    const receiverValue = formData.receiver.trim();
    const success = await onSubmit({
      productId: formData.productId,
      productName: formData.productName,
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      description: formData.description,
      receiver: receiverValue
    }, saleDate);
    if (success) {
      setFormData({
        productId: '',
        productName: '',
        quantity: '',
        price: '',
        description: '',
        receiver: ''
      });
      setSaleDate(new Date().toISOString().split('T')[0]);
      setReceiverSelection('');
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
      <label className="block text-sm font-medium text-gray-700 mb-1">Receiver</label>
      {receiverSelection === 'Other' ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.receiver}
            onChange={(e) => setFormData(prev => ({ ...prev, receiver: e.target.value }))}
            placeholder="Enter receiver name"
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => {
              setReceiverSelection('');
              setFormData(prev => ({ ...prev, receiver: '' }));
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Back
          </button>
        </div>
      ) : (
        <select
          value={receiverSelection || formData.receiver}
          onChange={(e) => {
            const value = e.target.value;
            setReceiverSelection(value);
            setFormData(prev => ({ ...prev, receiver: value === 'Other' ? '' : value }));
          }}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select receiver</option>
          {RECEIVER_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
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
              Total: {(parseFloat(formData.quantity) * parseFloat(formData.price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
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
  receiver: string;
  receiverSelection: string;
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
    setRows(prev => ([...prev, { id: Math.random().toString(36).slice(2), productId: '', productName: '', quantity: '', price: '', receiver: '', receiverSelection: '' }]));
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

  const handleReceiverSelectionChange = (id: string, value: string) => {
    if (value === 'Other') {
      updateRow(id, { receiverSelection: value, receiver: '' });
    } else {
      updateRow(id, { receiverSelection: value, receiver: value });
    }
  };

  const handleReceiverCustomChange = (id: string, value: string) => {
    updateRow(id, { receiver: value });
  };

  const handleReceiverReset = (id: string) => {
    updateRow(id, { receiverSelection: '', receiver: '' });
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
          price: parseFloat(r.price),
          receiver: r.receiver.trim() || undefined
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (ETB)</label>
                  <input type="number" value={row.price} onChange={(e) => updateRow(row.id, { price: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receiver</label>
                  {row.receiverSelection === 'Other' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={row.receiver}
                        onChange={(e) => handleReceiverCustomChange(row.id, e.target.value)}
                        placeholder="Enter receiver name"
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleReceiverReset(row.id)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  ) : (
                    <select
                      value={row.receiverSelection || row.receiver}
                      onChange={(e) => handleReceiverSelectionChange(row.id, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select receiver</option>
                      {RECEIVER_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="md:col-span-1">
                  <div className="text-sm text-gray-600 mb-1">Total</div>
                  <div className="font-medium">{row.quantity && row.price ? `${(parseFloat(row.quantity) * parseFloat(row.price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB` : '—'}</div>
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
