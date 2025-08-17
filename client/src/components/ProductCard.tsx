import React from 'react';
import { Package, Calendar, MapPin, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Product } from '../services/api';
import { getStockStatus, formatDate, formatCurrency } from '../utils/stockUtils';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const balance = product.balance || 0;
  const totalIn = product.totalIn || 0;
  const stockStatus = getStockStatus(balance, totalIn);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md border-l-4 ${stockStatus.borderColor} p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {product.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <MapPin className="h-3 w-3 text-gray-400" />
            <p className="text-xs text-gray-500">{product.location}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.textColor}`}>
          {balance} left
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Initial Balance</span>
          </div>
          <span className="font-medium">{product.initialBalance.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-gray-600">Total In</span>
          </div>
          <span className="font-medium text-green-600">{totalIn.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-gray-600">Total Out</span>
          </div>
          <span className="font-medium text-red-600">{(product.totalOut || 0).toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Date Added</span>
          </div>
          <span className="font-medium">{formatDate(product.dateAdded)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Price</span>
          </div>
          <span className="font-medium">{formatCurrency(product.price)}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${stockStatus.color} transition-all duration-300`}
            style={{ width: `${totalIn > 0 ? (balance / totalIn) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Current: {balance.toLocaleString()}</span>
          <span>{totalIn > 0 ? Math.round((balance / totalIn) * 100) : 0}% remaining</span>
        </div>
      </div>
    </div>
  );
};