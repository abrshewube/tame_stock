
import type React from "react"
import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom"
import { SproutIcon as Seedling, ArrowLeft, Plus, Package, ShoppingCart, BarChart3, TrendingUp } from "lucide-react"
import DailySalesPage from "./components/DailySalesPage"
import SalesHistory from "./components/SalesHistory"
import SalesHistoryPage from "./components/SalesHistoryPage"
import LocationSalesPage from "./components/LocationSalesPage"
import { LocationCard } from "./components/LocationCard"
import { ProductCard } from "./components/ProductCard"
import { ProductDetails } from "./components/ProductDetails"
import { ProductForm } from "./components/ProductForm"
import { LoadingSpinner } from "./components/LoadingSpinner"
import { useProducts } from "./hooks/useProducts"

type Location = "Adama" | "AddisAbaba" | "Chemicals"

// Helper function to get display name for locations
const getLocationDisplayName = (location: Location): string => {
  const displayNames: Record<Location, string> = {
    Adama: "Adama",
    AddisAbaba: "Pysaa Seeds",
    Chemicals: "Pysaa Chemicals"
  };
  return displayNames[location];
};

const ManagementCard = ({
  title,
  description,
  icon: Icon,
  to,
}: { title: string; description: string; icon: React.ElementType; to: string }) => (
  <Link to={to} className="block group">
    <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-1">
      <div className="p-8">
        <div className="flex items-center mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl mr-5 group-hover:from-blue-100 group-hover:to-indigo-200 transition-colors">
            <Icon className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h3>
        </div>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  </Link>
)

