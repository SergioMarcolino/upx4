// Em src/app/services/supplier.ts
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ISupplierResponse } from '../interfaces/supplier-response';
import { ISuppliersResponse } from '../interfaces/suppliers-response';
import { ISupplierRequest } from '../interfaces/supplier-request';
// Não precisa mais do UserAuthService aqui
// import { UserAuthService } from './user-auth.ts'; 

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly _httpClient = inject(HttpClient);
  // Não precisamos mais do _authService aqui
  // private readonly _authService = inject(UserAuthService); 
  private readonly _apiUrl = 'http://localhost:3000/api/suppliers';

  /**
   * Lista todos os fornecedores.
   * Rota protegida (interceptor adiciona token).
   */
  listSuppliers(): Observable<ISupplierResponse[]> {
    // Não precisa de headers manuais
    return this._httpClient.get<ISuppliersResponse>(this._apiUrl).pipe(
      map(response => response.data || []), 
      catchError(this.handleError)
    );
  }

  createSupplier(payload: ISupplierRequest): Observable<ISupplierResponse> {
    // Interceptor adiciona o token
    // A API do backend retorna { message: '...', data: supplierCriado }
    return this._httpClient.post<{ message: string, data: ISupplierResponse }>(this._apiUrl, payload)
      .pipe(
        map(response => response.data), // Retorna apenas o fornecedor criado
        catchError(this.handleError)
      );
  }

  // (Opcional: Adicione createSupplier aqui se precisar)
  // createSupplier(payload: any): Observable<ISupplierResponse> { ... }

  /**
   * Tratador de erros genérico
   */
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