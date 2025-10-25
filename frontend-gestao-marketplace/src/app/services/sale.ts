// Em src/app/services/sale.ts
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Importa as interfaces
import { SaleRequestDTO } from '../interfaces/sale-request'; // Ajuste o nome se necessário
import { SaleResponse } from '../interfaces/sale-response'; // Ajuste o nome se necessário

// Importa seu serviço de autenticação (apenas se precisar checar login ANTES)
import { UserAuthService } from './user-auth'; 

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  
  private readonly _httpClient = inject(HttpClient);
  // Não precisamos mais do _authService aqui se o interceptor cuida do token
  // private readonly _authService = inject(UserAuthService); 

  private readonly _apiUrl = 'http://localhost:3000/api/sales';

  /**
   * Cria uma nova venda.
   * Chama o endpoint POST /api/sales (protegido pelo interceptor).
   */
  createSale(saleRequest: SaleRequestDTO): Observable<SaleResponse> {
    // Não precisa checar token aqui se a rota é protegida e o interceptor funciona
    // const token = this._authService.getUserToken(); 
    // if (!token) return throwError(() => new Error('Usuário não autenticado...'));
    
    // Não precisa de headers manuais
    return this._httpClient.post<SaleResponse>(this._apiUrl, saleRequest)
      .pipe(
        catchError(this.handleError) 
      );
  }

  /**
   * Trata os erros que vêm do Backend
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro desconhecido ao processar a venda.';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro do cliente: ${error.error.message}`;
    } else {
      // Pega a mensagem específica do backend (ex: estoque insuficiente)
      if (error.status === 400 && error.error.message) {
        errorMessage = error.error.message; 
      } else if (error.status === 401 || error.status === 403) {
        errorMessage = 'Acesso não autorizado para vendas. Verifique seu login.';
      } else {
        errorMessage = `Erro ${error.status} ao processar venda. Verifique a conexão.`;
      }
    }
    
    console.error('Erro no SaleService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}