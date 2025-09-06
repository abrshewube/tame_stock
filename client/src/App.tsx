
import type React from "react"
import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom"
import { SproutIcon as Seedling, ArrowLeft, Plus, Package, ShoppingCart, BarChart3, TrendingUp } from "lucide-react"
import DailySalesPage from "./components/DailySalesPage"
import SalesHistory from "./components/SalesHistory"
import LocationSalesPage from "./components/LocationSalesPage"
import { LocationCard } from "./components/LocationCard"
import { ProductCard } from "./components/ProductCard"
import { ProductDetails } from "./components/ProductDetails"
import { ProductForm } from "./components/ProductForm"
import { LoadingSpinner } from "./components/LoadingSpinner"
import { useProducts } from "./hooks/useProducts"

type Location = "Adama" | "AddisAbaba" | "Chemicals"

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
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
  }

  return (
    <Link to={`/sales/${location}`} state={{ location }} className="block group">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-1 p-8 text-center">
        <div
          className={`p-4 ${colorClasses[color as keyof typeof colorClasses]} rounded-2xl mx-auto mb-6 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          <ShoppingCart className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          {location} Sales
        </h3>
        <p className="text-gray-600">Manage sales and track performance</p>
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
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-lg">
              <Package className="h-12 w-12 text-white" />
            </div>
          </div>
         
        </div>

        <div className="mb-20">
          
        
        </div>

        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Inventory Overview</h2>
            <p className="text-gray-600 text-lg">Monitor stock levels and manage products across all locations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            <a href="/location/Adama" className="block group">
              <LocationCard
                name="Adama"
                productCount={locationStats["Adama"].count}
                totalStock={locationStats["Adama"].totalStock}
                onClick={() => {}}
              />
            </a>
            <a href="/location/AddisAbaba" className="block group">
              <LocationCard
                name="AddisAbaba"
                productCount={locationStats["AddisAbaba"].count}
                totalStock={locationStats["AddisAbaba"].totalStock}
                onClick={() => {}}
              />
            </a>
            <a href="/location/Chemicals" className="block group">
              <LocationCard
                name="Chemicals"
                productCount={locationStats["Chemicals"].count}
                totalStock={locationStats["Chemicals"].totalStock}
                onClick={() => {}}
              />
            </a>
          </div>

          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
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
          </div> */}
        </div>

        <div className="mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sales Management</h2>
            <p className="text-gray-600 text-lg">Track and manage sales performance by location</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <SalesLocationCard location="Adama" color="green" />
            <SalesLocationCard location="AddisAbaba" color="blue" />
            <SalesLocationCard location="Chemicals" color="purple" />
          </div>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Link to="/" className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{location} Inventory</h1>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
