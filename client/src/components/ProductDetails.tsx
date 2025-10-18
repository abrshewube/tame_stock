import React, { useState, useEffect } from 'react';
import { Product, Transaction, productService } from '../services/api';
import { getStockStatus, formatDate, formatCurrency, calculateDynamicStock } from '../utils/stockUtils';
import { 
  Calendar, 
  Package, 
  Edit, 
  Trash2, 
  X, 
  Plus,
  RotateCcw,
  DollarSign,
  Download
} from 'lucide-react';
import { ProductForm } from './ProductForm';
import { TransactionForm } from './TransactionForm';
import { TransactionTable } from './TransactionTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProductDetailsProps {
  product: Product;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onSale?: (productId: string, quantity: number, description?: string) => Promise<boolean>;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const balance = product.balance || 0;
  const stockStatus = getStockStatus(balance, (product.totalIn || 0));
  
  // Calculate dynamic stock for selected date
  const dynamicBalance = calculateDynamicStock(
    product.initialBalance || 0,
    transactions,
    [], // We'll need to fetch sales data for this
    selectedDate
  );
  const dynamicStockStatus = getStockStatus(dynamicBalance, (product.totalIn || 0));

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, searchTerm]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const result = await productService.getTransactions(product._id, {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined
      });
      setTransactions(result.transactions);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData: any) => {
    const success = await onUpdate(product._id, formData);
    if (success) {
      setIsEditing(false);
    }
    return success;
  };

  const handleDelete = async () => {
    const success = await onDelete(product._id);
    if (success) {
      onClose();
    }
  };

  const handleAddTransaction = async (transactionData: any) => {
    try {
      await productService.addTransaction(product._id, transactionData);
      setShowTransactionForm(false);
      fetchTransactions();
      // Refresh parent component to update product balance
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await productService.deleteTransaction(product._id, transactionId);
      fetchTransactions();
      // Refresh parent component to update product balance
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  };

  const handleClearHistory = async () => {
    try {
      await productService.clearHistory(product._id);
      setShowClearHistoryConfirm(false);
      // Refresh parent component to update product balance
      window.location.reload();
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const doc = new jsPDF();
    
    // Compact header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Inventory Report', 105, 15, { align: 'center' });
    
    // Product info in one line
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Product: ${product.name} | Location: ${product.location} | Price: ${formatCurrency(product.price)} | Date: ${new Date().toLocaleDateString()}`, 14, 22);
    
    // Table headers - English only
    const headers = [
      'Date',
      'Document No.', 
      'In',
      'Out',
      'Balance',
      'Signature'
    ];
    
    // Sort transactions by date (oldest first) to calculate running balance
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate running balance for each transaction
    let runningBalance = product.initialBalance || 0;
    const tableData = sortedTransactions.map((transaction) => {
      // Calculate balance after this transaction
      if (transaction.type === 'in') {
        runningBalance += transaction.quantity;
      } else {
        runningBalance -= transaction.quantity;
      }
      
      return [
        formatDate(transaction.date),
        transaction._id.substring(0, 8).toUpperCase(),
        transaction.type === 'in' ? transaction.quantity.toString() : '-',
        transaction.type === 'out' ? transaction.quantity.toString() : '-',
        runningBalance.toString(),
        ''
      ];
    });
    
    // Main table - larger and more prominent
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 28,
      styles: {
        fontSize: 10,
        cellPadding: 5,
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [31, 81, 255],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 11
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' }
      },
      margin: { top: 28, right: 14, bottom: 25, left: 14 }
    });
    
    // Small summary at the end
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Summary: Total ${transactions.length} transactions | In: ${transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0)} | Out: ${transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0)} | Balance: ${balance} units`, 14, finalY + 8);
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    const fileName = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <ProductForm
            product={product}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isEditing
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${stockStatus.bgColor}`}>
              <Package className={`h-5 w-5 ${stockStatus.textColor}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{product.name}</h2>
              <p className="text-sm text-gray-600">{product.location}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Product Summary */}
        <div className="p-6 border-b border-gray-200">
          {/* Date Selector for Dynamic Stock */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Stock as of Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {/* <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-1">
                <Package className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Total In</span>
              </div>
              <span className="text-lg font-bold text-green-700">{(product.totalIn || 0).toLocaleString()}</span>
            </div> */}
             <div className={`p-4 rounded-lg border ${dynamicStockStatus.borderColor} ${dynamicStockStatus.bgColor}`}>
              <div className="flex items-center space-x-2 mb-1">
                <Calendar className={`h-4 w-4 ${dynamicStockStatus.textColor}`} />
                <span className={`text-xs font-medium ${dynamicStockStatus.textColor}`}>Stock as of {formatDate(selectedDate)}</span>
              </div>
              <span className={`text-lg font-bold ${dynamicStockStatus.textColor}`}>{dynamicBalance.toLocaleString()}</span>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2 mb-1">
                <Package className="h-4 w-4 text-red-600" />
                <span className="text-xs text-red-600 font-medium">Total Out</span>
              </div>
              <span className="text-lg font-bold text-red-700">{(product.totalOut || 0).toLocaleString()}</span>
            </div>

            {/* <div className={`p-4 rounded-lg border ${stockStatus.borderColor} ${stockStatus.bgColor}`}>
              <div className="flex items-center space-x-2 mb-1">
                <Package className={`h-4 w-4 ${stockStatus.textColor}`} />
                <span className={`text-xs font-medium ${stockStatus.textColor}`}>Current Balance</span>
              </div>
              <span className={`text-lg font-bold ${stockStatus.textColor}`}>{balance.toLocaleString()}</span>
            </div> */}

           

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-xs text-gray-600 font-medium">Date Added</span>
              </div>
              <span className="text-lg font-bold text-gray-700">{formatDate(product.dateAdded)}</span>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-1">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">Price</span>
              </div>
              <span className="text-lg font-bold text-blue-700">{formatCurrency(product.price)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setShowTransactionForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Transaction</span>
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={() => setShowClearHistoryConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Clear History</span>
              </button>
              
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="p-6">
          <TransactionTable
            transactions={transactions}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onDelete={handleDeleteTransaction}
            loading={loading}
          />
        </div>

        {/* Transaction Form Modal */}
        {showTransactionForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
            <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <TransactionForm
                onSubmit={handleAddTransaction}
                onCancel={() => setShowTransactionForm(false)}
                currentBalance={balance}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
            <div className="bg-white p-6 rounded-lg max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "{product.name}" and all its transactions? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear History Confirmation */}
        {showClearHistoryConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
            <div className="bg-white p-6 rounded-lg max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Clear Transaction History</h3>
              <p className="text-gray-600 mb-4">
                This will delete all transaction history for "{product.name}" and reset the balance to the initial balance of {product.initialBalance}. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearHistoryConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearHistory}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Clear History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};