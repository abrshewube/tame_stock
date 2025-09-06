import { useState, useEffect } from 'react';
import { Product, ProductFormData, productService } from '../services/api';

export const useProducts = (location?: 'Adama' | 'AddisAbaba' | 'Chemicals') => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = location 
        ? await productService.getProductsByLocation(location)
        : await productService.getAllProducts();
      
      setProducts(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [location]);

  const addProduct = async (productData: ProductFormData): Promise<boolean> => {
    try {
      setError(null);
      const newProduct = await productService.createProduct(productData);
      
      // Only add to local state if it matches current location filter
      if (!location || newProduct.location === location) {
        setProducts(prev => [newProduct, ...prev]);
      }
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create product');
      console.error('Error creating product:', err);
      return false;
    }
  };

  const updateProduct = async (id: string, productData: Partial<ProductFormData>): Promise<boolean> => {
    try {
      setError(null);
      const updatedProduct = await productService.updateProduct(id, productData);
      
      setProducts(prev => prev.map(product => 
        product._id === id ? updatedProduct : product
      ));
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update product');
      console.error('Error updating product:', err);
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(product => product._id !== id));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete product');
      console.error('Error deleting product:', err);
      return false;
    }
  };

  const recordSale = async (productId: string, quantity: number, description?: string): Promise<boolean> => {
    try {
      setError(null);
      const transactionData = {
        type: 'out' as const,
        quantity,
        date: new Date().toISOString(),
        description: description || 'Sale transaction'
      };
      
      await productService.addTransaction(productId, transactionData);
      
      // Refresh products to get updated balances
      await fetchProducts();
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to record sale');
      console.error('Error recording sale:', err);
      return false;
    }
  };

  const getProduct = (id: string): Product | undefined => {
    return products.find(product => product._id === id);
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    recordSale,
    getProduct
  };
};