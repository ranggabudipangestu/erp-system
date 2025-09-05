export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  unit?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minimumStock: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy?: string;
}

export interface CreateProductRequest {
  code: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  unit?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minimumStock: number;
  isActive: boolean;
  imageUrl?: string;
  createdBy: string;
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  unit?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minimumStock: number;
  isActive: boolean;
  imageUrl?: string;
  updatedBy: string;
}