// Em src/app/services/report.ts
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private readonly _httpClient = inject(HttpClient);
  // O Interceptor cuida do token
  private readonly _apiUrl = 'http://localhost:3000/api/reports';

  /**
   * Solicita o relatório do backend.
   * @param year Ano (ex: 2025)
   * @param month Mês (ex: 10 para Outubro)
   * Pede a resposta como um 'blob' (um arquivo binário, que é o PDF).
   */
  downloadStockFinancialReport(year: number, month: number): Observable<Blob> {
    
    return this._httpClient.get(`${this._apiUrl}/stock-financial/${year}/${month}`, {
      responseType: 'blob' // 👈 MUITO IMPORTANTE: Diz ao Angular para esperar um arquivo
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Trata erros. Se o erro for JSON (API retornou 400/500), tenta ler a mensagem.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
     let errorMessage = 'Erro ao baixar o relatório.';
     
     // Se o tipo de erro for Blob, significa que a API retornou um erro em JSON
     // e precisamos lê-lo de forma diferente.
     if (error.error instanceof Blob && error.error.type === "application/json") {
        return new Observable<never>(observer => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                try {
                    const errResp = JSON.parse(e.target.result);
                    errorMessage = errResp.message || errResp.error || 'Erro no servidor ao gerar PDF.';
                } catch (jsonError) {
                    errorMessage = `Erro ${error.status} - Não foi possível ler a resposta do servidor.`;
                }
                console.error('Erro no ReportService (JSON error):', errorMessage, error);
                observer.error(new Error(errorMessage)); // Lança o erro com a mensagem lida
            };
            reader.onerror = () => {
                 observer.error(new Error(`Erro ${error.status} - Falha ao ler a resposta do erro.`));
            };
            reader.readAsText(error.error); // Lê o Blob de erro como texto
        });
     }
     
     // Erros de rede ou outros
     if (error.status === 401 || error.status === 403) {
       errorMessage = 'Acesso não autorizado ao relatório.';
     } else if (error.status === 400) {
       errorMessage = 'Requisição inválida (verifique ano/mês).';
     } else if (error.status === 500) {
        errorMessage = 'Servidor falhou ao gerar o relatório.'
     }
     
     console.error('Erro no ReportService (Generic):', errorMessage, error);
     return throwError(() => new Error(errorMessage));
   }
}