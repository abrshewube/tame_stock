import axios from 'axios';

const API_URL = 'https://tame-stock.onrender.com/api/sales';

export interface SaleData {
  productId: string;
  productName: string;
  date: string;
  location: string;
  quantity: number;
  price: number;
  description?: string;
}

export interface SalesBatchItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export const recordSalesBatch = async (params: { date: string; location: string; description?: string; sales: SalesBatchItem[] }) => {
  try {
    const response = await axios.post(`${API_URL}/bulk`, params);
    return response.data;
  } catch (error) {
    console.error('Error recording sales batch:', error);
    throw error;
  }
};

export const recordSale = async (saleData: SaleData) => {
  try {
    const response = await axios.post(API_URL, saleData);
    return response.data;
  } catch (error) {
    console.error('Error recording sale:', error);
    throw error;
  }
};

export const getSalesSummary = async (startDate?: string, endDate?: string, location?: string) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (location) params.append('location', location);
    
    const response = await axios.get(`${API_URL}/summary?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    throw error;
  }
};

export const getSales = async (date?: string, location?: string, page: number = 1, limit: number = 10) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (date) params.append('date', date);
    if (location) params.append('location', location);
    
    const response = await axios.get(`${API_URL}?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};
