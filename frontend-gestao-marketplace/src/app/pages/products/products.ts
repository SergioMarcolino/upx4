// Em src/app/pages/products/products.component.ts

import { Component, inject, OnInit, Renderer2 } from '@angular/core'; // Adicionado Renderer2
import { CommonModule, NgClass, DatePipe, DecimalPipe } from '@angular/common'; 
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // FormsModule para o Modal

// Seus serviços e interfaces
import { ProductService } from '../../services/product'; 
import { IProductResponse } from '../../interfaces/product-response'; 
import { SupplierService } from '../../services/supplier'; // 👈 IMPORTAR SupplierService
import { ISupplierResponse } from '../../interfaces/supplier-response'; // 👈 IMPORTAR ISupplierResponse

import { Observable, BehaviorSubject, switchMap, catchError, of, finalize, tap } from 'rxjs'; // Importar tap
import { format, parseISO } from 'date-fns'; 
import { ptBR } from 'date-fns/locale';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NgClass, 
    FormsModule, // Adicionar FormsModule aos imports para o Modal
  ], 
  providers: [ DatePipe, DecimalPipe ], 
  templateUrl: './products.html', 
  styleUrls: ['./products.css']   
})
export class ProductsComponent implements OnInit { 
  
  // Injeções
  private readonly productService = inject(ProductService); 
  private readonly supplierService = inject(SupplierService); // 👈 INJETAR SupplierService
  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2); 
  
  // Estado para forçar o refresh
  private refreshTrigger$ = new BehaviorSubject<void>(undefined); 
  
  // Observables para dados e estados
  products$: Observable<IProductResponse[]>;
  public suppliers: ISupplierResponse[] = []; // 👈 CRIAR ARRAY para guardar fornecedores
  isLoading = true; 
  
  // Estado para Modais e Formulários
  showEditDialog = false;
  editingProduct: IProductResponse | null = null;
  editErrorMessage: string | null = null; 

  constructor() {
    // 👇 MODIFICADO: Busca fornecedores PRIMEIRO, depois produtos
    this.products$ = this.supplierService.listSuppliers().pipe(
      tap(suppliers => this.suppliers = suppliers), // Armazena os fornecedores na propriedade 'suppliers'
      switchMap(() => this.refreshTrigger$), // Dispara a busca de produtos
      switchMap(() => {
        this.isLoading = true; 
        return this.productService.listProducts().pipe( 
          catchError((err: HttpErrorResponse) => {
            console.error('Falha ao carregar produtos.', err);
            return of([] as IProductResponse[]); 
          }),
          finalize(() => this.isLoading = false) 
        );
      }),
      catchError((err: HttpErrorResponse) => { // Catch error do supplierService
        console.error('Falha ao carregar fornecedores.', err);
        // Tenta carregar produtos mesmo assim
        this.isLoading = true; 
         return this.productService.listProducts().pipe( 
          catchError((prodErr: HttpErrorResponse) => {
            console.error('Falha ao carregar produtos após erro de fornecedor.', prodErr);
             return of([] as IProductResponse[]); 
          }),
          finalize(() => this.isLoading = false)
        );
      })
    );
  }

  ngOnInit(): void {
    // A inscrição no template já dispara o fluxo do constructor
  }

  // --- Funções Auxiliares de Formatação ---
  
  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Data indisponível';
    try {
      const date = parseISO(dateStr); 
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      console.error("Erro ao formatar data:", dateStr, e);
      return 'Data inválida'; 
    }
  }

  calculateMargin(sale: number | null | undefined, purchase: number | null | undefined): string {
    if (purchase === null || purchase === undefined || purchase <= 0 || 
        sale === null || sale === undefined || sale <= 0) {
      return '- %';
    }
    try {
      const margin = ((sale - purchase) / sale) * 100; 
      return `${margin % 1 === 0 ? margin.toFixed(0) : margin.toFixed(1)}%`;
    } catch (e) {
      return '- %';
    }
  }

  // 👇 ADICIONAR FUNÇÃO HELPER para pegar nome do fornecedor 👇
  getSupplierName(supplierId: number | null | undefined): string {
    if (supplierId === null || supplierId === undefined) return 'N/D';
    // Usa a propriedade 'this.suppliers' que foi preenchida no constructor
    const supplier = this.suppliers.find(s => s.id === supplierId); 
    return supplier ? supplier.companyName : `ID ${supplierId} não encontrado`;
  }

  // --- Funções de CRUD (Ações dos Botões) ---
  
  handleEdit(product: IProductResponse): void {
    this.editingProduct = JSON.parse(JSON.stringify(product)); 
    this.showEditDialog = true;
    this.editErrorMessage = null; 
    this.renderer.addClass(document.body, 'modal-open'); 
  }
  
  handleSaveEdit(): void {
    if (!this.editingProduct) return;

    this.isLoading = true; 
    this.editErrorMessage = null;
    const productId = this.editingProduct.id; 

    // Garante que supplierId seja número antes de enviar
    if (this.editingProduct.supplierId && typeof this.editingProduct.supplierId === 'string') {
        this.editingProduct.supplierId = parseInt(this.editingProduct.supplierId, 10);
    }

    this.productService.updateProduct(productId, this.editingProduct).subscribe({
      next: (updatedProduct) => {
        console.log('Produto atualizado:', updatedProduct);
        this.handleCloseEdit(); 
        this.refreshTrigger$.next(); // Recarrega a lista
      },
      error: (err: Error) => {
        console.error('Erro ao atualizar produto:', err);
        this.editErrorMessage = `Erro ao salvar: ${err.message}`; 
        this.isLoading = false; 
      }
    });
  }

  handleCloseEdit(): void {
    this.showEditDialog = false;
    this.editingProduct = null;
    this.editErrorMessage = null;
    this.renderer.removeClass(document.body, 'modal-open'); 
    if(this.isLoading) { this.isLoading = false; }
  }
  
  handleDelete(id: number): void {
    if (confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
      this.isLoading = true; 
      this.productService.deleteProduct(id).subscribe({
        next: (response) => {
          console.log(response.message || 'Produto excluído com sucesso.');
          this.refreshTrigger$.next(); // Recarrega a lista
        },
        error: (err: Error) => {
          console.error('Erro ao deletar:', err);
          alert(`Erro ao deletar: ${err.message}`); 
          this.isLoading = false; 
        }
      });
    }
  }
}