const StatCard = ({
  value,
  label,
  color = "gray",
  icon: Icon,
}: { value: string | number; label: string; color?: string; icon?: React.ElementType }) => {
  const colorClasses = {
    gray: "text-gray-800 bg-gray-50",
    green: "text-green-600 bg-green-50",
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
    red: "text-red-600 bg-red-50",
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className={`text-3xl font-bold ${colorClasses[color as keyof typeof colorClasses].split(" ")[0]}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {Icon && (
          <div className={`p-2 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
    </div>
  )
}

const SalesLocationCard = ({ location, color }: { location: Location; color: string }) => {
  const colorClasses = {
    green: {
      bg: "from-green-500 to-emerald-600",
      hover: "from-green-600 to-emerald-700",
      icon: "bg-green-100",
      iconText: "text-green-600"
    },
    blue: {
      bg: "from-blue-500 to-cyan-600",
      hover: "from-blue-600 to-cyan-700",
      icon: "bg-blue-100",
      iconText: "text-blue-600"
    },
    purple: {
      bg: "from-purple-500 to-indigo-600",
      hover: "from-purple-600 to-indigo-700",
      icon: "bg-purple-100",
      iconText: "text-purple-600"
    },
  }

  const colors = colorClasses[color as keyof typeof colorClasses]

  return (
    <Link to={`/sales/${location}`} state={{ location }} className="block group">
      <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2">
        {/* Gradient Header */}
        <div className={`bg-gradient-to-r ${colors.bg} p-8 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl mb-4 group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {getLocationDisplayName(location)}
            </h3>
            <div className="h-1 w-16 bg-white rounded-full opacity-50"></div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-4 leading-relaxed">
            Manage sales and track performance
          </p>
          <div className={`inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${colors.bg} text-white rounded-lg font-medium group-hover:${colors.hover} transition-all shadow-md`}>
            <BarChart3 className="h-4 w-4" />
            <span>View Sales</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function HomePage() {
  const { products } = useProducts()

  const locationStats = {
    Adama: {
      count: products.filter((p) => p.location === "Adama").length,
      totalStock: products.filter((p) => p.location === "Adama").reduce((sum, p) => sum + (p.balance || 0), 0),
    },
    "AddisAbaba": {
      count: products.filter((p) => p.location === "AddisAbaba").length,
      totalStock: products.filter((p) => p.location === "AddisAbaba").reduce((sum, p) => sum + (p.balance || 0), 0),
    },
    Chemicals: {
      count: products.filter((p) => p.location === "Chemicals").length,
      totalStock: products.filter((p) => p.location === "Chemicals").reduce((sum, p) => sum + (p.balance || 0), 0),
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform">
              <Package className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Tame Stock Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your inventory and sales operations across multiple locations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto mb-12">
          <StatCard value={products.length} label="Total Products" color="gray" icon={Package} />
          <StatCard
            value={products.reduce((sum, p) => sum + (p.balance || 0), 0)}
            label="Total Stock"
            color="green"
            icon={TrendingUp}
          />
          <StatCard
            value={products.reduce((sum, p) => sum + (p.totalOut || 0), 0)}
            label="Total Sold"
            color="blue"
            icon={ShoppingCart}
          />
          <StatCard
            value={products.filter((p) => (p.balance || 0) === 0).length}
            label="Out of Stock"
            color="red"
            icon={Package}
          />
        </div>

        {/* Inventory Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-white px-6 py-2 rounded-full shadow-md mb-4">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Inventory</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Manage Your Locations</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Monitor stock levels and manage products across all locations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <a href="/location/Adama" className="block group transform hover:scale-105 transition-all">
              <LocationCard
                name="Adama"
                productCount={locationStats["Adama"].count}
                totalStock={locationStats["Adama"].totalStock}
                onClick={() => {}}
              />
            </a>
            <a href="/location/AddisAbaba" className="block group transform hover:scale-105 transition-all">
              <LocationCard
                name={getLocationDisplayName("AddisAbaba")}
                productCount={locationStats["AddisAbaba"].count}
                totalStock={locationStats["AddisAbaba"].totalStock}
                onClick={() => {}}
                locationValue="AddisAbaba"
              />
            </a>
            <a href="/location/Chemicals" className="block group transform hover:scale-105 transition-all">
              <LocationCard
                name={getLocationDisplayName("Chemicals")}
                productCount={locationStats["Chemicals"].count}
                totalStock={locationStats["Chemicals"].totalStock}
                onClick={() => {}}
                locationValue="Chemicals"
              />
            </a>
          </div>
        </div>

        {/* Sales Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-white px-6 py-2 rounded-full shadow-md mb-4">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Sales</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Track Sales Performance</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Manage and analyze sales data across all your locations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <SalesLocationCard location="Adama" color="green" />
            <SalesLocationCard location="AddisAbaba" color="blue" />
            <SalesLocationCard location="Chemicals" color="purple" />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200 mt-12">
          <p className="text-gray-500 text-sm">
            © 2025 Tame Stock Management. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
function LocationPage({ location }: { location: Location }) {
  const { products, loading, error, addProduct, updateProduct, deleteProduct, recordSale } = useProducts(location);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedProductData = selectedProduct ? products.find((p) => p._id === selectedProduct) : null;
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="lg" message={`Loading ${getLocationDisplayName(location)} inventory...`} />
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Link to="/" className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{getLocationDisplayName(location)} Inventory</h1>
              <p className="text-gray-600">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} in stock
              </p>
            </div>
          </div>

          {/* Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
            >
              <Plus className="h-5 w-5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Products Grid or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <Seedling className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {searchTerm ? "No matching products found" : "No Products Yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try a different search term." : "Start by adding your first product to this location."}
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Product
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <ProductDetails
                product={selectedProductData}
                onClose={() => setSelectedProduct(null)}
                onUpdate={updateProduct}
                onDelete={deleteProduct}
                onSale={recordSale}
              />
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <ProductForm
                location={location as 'Adama' | 'AddisAbaba' | 'Chemicals'}
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
        <Route path="/location/AddisAbaba" element={<LocationPage location="AddisAbaba" />} />
        <Route path="/location/Chemicals" element={<LocationPage location="Chemicals" />} />
        <Route path="/sales/:location" element={<LocationSalesPage />} />
        <Route path="/daily-sales" element={<DailySalesPage />} />
        <Route path="/sales-history" element={<SalesHistory />} />
        <Route path="/sales-history/:location" element={<SalesHistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
