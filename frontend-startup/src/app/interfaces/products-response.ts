// Define a estrutura da resposta da API ao listar produtos
import { IProductResponse } from "./product-response"; // Garanta que usa a interface atualizada

export interface IProductsResponse {
  message: string;
  data: IProductResponse[]; // Array de produtos
}