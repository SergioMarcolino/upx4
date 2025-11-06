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

export interface IStockAdjustmentRequest {
  productId: number;
  quantity: number;
  reason?: string; 
}


@Injectable({
  providedIn: 'root'
})

export class ProductService {


  private readonly _httpClient = inject(HttpClient);

  private readonly _apiUrl = 'http://localhost:3000/api/products';


  listProducts(): Observable<IProductResponse[]> {
    // Não precisa de headers manuais, o interceptor adiciona se necessário
    return this._httpClient.get<IProductsResponse>(this._apiUrl).pipe(
      map(response => response.data || []), 
      catchError(this.handleError)
    );
  }

  listActiveProducts(): Observable<IProductResponse[]> {
  return this.listProducts().pipe(
    map(products => products.filter(p => p.status === 'anunciado'))
  );
}

  getProductById(id: number): Observable<IProductResponse> {
    // Não precisa de headers manuais
    return this._httpClient.get<{ message: string, data: IProductResponse }>(`${this._apiUrl}/${id}`).pipe(
      map(response => response.data), 
      catchError(this.handleError)
    );
  }

  createProduct(payload: IProductRequest): Observable<IProductResponse> { 
    return this._httpClient.post<{ message: string, data: IProductResponse }>(this._apiUrl, payload)
      .pipe(
          map(response => response.data), 
          catchError(this.handleError)
      );
  }

  updateProduct(id: number, data: Partial<IProductResponse>): Observable<IProductResponse> {
    const { quantity, ...updatePayload } = data;
    
    return this._httpClient.put<{ message: string, data: IProductResponse, warning?: string }>(`${this._apiUrl}/${id}`, updatePayload)
      .pipe(
          map(response => response.data), 
          catchError(this.handleError)
      );
  }

  deleteProduct(id: number): Observable<{ message: string }> { 

    return this._httpClient.delete<{ message: string }>(`${this._apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro desconhecido ao acessar os produtos.';
     if (error.error instanceof ErrorEvent) {
       errorMessage = `Erro do cliente: ${error.error.message}`;
     } else if (error.status === 401 || error.status === 403) {
       errorMessage = 'Acesso não autorizado aos produtos. Verifique seu login.';
     } else if (error.error && error.error.message) {
       errorMessage = error.error.message;
     } else {
       errorMessage = `Erro ${error.status} nos produtos. Verifique a conexão com o servidor.`;
     }
    console.error('Erro no ProductService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  adjustStock(payload: IStockAdjustmentRequest): Observable<IProductResponse> {
    // Interceptor adiciona o token
    // A API retorna { message: '..', data: produtoAtualizado }
    return this._httpClient.post<{ message: string, data: IProductResponse }>(`${this._apiUrl}/adjust`, payload)
      .pipe(
        map(response => response.data), // Retorna só o produto atualizado
        catchError(this.handleError)
      );
  }
}