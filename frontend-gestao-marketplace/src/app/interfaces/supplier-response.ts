// Define a estrutura de um fornecedor individual
export interface ISupplierResponse {
  id: number;
  companyName: string;
  cnpj: string;
  contactName?: string;
  phone?: string;
}