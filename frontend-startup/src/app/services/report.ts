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
      responseType: 'blob' 
    }).pipe(
      catchError(this.handleError)
    );
  }


  private handleError(error: HttpErrorResponse): Observable<never> {
     let errorMessage = 'Erro ao baixar o relatório.';
     
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
                observer.error(new Error(errorMessage)); 
            };
            reader.onerror = () => {
                 observer.error(new Error(`Erro ${error.status} - Falha ao ler a resposta do erro.`));
            };
            reader.readAsText(error.error); 
        });
     }
     
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