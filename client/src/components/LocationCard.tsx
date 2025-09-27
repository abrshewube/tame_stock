import React from 'react';
import { MapPin, Package, TrendingUp, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LocationCardProps {
  name: string;
  productCount: number;
  totalStock: number;
  onClick: () => void;
  locationValue?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  name,
  productCount,
  totalStock,
  onClick,
  locationValue
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">{name}</h3>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Products</span>
          </div>
          <span className="font-semibold text-gray-800">{productCount}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Total Stock</span>
          </div>
          <span className="font-semibold text-gray-800">{totalStock.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
        <button
          onClick={onClick}
          className="w-full text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors"
        >
          View Inventory →
        </button>
        <Link
          to={`/sales/${locationValue || name}`}
          className="block w-full text-sm text-green-600 font-medium hover:text-green-800 transition-colors"
        >
          Manage Sales →
        </Link>
      </div>
    </div>
  );
};