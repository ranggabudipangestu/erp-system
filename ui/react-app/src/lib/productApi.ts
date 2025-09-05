import { Product, CreateProductRequest, UpdateProductRequest } from '@/types/product';
import { apiRequest } from './api';

const PRODUCT_API_BASE = '/api/master-data/products';

export const productApi = {
  // Get all products
  async getAll(): Promise<Product[]> {
    return apiRequest<Product[]>(PRODUCT_API_BASE);
  },

  // Get product by ID
  async getById(id: string): Promise<Product> {
    return apiRequest<Product>(`${PRODUCT_API_BASE}/${id}`);
  },

  // Get product by code
  async getByCode(code: string): Promise<Product> {
    return apiRequest<Product>(`${PRODUCT_API_BASE}/by-code/${code}`);
  },

  // Get products by category
  async getByCategory(category: string): Promise<Product[]> {
    return apiRequest<Product[]>(`${PRODUCT_API_BASE}/by-category/${category}`);
  },

  // Search products
  async search(searchTerm: string): Promise<Product[]> {
    const encodedTerm = encodeURIComponent(searchTerm);
    return apiRequest<Product[]>(`${PRODUCT_API_BASE}/search?searchTerm=${encodedTerm}`);
  },

  // Create new product
  async create(product: CreateProductRequest): Promise<Product> {
    return apiRequest<Product>(PRODUCT_API_BASE, {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  // Update existing product
  async update(id: string, product: UpdateProductRequest): Promise<Product> {
    return apiRequest<Product>(`${PRODUCT_API_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  // Delete product
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`${PRODUCT_API_BASE}/${id}`, {
      method: 'DELETE',
    });
  },
};