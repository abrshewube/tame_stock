import React, { useState } from 'react';
import { Download, Calendar, X } from 'lucide-react';
import * as XLSX from 'xlsx';
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

interface ExportSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  locationDisplayName: string;
}

const API_URL = 'https://tame-stock.onrender.com/api';

const ExportSalesModal: React.FC<ExportSalesModalProps> = ({
  isOpen,
  onClose,
  location,
  locationDisplayName
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (dateString: string) => {
    const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const fetchSalesForDateRange = async (start: string, end: string): Promise<Sale[]> => {
    try {
      // Use the existing sales endpoint with date range filtering
      const response = await axios.get(`${API_URL}/sales`, {
        params: {
          location: location,
          startDate: start,
          endDate: end,
          limit: 10000 // Large limit to get all sales in the range
        }
      });
      return response.data.docs || response.data.data || [];
    } catch (err) {
      console.error('Error fetching sales for date range:', err);
      throw new Error('Failed to fetch sales data');
    }
  };

  const exportToExcel = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    try {
      setIsExporting(true);
      setError('');

      const sales = await fetchSalesForDateRange(startDate, endDate);

      if (sales.length === 0) {
        setError('No sales found for the selected date range');
        return;
      }

      console.log(`Exporting ${sales.length} individual sales for date range ${startDate} to ${endDate}`);

      // Prepare data for Excel - each sale as a separate row
      const excelData = sales.map((sale, index) => ({
        'S.No': index + 1,
        'Sale ID': sale._id,
        'Date': formatDate(sale.date),
        'Product Name': sale.productName,
        'Product ID': sale.productId,
        'Location': locationDisplayName,
        'Quantity': sale.quantity,
        'Unit Price (ETB)': sale.price,
        'Total Amount (ETB)': sale.total,
        'Description': sale.description || '',
        'Sale Time': new Date(sale.createdAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        'Created At': new Date(sale.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }));

      // Calculate summary data
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Main sales data sheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for the enhanced data
      const columnWidths = [
        { wch: 8 },   // S.No
        { wch: 25 },  // Sale ID
        { wch: 12 },  // Date
        { wch: 25 },  // Product Name
        { wch: 25 },  // Product ID
        { wch: 15 },  // Location
        { wch: 10 },  // Quantity
        { wch: 15 },  // Unit Price
        { wch: 18 },  // Total Amount
        { wch: 30 },  // Description
        { wch: 12 },  // Sale Time
        { wch: 20 }   // Created At
      ];
      worksheet['!cols'] = columnWidths;

      // Add summary sheet with detailed statistics
      const summaryData = [
        ['Sales Export Summary', ''],
        ['Location', locationDisplayName],
        ['Date Range', `${formatDate(startDate)} - ${formatDate(endDate)}`],
        ['Export Date', new Date().toLocaleDateString('en-US')],
        ['Export Time', new Date().toLocaleTimeString('en-US')],
        ['', ''],
        ['=== SALES STATISTICS ===', ''],
        ['Total Sales Count', totalSales],
        ['Total Revenue (ETB)', totalRevenue.toFixed(2)],
        ['Total Quantity Sold', totalQuantity],
        ['Average Sale Value (ETB)', totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : '0.00'],
        ['Average Quantity per Sale', totalSales > 0 ? (totalQuantity / totalSales).toFixed(2) : '0.00'],
        ['', ''],
        ['=== PRODUCT BREAKDOWN ===', ''],
        ...Object.entries(
          sales.reduce((acc, sale) => {
            acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
            return acc;
          }, {} as Record<string, number>)
        ).map(([product, quantity]) => [product, quantity]),
        ['', ''],
        ['=== REVENUE BY PRODUCT ===', ''],
        ...Object.entries(
          sales.reduce((acc, sale) => {
            acc[sale.productName] = (acc[sale.productName] || 0) + sale.total;
            return acc;
          }, {} as Record<string, number>)
        ).map(([product, revenue]) => [product, `ETB ${revenue.toFixed(2)}`])
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];

      // Add sheets to workbook
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

      // Generate filename
      const startDateFormatted = startDate.replace(/-/g, '');
      const endDateFormatted = endDate.replace(/-/g, '');
      const filename = `Sales_Export_${locationDisplayName.replace(/\s+/g, '_')}_${startDateFormatted}_to_${endDateFormatted}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      console.log(`Successfully exported ${sales.length} sales to Excel file: ${filename}`);

      // Close modal after successful export
      onClose();
      
    } catch (err: any) {
      console.error('Error exporting to Excel:', err);
      setError(err.message || 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setStartDate('');
    setEndDate('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Download className="h-5 w-5 mr-2 text-green-600" />
              Export Sales to Excel
            </h3>
            <button 
              onClick={handleClose} 
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Export sales data for <span className="font-medium">{locationDisplayName}</span> to Excel format.
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={exportToExcel}
              disabled={isExporting || !startDate || !endDate}
              className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center ${
                isExporting || !startDate || !endDate
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSalesModal;
