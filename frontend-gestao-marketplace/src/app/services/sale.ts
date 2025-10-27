// Em src/app/services/sale.ts
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators'; // map adicionado

// Importa as interfaces necessárias
import { SaleRequestDTO } from '../interfaces/sale-request';
import { SaleResponse} from '../interfaces/sale-response'; // ISaleResponse (individual)
import { ISalesResponse } from '../interfaces/sales-response';   // ISalesResponse (lista)

// (Removido UserAuthService pois o interceptor cuida do token)

@Injectable({
  providedIn: 'root'
})
export class SaleService {

  private readonly _httpClient = inject(HttpClient);
  private readonly _apiUrl = 'http://localhost:3000/api/sales'; // URL base para vendas

  /**
   * Cria uma nova venda.
   * Envia dados para POST /api/sales.
   * O interceptor adiciona o token.
   * Retorna o objeto da venda criada diretamente.
   */
  createSale(saleRequest: SaleRequestDTO): Observable<SaleResponse> {
    // A API POST retorna o objeto SaleResponse diretamente (sem {message, data})
    return this._httpClient.post<SaleResponse>(this._apiUrl, saleRequest)
      .pipe(
        catchError(this.handleError) // Aplica tratamento de erro
      );
  }

  /**
   * Lista todas as vendas registradas.
   * Chama GET /api/sales.
   * O interceptor adiciona o token.
   * Retorna um array com todas as vendas.
   */
  listSales(): Observable<SaleResponse[]> {
    // A API GET retorna { message: '...', data: [...] }
    return this._httpClient.get<ISalesResponse>(this._apiUrl)
      .pipe(
        map(response => response.data || []), // Extrai o array 'data', retorna [] se não vier
        catchError(this.handleError) // Aplica tratamento de erro
      );
  }


  /**
   * Trata erros HTTP que podem ocorrer nas chamadas de venda/listagem.
   * Retorna um Observable de erro com uma mensagem amigável.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro desconhecido ao processar sua solicitação.';

    if (error.error instanceof ErrorEvent) {
      // Erro de rede ou do lado do cliente
      errorMessage = `Erro de cliente/rede: ${error.error.message}`;
    } else {
      // Erro retornado pelo backend
      if (error.status === 400 && error.error.message) {
        // Erro de validação ou regra de negócio (ex: estoque insuficiente)
        errorMessage = error.error.message;
      } else if (error.status === 401 || error.status === 403) {
        // Erro de autenticação/autorização
        errorMessage = 'Acesso não autorizado. Verifique seu login ou permissões.';
      } else if (error.error && error.error.message) {
         // Outros erros com mensagem específica do backend
         errorMessage = `Erro do servidor: ${error.error.message}`;
      }
       else {
        // Erros genéricos do servidor
        errorMessage = `Erro ${error.status} no servidor. Tente novamente mais tarde.`;
      }
    }

    // Loga o erro detalhado no console para depuração
    console.error('Erro interceptado no SaleService:', errorMessage, error);
    // Retorna o erro para o componente que chamou o serviço
    return throwError(() => new Error(errorMessage));
  }
}