import React from 'react';
import { MapPin, Package, TrendingUp } from 'lucide-react';

interface LocationCardProps {
  name: string;
  productCount: number;
  totalStock: number;
  onClick: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  name,
  productCount,
  totalStock,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 group"
    >
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
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <span className="text-sm text-blue-600 font-medium">View Inventory →</span>
      </div>
    </div>
  );
};