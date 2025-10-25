// Define a estrutura da resposta da API ao listar fornecedores
import { ISupplierResponse } from "./supplier-response";

export interface ISuppliersResponse {
  message: string;
  data: ISupplierResponse[]; // Array de fornecedores
}