// Em src/app/interfaces/sales-response.ts
import { SaleResponse } from "./sale-response"; // Importa a interface de venda individual

export interface ISalesResponse { // Resposta da API GET /api/sales
  message: string;
  data: SaleResponse[]; // Array de vendas
}