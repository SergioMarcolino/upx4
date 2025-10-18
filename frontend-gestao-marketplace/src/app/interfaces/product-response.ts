export interface IProductResponse {
  id: number;
  title: string; // Renomeado de name para title (ajuste se necessário)
  supplier: string; // Adicionado
  purchase_price: number; // Adicionado
  quantity: number; // Adicionado
  sale_price: number; // Adicionado
  date: string; // Adicionado (Data da última atualização/criação)
  description: string;
  category: string;
  status: string;
  imageBase64: string;
}