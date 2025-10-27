// Em src/app/pages/supplier-list/supplier-list.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Para o link "Adicionar Novo"
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

// Serviços e Interfaces
import { SupplierService } from '../../services/supplier';
import { ProductService } from '../../services/product';
import { ISupplierResponse } from '../../interfaces/supplier-response';
import { IProductResponse } from '../../interfaces/product-response';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, RouterModule], // Adiciona RouterModule
  templateUrl: './supplier-list.html',
  styleUrls: ['./supplier-list.css']
})
export class SupplierListComponent implements OnInit {

  // Injeções
  private supplierService = inject(SupplierService);
  private productService = inject(ProductService);

  // Estado
  suppliers: ISupplierResponse[] = [];
  products: IProductResponse[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Carrega fornecedores e produtos em paralelo.
   */
  loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // forkJoin executa os Observables em paralelo e emite quando TODOS completarem
    forkJoin({
      suppliers: this.supplierService.listSuppliers().pipe(catchError(() => of([] as ISupplierResponse[]))), // Retorna [] em caso de erro
      products: this.productService.listProducts().pipe(catchError(() => of([] as IProductResponse[])))    // Retorna [] em caso de erro
    })
    .pipe(finalize(() => this.isLoading = false)) // Garante que isLoading vira false no fim
    .subscribe({
      next: (results) => {
        this.suppliers = results.suppliers;
        this.products = results.products;
        
        // Verifica se houve erro em alguma das chamadas (apesar do catchError)
        if (this.suppliers.length === 0 && this.products.length > 0) {
            this.errorMessage = "Fornecedores carregados, mas falha ao carregar produtos associados.";
        } else if (this.suppliers.length > 0 && this.products.length === 0 ) {
             this.errorMessage = "Produtos carregados, mas falha ao carregar fornecedores associados.";
        } else if (this.suppliers.length === 0 && this.products.length === 0 ) {
             // Pode ser que não haja dados ou ambas as chamadas falharam
             // O template @empty cuidará da mensagem se não houver dados
        }

      },
      error: (err) => {
        // Erro geral se o forkJoin falhar (menos provável com catchError individual)
        console.error("Erro geral ao carregar dados:", err);
        this.errorMessage = "Erro ao carregar dados. Tente novamente.";
      }
    });
  }

  /**
   * Helper para filtrar produtos de um fornecedor específico.
   * Executado no template para cada fornecedor.
   */
  getProductsForSupplier(supplierId: number): IProductResponse[] {
    return this.products.filter(product => product.supplierId === supplierId);
  }
}