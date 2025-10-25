// src/app/services/user.ts

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IAuthSuccessResponse } from '../interfaces/auth-sucess-response';
import { ILoginSuccessResponse } from '../interfaces/login-success-response';
import { IRegisterPayload } from '../interfaces/register-payload';
import { IProductResponse } from '../interfaces/product-response';
import { map } from 'rxjs/operators';
// Assumindo que você tenha uma interface para o sucesso do registro (pode ser a mesma do login ou Auth)


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly _httpClient = inject(HttpClient);

  // Endpoint de autenticação protegida (ajustado para usar o proxy)
  validateUser(): Observable<IAuthSuccessResponse> {
    return this._httpClient.get<IAuthSuccessResponse>('http://localhost:3000/api/protected');
  }

  // Método de Login (ajustado para usar o proxy)
  login(email: string, password: string): Observable<ILoginSuccessResponse> {
    const body = { email, password };
    return this._httpClient.post<ILoginSuccessResponse>('http://localhost:3000/api/users/login', body);
  }

  // NOVO MÉTODO: Método de Registro (corrigido para o seu caso)
  register(payload: IRegisterPayload): Observable<ILoginSuccessResponse> {
    // Você pode precisar de uma interface de sucesso de registro,
    // mas ILoginSuccessResponse (que deve ter o token) geralmente serve.
    return this._httpClient.post<ILoginSuccessResponse>('http://localhost:3000/api/users/register', payload);
  }

  listProducts(): Observable<IProductResponse[]> {
    // 2. Chama a API, mas tipa a resposta inicial como 'any' ou a estrutura completa
    return this._httpClient.get<any>(`http://localhost:3000/api/products`).pipe(
        // 3. Usa o map para extrair APENAS o array que está em 'response.data'
        map(response => response.data as IProductResponse[])
    );
  }

  /**
   * Deleta um produto por ID.
   * Assume o endpoint DELETE /api/products/{id}
   */
  deleteProduct(id: number): Observable<any> {
    // Retorna 'any' ou uma interface de sucesso de deleção, se sua API retornar uma.
    return this._httpClient.delete(`http://localhost:3000/api/products/${id}`);
  }

  /**
   * Atualiza um produto por ID.
   * Assume o endpoint PUT /api/products/{id}
   */
  updateProduct(id: number, data: Partial<IProductResponse>): Observable<IProductResponse> {
    // Usa 'Partial' para permitir a passagem de apenas os campos modificados.
    return this._httpClient.put<IProductResponse>(`http://localhost:3000/api/products/${id}`, data);
  }

  createProduct(payload: Omit<IProductResponse, 'id' | 'status'>): Observable<IProductResponse> {
    // Usamos Omit<> para remover 'id' e 'status' que são definidos pelo backend.
    return this._httpClient.post<IProductResponse>(`http://localhost:3000/api/products`, payload);
  }
}