// types.ts (CORRIGIDO PARA O SISTEMA ERP DE ESTOQUE)

// --- AUTENTICAÇÃO E USUÁRIO (Não alterado) ---

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

// --- PRODUTOS (CORRIGIDO) ---

export type ProductStatus = "vendido" | "desativado" | "anunciado";

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  status: ProductStatus;
  imageBase64: string;
  
  // CAMPOS CORRIGIDOS PARA O DASHBOARD/ERP:
  purchase_price: number; // 👈 Valor de Custo/Compra
  sale_price: number;     // 👈 Valor de Venda (Substitui o 'price' original)
  quantity: number;       // 👈 Quantidade em Estoque
  supplier: string;       // 👈 Fornecedor
  date: string;           // 👈 Data de Criação/Atualização (para cálculo de tempo)
}

export interface ProductRequest {
  title: string;
  description: string;
  category: string;
  imageBase64: string;
  
  // CAMPOS CORRIGIDOS PARA A REQUISIÇÃO:
  purchase_price: number;
  sale_price: number;
  quantity: number;
  supplier: string;
}

// --- TIPAGEM EXPRESS (Não alterado) ---

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}