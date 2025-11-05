import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ISupplierResponse } from '../interfaces/supplier-response';
import { ISuppliersResponse } from '../interfaces/suppliers-response';
import { ISupplierRequest } from '../interfaces/supplier-request';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly _httpClient = inject(HttpClient);

  private readonly _apiUrl = 'http://localhost:3000/api/suppliers';

  listSuppliers(): Observable<ISupplierResponse[]> {
    return this._httpClient.get<ISuppliersResponse>(this._apiUrl).pipe(
      map(response => response.data || []), 
      catchError(this.handleError)
    );
  }

  createSupplier(payload: ISupplierRequest): Observable<ISupplierResponse> {
 
    return this._httpClient.post<{ message: string, data: ISupplierResponse }>(this._apiUrl, payload)
      .pipe(
        map(response => response.data), 
        catchError(this.handleError)
      );
  }


   private handleError(error: HttpErrorResponse): Observable<never> {
     let errorMessage = 'Ocorreu um erro desconhecido ao acessar os fornecedores.';
     if (error.error instanceof ErrorEvent) {
       errorMessage = `Erro do cliente: ${error.error.message}`;
     } else if (error.status === 401 || error.status === 403) {
       errorMessage = 'Acesso não autorizado aos fornecedores.';
     } else if (error.error && error.error.message) {
       errorMessage = `Erro do servidor (Fornecedores): ${error.error.message}`;
     } else {
       errorMessage = `Erro ${error.status} ao buscar fornecedores. Verifique a conexão.`;
     }
     console.error('Erro no SupplierService:', errorMessage, error);
     return throwError(() => new Error(errorMessage));
   }
}