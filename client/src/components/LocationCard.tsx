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
    <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 group overflow-hidden">
      {/* Gradient Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{name}</h3>
          </div>
        </div>
        
        {/* Stats */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Products</span>
            </div>
            <span className="text-lg font-bold text-gray-800">{productCount}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Total Stock</span>
            </div>
            <span className="text-lg font-bold text-gray-800">{totalStock.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onClick}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <Package className="h-4 w-4" />
            <span>View Inventory</span>
          </button>
          <Link
            to={`/sales/${locationValue || name}`}
            className="block w-full py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all shadow-md hover:shadow-lg text-center"
          >
            <div className="flex items-center justify-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Manage Sales</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};