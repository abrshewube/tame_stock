export const calculateBalance = (totalIn: number, totalOut: number): number => {
  return Math.max(0, totalIn - totalOut);
};

export const getStockStatus = (balance: number, totalIn: number) => {
  if (totalIn === 0) {
    return {
      status: 'empty',
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200',
      bgColor: 'bg-gray-50',
      label: 'No Stock'
    };
  }

  const percentage = (balance / totalIn) * 100;
  
  if (balance === 0) {
    return {
      status: 'empty',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50',
      label: 'Out of Stock'
    };
  } else if (percentage <= 20) {
    return {
      status: 'low',
      color: 'bg-red-400',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50',
      label: 'Low Stock'
    };
  } else if (percentage <= 50) {
    return {
      status: 'medium',
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50',
      label: 'Medium Stock'
    };
  } else {
    return {
      status: 'good',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      bgColor: 'bg-green-50',
      label: 'Good Stock'
    };
  }
};

export const formatDate = (dateString: string): string => {
  // Handle both string dates (YYYY-MM-DD) and ISO date strings
  const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB'
  }).format(amount);
};

export const getStockColor = (balance: number, totalIn: number): string => {
  if (totalIn === 0) return 'text-gray-600';
  
  const percentage = (balance / totalIn) * 100;
  
  if (balance === 0) return 'text-red-600';
  if (percentage <= 20) return 'text-red-500';
  if (percentage <= 50) return 'text-amber-500';
  return 'text-green-600';
};

export const calculateDynamicStock = (
  initialBalance: number,
  transactions: any[],
  sales: any[],
  targetDate?: string
): number => {
  let balance = initialBalance;
  
  // Filter transactions and sales by date if targetDate is provided
  const relevantTransactions = targetDate 
    ? transactions.filter(t => t.date <= targetDate)
    : transactions;
  
  const relevantSales = targetDate
    ? sales.filter(s => s.date <= targetDate)
    : sales;
  
  // Apply transactions (in/out)
  relevantTransactions.forEach(transaction => {
    if (transaction.type === 'in') {
      balance += transaction.quantity;
    } else if (transaction.type === 'out') {
      balance -= transaction.quantity;
    }
  });
  
  // Apply sales (reduce stock)
  relevantSales.forEach(sale => {
    balance -= sale.quantity;
  });
  
  return Math.max(0, balance);
};

export const getStockStatusForDate = (
  initialBalance: number,
  transactions: any[],
  sales: any[],
  targetDate: string
) => {
  const balance = calculateDynamicStock(initialBalance, transactions, sales, targetDate);
  return getStockStatus(balance, initialBalance);
};