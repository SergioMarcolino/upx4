import { SaleResponse } from "./sale-response"; 

export interface ISalesResponse { 
  message: string;
  data: SaleResponse[]; 
}