export type ProductStatus = "vendido" | "desativado" | "anunciado";

export interface User {
  id: number;
  email: string;
  password: string; 
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    email: string;
  };
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
  };
}

export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface Supplier {
  id: number;
  companyName: string; 
  cnpj: string;        
  contactName?: string; 
  phone?: string;       
}

export interface SupplierRequest {
  companyName: string;
  cnpj: string;
  contactName?: string;
  phone?: string;
}


export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  status: ProductStatus;
  imageBase64: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;       
  date: string;
  supplierId: number;    
}

export interface ProductRequest { 
  title: string;
  description: string;
  category: string;
  imageBase64: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;       
  supplierId: number;     
}


export interface SaleItem {
  id: number;
  productId: number;
  quantitySold: number;
  pricePerUnit: number; 
  costPerUnit: number;  
}

export interface Sale {
  id: number;
  totalAmount: number;
  createdAt: string; 
  items: SaleItem[]; 
}

export enum MovementType {
  SALE = "SALE",
  PURCHASE = "PURCHASE", 
  INITIAL_ADJUSTMENT = "INITIAL_ADJUSTMENT", 
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT" 
}

export interface StockMovement {
  id: number;
  productId: number;
  type: MovementType;
  quantity: number; 
  createdAt: string; 
}


export interface SaleRequestDTO {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface ProfitReportDTO {
  totalRevenue: number; 
  totalCost: number;    
  totalProfit: number;  
}


declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload; 
    }
  }
}