
export interface IProductResponse {
  id: number;
  title: string;
  supplierId: number; 
  purchase_price: number;
  quantity: number;
  sale_price: number;
  date: string; 
  description: string;
  category: string;
  status: string; 
  imageBase64: string; 
}