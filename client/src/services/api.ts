import axios from 'axios';

const API_BASE_URL = 'https://tame-stock.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export interface Product {
  _id: string;
  name: string;
  location: 'Adama' | 'AddisAbaba' | 'Chemicals';
  initialBalance: number;
  price: number;
  dateAdded: string;
  balance?: number;
  totalIn?: number;
  totalOut?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  productId: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
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
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  location: 'Adama' | 'AddisAbaba' | 'Chemicals';
  initialBalance: number;
  price: number;
}

export interface TransactionFormData {
  type: 'in' | 'out';
  quantity: number;
  date: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Product API service
export const productService = {
  // Get all products
  getAllProducts: async (params?: { location?: string; search?: string }): Promise<Product[]> => {
    const response = await api.get<ApiResponse<Product[]>>('/products', { params });
    return response.data.data;
  },

  // Get products by location
  getProductsByLocation: async (location: 'Adama' | 'AddisAbaba'): Promise<Product[]> => {
    const response = await api.get<ApiResponse<Product[]>>(`/products/location/${location}`);
    return response.data.data;
  },

  // Get single product
  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  // Create product
  createProduct: async (productData: ProductFormData): Promise<Product> => {
    const response = await api.post<ApiResponse<Product>>('/products', productData);
    return response.data.data;
  },

  // Update product
  updateProduct: async (id: string, productData: Partial<ProductFormData>): Promise<Product> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, productData);
    return response.data.data;
  },

  // Delete product
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  // Get transactions for a product
  getTransactions: async (
    productId: string, 
    params?: { page?: number; limit?: number; search?: string }
  ): Promise<{ transactions: Transaction[]; pagination: any }> => {
    const response = await api.get<ApiResponse<Transaction[]>>(`/products/${productId}/transactions`, { params });
    return {
      transactions: response.data.data,
      pagination: response.data.pagination
    };
  },

  // Add transaction
  addTransaction: async (productId: string, transactionData: TransactionFormData): Promise<Transaction> => {
    const response = await api.post<ApiResponse<Transaction>>(`/products/${productId}/transactions`, transactionData);
    return response.data.data;
  },

  // Delete transaction
  deleteTransaction: async (productId: string, transactionId: string): Promise<void> => {
    await api.delete(`/products/${productId}/transactions/${transactionId}`);
  },

  // Clear transaction history
  clearHistory: async (productId: string): Promise<Product> => {
    const response = await api.post<ApiResponse<Product>>(`/products/${productId}/clear-history`);
    return response.data.data;
  }
};

export default api;