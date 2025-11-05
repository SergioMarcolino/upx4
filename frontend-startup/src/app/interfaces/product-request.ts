// Em src/app/interfaces/product-request.ts
export interface IProductRequest {
  title: string;
  description: string;
  category: string;
  imageBase64: string; 
  purchase_price: number;
  sale_price: number;
  quantity: number;   
  supplierId: number; 
}