// Em src/app/services/product.ts

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Importa suas interfaces de produto (atualizadas)
import { IProductResponse } from '../interfaces/product-response';
import { IProductsResponse } from '../interfaces/products-response';
import { IProductRequest } from '../interfaces/product-request';

// Importa seu serviço de autenticação (APENAS para checar se está logado, se necessário)
import { UserAuthService } from './user-auth';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // Injeção de dependências
  private readonly _httpClient = inject(HttpClient);
  // Não precisamos mais do _authService aqui se o interceptor cuida do token
  // private readonly _authService = inject(UserAuthService); 

  private readonly _apiUrl = 'http://localhost:3000/api/products';

  /**
   * Busca a lista de todos os produtos.
   * Rota GET é pública (ou protegida pelo interceptor).
   */
  listProducts(): Observable<IProductResponse[]> {
    // Não precisa de headers manuais, o interceptor adiciona se necessário
    return this._httpClient.get<IProductsResponse>(this._apiUrl).pipe(
      map(response => response.data || []), 
      catchError(this.handleError)
    );
  }

   /**
   * Busca um único produto pelo ID.
   * Rota protegida (interceptor adiciona token).
   */
  getProductById(id: number): Observable<IProductResponse> {
    // Não precisa de headers manuais
    return this._httpClient.get<{ message: string, data: IProductResponse }>(`${this._apiUrl}/${id}`).pipe(
      map(response => response.data), 
      catchError(this.handleError)
    );
  }

  /**
   * Cria um novo produto.
   * Rota protegida (interceptor adiciona token). Usa IProductRequest.
   */
  createProduct(payload: IProductRequest): Observable<IProductResponse> { 
    // Não precisa de headers manuais
    return this._httpClient.post<{ message: string, data: IProductResponse }>(this._apiUrl, payload)
      .pipe(
          map(response => response.data), 
          catchError(this.handleError)
      );
  }

  /**
   * Atualiza um produto por ID.
   * Rota protegida (interceptor adiciona token).
   */
  updateProduct(id: number, data: Partial<IProductResponse>): Observable<IProductResponse> {
    // Remove 'quantity' antes de enviar, backend ignora
    const { quantity, ...updatePayload } = data;
    
    // Não precisa de headers manuais
    return this._httpClient.put<{ message: string, data: IProductResponse, warning?: string }>(`${this._apiUrl}/${id}`, updatePayload)
      .pipe(
          map(response => response.data), 
          catchError(this.handleError)
      );
  }

  /**
   * Deleta um produto por ID.
   * Rota protegida (interceptor adiciona token).
   */
  deleteProduct(id: number): Observable<{ message: string }> { 
    // Não precisa de headers manuais
    return this._httpClient.delete<{ message: string }>(`${this._apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Função genérica de tratamento de erros
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro desconhecido ao acessar os produtos.';
     if (error.error instanceof ErrorEvent) {
       errorMessage = `Erro do cliente: ${error.error.message}`;
     } else if (error.status === 401 || error.status === 403) {
       // O interceptor pode já tratar isso, mas é bom ter um fallback
       errorMessage = 'Acesso não autorizado aos produtos. Verifique seu login.';
     } else if (error.error && error.error.message) {
       errorMessage = error.error.message;
     } else {
       errorMessage = `Erro ${error.status} nos produtos. Verifique a conexão com o servidor.`;
     }
    console.error('Erro no ProductService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}