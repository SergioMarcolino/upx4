// src/app/pages/products/products.component.ts

import { Component, inject, OnInit } from '@angular/core'; // 👈 Adicionado OnInit
import { CommonModule } from '@angular/common';
import { Router, RouterModule} from '@angular/router';
import { IProductResponse } from '../../interfaces/product-response'; 
import { UserService } from '../../services/user'; 
import { Observable, BehaviorSubject, switchMap, catchError, of, finalize } from 'rxjs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HttpErrorResponse } from '@angular/common/http'; // Adicionado para tipagem de erro

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
// 👈 Implementa OnInit
export class ProductsComponent implements OnInit { 
  
  // Injeções
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);
  
  // Estado para forçar o refresh (simula queryClient.invalidateQueries)
  private refreshProducts$ = new BehaviorSubject<void>(undefined); 
  
  // Observables para dados e estados (simula useQuery)
  products$: Observable<IProductResponse[]>;
  isLoading = true;
  
  // Estado para Modais e Formulários
  showEditDialog = false;
  editingProduct: IProductResponse | null = null;

  constructor() {
    this.products$ = this.refreshProducts$.pipe(
      switchMap(() => {
        this.isLoading = true; // Inicia o loading
        return this._userService.listProducts().pipe( 
          catchError((err: HttpErrorResponse) => { // Tipagem do erro para debug
            console.error('Falha ao carregar produtos. Verifique se o Express está rodando.', err);
            return of([] as IProductResponse[]); 
          }),
          finalize(() => this.isLoading = false) // Finaliza o loading
        );
      })
    );
  }

  // 🎯 MÉTODO DE INICIALIZAÇÃO ONDE DISPARAMOS A REQUISIÇÃO
  ngOnInit(): void {
    // Esta chamada força o BehaviorSubject a emitir o primeiro valor,
    // o que dispara o switchMap e a chamada à API.
    this.refreshProducts$.next(); 
  }

  // Helper para formatar data
  formatDate(dateStr: string): string {
    // Garante que o objeto date-fns esteja instalado
    try {
        return format(new Date(dateStr), "dd 'de' MMM", { locale: ptBR });
    } catch (e) {
        return dateStr; // Retorna a string original em caso de falha de formatação
    }
  }

  // Helper para calcular margem
  calculateMargin(sale: number, purchase: number): string {
    if (purchase === 0) return 'N/A';
    return (((sale - purchase) / purchase) * 100).toFixed(1) + '%';
  }

  // --- Mutações (Lógica de CRUD) ---
  
  // Simula handleEdit
  handleEdit(product: IProductResponse): void {
    this.editingProduct = product;
    this.showEditDialog = true;
  }
  
  // Simula deleteMutation.mutate
  handleDelete(id: number): void {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      this._userService.deleteProduct(id).subscribe({
        next: () => this.refreshProducts$.next(), // Recarrega a lista
        error: (err) => console.error('Erro ao deletar:', err)
      });
    }
  }
}