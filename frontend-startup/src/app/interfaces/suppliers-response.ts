import { ISupplierResponse } from "./supplier-response";

export interface ISuppliersResponse {
  message: string;
  data: ISupplierResponse[]; 
}