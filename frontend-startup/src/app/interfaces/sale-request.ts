export interface SaleItemDTO {
  productId: number;
  quantity: number;
}

export interface SaleRequestDTO {
  items: SaleItemDTO[];
}