// Define a estrutura de um produto individual recebido da API
export interface IProductResponse {
  id: number;
  title: string;
  // supplier: string; // REMOVIDO
  supplierId: number; // ADICIONADO (ID do fornecedor)
  purchase_price: number;
  quantity: number;
  sale_price: number;
  date: string; // ISO String Date
  description: string;
  category: string;
  status: string; // "anunciado", "vendido", "desativado"
  imageBase64: string; // Corrigido para imageBase64
}