// Define a estrutura do payload para CRIAR um novo fornecedor
export interface ISupplierRequest {
  companyName: string; // Obrigatório
  cnpj: string;        // Obrigatório
  contactName?: string; // Opcional
  phone?: string;       // Opcional
}