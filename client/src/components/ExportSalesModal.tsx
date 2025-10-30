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

interface Transaction {
  _id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  description?: string;
}

interface ExportSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  locationDisplayName: string;
  singleDate?: string; // Optional: if provided, export only this date
}

const API_URL = 'https://tame.ok1bingo.com/api';

const ExportSalesModal: React.FC<ExportSalesModalProps> = ({
  isOpen,
  onClose,
  location,
  locationDisplayName,
  singleDate
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

  const fetchStockInForDate = async (date: string): Promise<Record<string, number>> => {
    try {
      const response = await axios.get(`${API_URL}/products/transactions`, {
        params: {
          location: location,
          date: date,
          type: 'in'
        }
      });
      const transactions: Transaction[] = response.data.data || [];
      // Sum up stock-in by productName
      const stockByProduct: Record<string, number> = {};
      transactions.forEach(txn => {
        if (!stockByProduct[txn.productName]) {
          stockByProduct[txn.productName] = 0;
        }
        stockByProduct[txn.productName] += txn.quantity;
      });
      return stockByProduct;
    } catch (err) {
      console.error('Error fetching stock-in for date:', err);
      return {};
    }
  };

  const exportToExcel = async () => {
    // If singleDate is provided, export only that date
    if (singleDate) {
      await exportSingleDate(singleDate);
      return;
    }

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

      // Group sales by date and product
      const groupedData: Record<string, Record<string, { quantity: number; total: number; avgPrice: number }>> = {};
      
      sales.forEach(sale => {
        if (!groupedData[sale.date]) {
          groupedData[sale.date] = {};
        }
        if (!groupedData[sale.date][sale.productName]) {
          groupedData[sale.date][sale.productName] = { quantity: 0, total: 0, avgPrice: 0 };
        }
        groupedData[sale.date][sale.productName].quantity += sale.quantity;
        groupedData[sale.date][sale.productName].total += sale.total;
      });

      // Calculate average prices
      Object.keys(groupedData).forEach(date => {
        Object.keys(groupedData[date]).forEach(product => {
          const data = groupedData[date][product];
          data.avgPrice = data.quantity > 0 ? data.total / data.quantity : 0;
        });
      });

      // Sort dates
      const sortedDates = Object.keys(groupedData).sort((a, b) => a.localeCompare(b));

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create a sheet for each date
      for (const date of sortedDates) {
        const stockInData = await fetchStockInForDate(date);
        const products = Object.keys(groupedData[date]).sort();
        
        // Compute totals for this date
        const totals = products.reduce(
          (acc, productName) => {
            const data = groupedData[date][productName];
            acc.quantity += data.quantity;
            acc.total += data.total;
            return acc;
          },
          { quantity: 0, total: 0 }
        );

        // Determine description for this date from sales data
        const descriptionsForDate = Array.from(
          new Set(
            sales
              .filter(s => s.date === date && s.description && s.description.trim().length > 0)
              .map(s => s.description!.trim())
          )
        );
        const dateDescription = descriptionsForDate.length > 0
          ? (descriptionsForDate.length === 1
              ? descriptionsForDate[0]
              : descriptionsForDate.slice(0, 3).join('; ') + (descriptionsForDate.length > 3 ? '…' : ''))
          : '';

        // Header rows
        const exportDateTime = new Date();
        const sheetData: any[][] = [
          ['Export Date', formatDate(date) + ' (' + date + ')', '', dateDescription],
          ['Export Time', exportDateTime.toLocaleTimeString('en-US')],
          ['Location', locationDisplayName],
          [],
          ['Items', 'Quantity', 'Price', 'Total', 'Stock In']
        ];

        // Add product rows
        products.forEach(productName => {
          const data = groupedData[date][productName];
          const stockIn = stockInData[productName] || '';
          sheetData.push([
            productName,
            data.quantity,
            data.avgPrice.toFixed(2),
            data.total.toFixed(2),
            stockIn
          ]);
        });

        // Totals row
        sheetData.push([]);
        sheetData.push(['TOTAL', totals.quantity, '', totals.total.toFixed(2), '']);

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        
        // Set column widths
        worksheet['!cols'] = [
          { wch: 30 },  // Items
          { wch: 12 },  // Quantity
          { wch: 12 },  // Price
          { wch: 12 },  // Total
          { wch: 12 }   // Stock In
        ];

        // Sanitize sheet name (Excel has 31 char limit and doesn't allow certain chars)
        const sheetName = formatDate(date).substring(0, 31).replace(/[:\\/?*\[\]]/g, '-');
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      // Calculate summary data
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);

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
        ['Total Revenue (ETB)', totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
        ['Total Quantity Sold', totalQuantity],
        ['Average Sale Value (ETB)', totalSales > 0 ? (totalRevenue / totalSales).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'],
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
        ).map(([product, revenue]) => [product, `${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`])
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];

      // Add summary as first sheet
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

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

  const exportSingleDate = async (date: string) => {
    try {
      setIsExporting(true);
      setError('');

      // Fetch sales for this specific date
      const response = await axios.get(`${API_URL}/sales`, {
        params: {
          location: location,
          date: date,
          limit: 10000
        }
      });
      const sales: Sale[] = response.data.docs || response.data.data || [];

      if (sales.length === 0) {
        setError('No sales found for this date');
        return;
      }

      // Fetch stock-in data for this date
      const stockInData = await fetchStockInForDate(date);

      // Group sales by product
      const groupedData: Record<string, { quantity: number; total: number; avgPrice: number }> = {};
      
      sales.forEach(sale => {
        if (!groupedData[sale.productName]) {
          groupedData[sale.productName] = { quantity: 0, total: 0, avgPrice: 0 };
        }
        groupedData[sale.productName].quantity += sale.quantity;
        groupedData[sale.productName].total += sale.total;
      });

      // Calculate average prices
      Object.keys(groupedData).forEach(product => {
        const data = groupedData[product];
        data.avgPrice = data.quantity > 0 ? data.total / data.quantity : 0;
      });

      const products = Object.keys(groupedData).sort();
      
      // Header rows
      const exportDateTime = new Date();
      // Determine description for this date from sales data
      const descriptionsForDate = Array.from(
        new Set(
          sales
            .filter(s => s.description && s.description.trim().length > 0)
            .map(s => s.description!.trim())
        )
      );
      const dateDescription = descriptionsForDate.length > 0
        ? (descriptionsForDate.length === 1
            ? descriptionsForDate[0]
            : descriptionsForDate.slice(0, 3).join('; ') + (descriptionsForDate.length > 3 ? '…' : ''))
        : '';

      const sheetData: any[][] = [
        ['Export Date', formatDate(date) + ' (' + date + ')', '', dateDescription],
        ['Export Time', exportDateTime.toLocaleTimeString('en-US')],
        ['Location', locationDisplayName],
        [],
        ['Items', 'Quantity', 'Price', 'Total', 'Stock In']
      ];

      // Add product rows
      products.forEach(productName => {
        const data = groupedData[productName];
        const stockIn = stockInData[productName] || '';
        sheetData.push([
          productName,
          data.quantity,
          data.avgPrice.toFixed(2),
          data.total.toFixed(2),
          stockIn
        ]);
      });

      // Totals row
      const totalsSingle = products.reduce(
        (acc, productName) => {
          const data = groupedData[productName];
          acc.quantity += data.quantity;
          acc.total += data.total;
          return acc;
        },
        { quantity: 0, total: 0 }
      );
      sheetData.push([]);
      sheetData.push(['TOTAL', totalsSingle.quantity, '', totalsSingle.total.toFixed(2), '']);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 30 },  // Items
        { wch: 12 },  // Quantity
        { wch: 12 },  // Price
        { wch: 12 },  // Total
        { wch: 12 }   // Stock In
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, formatDate(date).substring(0, 31));

      // Generate filename
      const dateFormatted = date.replace(/-/g, '');
      const filename = `Sales_${locationDisplayName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      console.log(`Successfully exported sales for ${date} to Excel file: ${filename}`);

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
              {singleDate ? (
                <>
                  Export sales data for <span className="font-medium">{locationDisplayName}</span> on <span className="font-medium">{formatDate(singleDate)}</span> to Excel format.
                </>
              ) : (
                <>
                  Export sales data for <span className="font-medium">{locationDisplayName}</span> to Excel format.
                </>
              )}
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!singleDate && (
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
          )}
          

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
              disabled={isExporting || (!singleDate && (!startDate || !endDate))}
              className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center ${
                isExporting || (!singleDate && (!startDate || !endDate))
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
