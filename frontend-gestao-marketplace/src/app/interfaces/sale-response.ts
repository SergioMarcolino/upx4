
export interface SaleItemResponse {
  id: number;
  productId: number;
  quantitySold: number;
  pricePerUnit: number;
  costPerUnit: number;
}

export interface SaleResponse {
  id: number;
  totalAmount: number;
  createdAt: string;
  items: SaleItemResponse[];
}