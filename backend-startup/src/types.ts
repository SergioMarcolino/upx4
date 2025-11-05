// Em src/types.ts

// Define ProductStatus type if not already defined
export type ProductStatus = "vendido" | "desativado" | "anunciado";

// --- AUTENTICAÇÃO E USUÁRIO ---
export interface User {
  id: number;
  email: string;
  password: string; // Hash da senha, não a senha real
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

// --- FORNECEDORES (NOVO) ---
export interface Supplier {
  id: number;
  companyName: string; // Nome Fantasia
  cnpj: string;        // CNPJ (como string para formatação)
  contactName?: string; // Nome do contato (opcional)
  phone?: string;       // Telefone (opcional)
}

// Interface para criar um novo fornecedor (sem ID)
export interface SupplierRequest {
  companyName: string;
  cnpj: string;
  contactName?: string;
  phone?: string;
}


// --- PRODUTOS (MODIFICADO) ---
export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  status: ProductStatus;
  imageBase64: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;       // <-- Cache do Estoque Atual
  date: string;
  supplierId: number;     // <-- ID do Fornecedor (Chave Estrangeira)
}

export interface ProductRequest { // Usado para Criar Produto
  title: string;
  description: string;
  category: string;
  imageBase64: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;       // <-- Estoque Inicial
  supplierId: number;     // <-- ID do Fornecedor é obrigatório ao criar
  // 'date' e 'status' são definidos pelo backend ao criar
}

// --- VENDAS ---
export interface SaleItem {
  id: number;
  productId: number;
  quantitySold: number;
  pricePerUnit: number; // Preço de Venda (congelado)
  costPerUnit: number;  // Custo de Compra (congelado)
}

export interface Sale {
  id: number;
  totalAmount: number;
  createdAt: string; // ISO String Date
  items: SaleItem[]; // Lista de itens vendidos
}

// --- ESTOQUE ---
export enum MovementType {
  SALE = "SALE",
  PURCHASE = "PURCHASE", // Para futuras entradas via Compra
  INITIAL_ADJUSTMENT = "INITIAL_ADJUSTMENT", // Ao criar o produto
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT" // Para ajustes manuais (futuro)
}

export interface StockMovement {
  id: number;
  productId: number;
  type: MovementType;
  quantity: number; // Negativo para saída (venda), Positivo para entrada
  createdAt: string; // ISO String Date
}

// --- DTOs (Data Transfer Objects) para a API ---

// O que o Frontend (Angular) envia para criar uma venda
export interface SaleRequestDTO {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  // customerId?: number; // (Opcional)
}

// O que a API de Relatório de Lucro (futura) pode responder
export interface ProfitReportDTO {
  totalRevenue: number; // Faturamento total
  totalCost: number;    // Custo total
  totalProfit: number;  // Lucro total
}


// --- TIPAGEM EXPRESS (Para req.user) ---
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload; // Adiciona a propriedade 'user' opcional ao Request
    }
  }
}