import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Scaling as Seedling, ArrowLeft, Plus, Package, ShoppingCart } from 'lucide-react';
import DailySalesPage from './components/DailySalesPage';
import SalesHistory from './components/SalesHistory';
import { LocationCard } from './components/LocationCard';
import { ProductCard } from './components/ProductCard';
import { ProductDetails } from './components/ProductDetails';
import { ProductForm } from './components/ProductForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useProducts } from './hooks/useProducts';

type Location = 'Adama' | 'Addis Ababa' | 'Chemicals';

const ManagementCard = ({ title, description, icon: Icon, to }: { title: string; description: string; icon: React.ElementType; to: string }) => (
  <Link to={to} className="block">
    <div className="h-full bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  </Link>
);

function HomePage() {
  const { products } = useProducts();
  
  const locationStats = {
    'Adama': {
      count: products.filter(p => p.location === 'Adama').length,
      totalStock: products
        .filter(p => p.location === 'Adama')
        .reduce((sum, p) => sum + (p.balance || 0), 0)
    },
    'Addis Ababa': {
      count: products.filter(p => p.location === 'Addis Ababa').length,
      totalStock: products
        .filter(p => p.location === 'Addis Ababa')
        .reduce((sum, p) => sum + (p.balance || 0), 0)
    },
    'Chemicals': {
      count: products.filter(p => p.location === 'Chemicals').length,
      totalStock: products
        .filter(p => p.location === 'Chemicals')
        .reduce((sum, p) => sum + (p.balance || 0), 0)
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Seedling className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Seed Management System</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Efficiently manage your seed inventory and sales across multiple locations. 
            Track stock levels, record sales, and maintain optimal inventory levels.
          </p>
        </div>

        {/* Management Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* <ManagementCard
            title="Stock Management"
            description="Manage your inventory, view stock levels, and update product information."
            icon={Package}
            to="/location/Adama"
          /> */}
          <ManagementCard
            title="Daily Sales"
            description="Record daily sales transactions and track your business performance."
            icon={ShoppingCart}
            to="/daily-sales"
          />
        </div>

        {/* Location Stats */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Inventory Overview</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <a href="/location/Adama">
              <LocationCard
                name="Adama"
                productCount={locationStats['Adama'].count}
                totalStock={locationStats['Adama'].totalStock}
                onClick={() => {}}
              />
            </a>
            <a href="/location/Addis Ababa">
              <LocationCard
                name="Addis Ababa"
                productCount={locationStats['Addis Ababa'].count}
                totalStock={locationStats['Addis Ababa'].totalStock}
                onClick={() => {}}
              />
            </a>
            <a href="/location/Chemicals">
              <LocationCard
                name="Chemicals"
                productCount={locationStats['Chemicals'].count}
                totalStock={locationStats['Chemicals'].totalStock}
                onClick={() => {}}
              />
            </a>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <p className="text-2xl font-bold text-gray-800">{products.length}</p>
            <p className="text-sm text-gray-600">Total Products</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <p className="text-2xl font-bold text-green-600">
              {products.reduce((sum, p) => sum + (p.balance || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Stock</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <p className="text-2xl font-bold text-blue-600">
              {products.reduce((sum, p) => sum + (p.totalOut || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Out</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <p className="text-2xl font-bold text-purple-600">
              {products.filter(p => (p.balance || 0) === 0).length}
            </p>
            <p className="text-sm text-gray-600">Out of Stock</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationPage({ location }: { location: Location }) {
  const { products, loading, error, addProduct, updateProduct, deleteProduct, recordSale } = useProducts(location);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const selectedProductData = selectedProduct ? products.find(p => p._id === selectedProduct) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="lg" message={`Loading ${location} inventory...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-center">
            <div className="text-red-600 mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <a 
              href="/"
              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </a>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{location} Inventory</h1>
              <p className="text-gray-600">{products.length} products in stock</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <Seedling className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Products Yet</h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first product to this location.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add First Product
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onClick={() => setSelectedProduct(product._id)}
              />
            ))}
          </div>
        )}

        {/* Product Details Modal */}
        {selectedProductData && (
          <ProductDetails
            product={selectedProductData}
            onClose={() => setSelectedProduct(null)}
            onUpdate={updateProduct}
            onDelete={deleteProduct}
            onSale={recordSale}
          />
        )}

        {/* Add Product Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <ProductForm
                location={location}
                onSubmit={addProduct}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/location/Adama" element={<LocationPage location="Adama" />} />
        <Route path="/location/Addis Ababa" element={<LocationPage location="Addis Ababa" />} />
        <Route path="/location/Chemicals" element={<LocationPage location="Chemicals" />} />
        <Route path="/daily-sales" element={<DailySalesPage />} />
        <Route path="/sales-history" element={<SalesHistory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;