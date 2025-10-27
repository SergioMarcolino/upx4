// Em src/app/pages/products/products.component.ts

import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { CommonModule, NgClass, DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; 

// Seus serviços e interfaces
import { ProductService } from '../../services/product'; 
import { IProductResponse } from '../../interfaces/product-response'; 
import { SupplierService } from '../../services/supplier'; 
import { ISupplierResponse } from '../../interfaces/supplier-response'; 
import { ReportService } from '../../services/report'; // Importa o ReportService

import { Observable, BehaviorSubject, switchMap, catchError, of, finalize, tap } from 'rxjs'; 
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
    FormsModule, // Para o modal de Edição (ngModel)
    ReactiveFormsModule // Para o modal de Relatório (FormGroup)
  ], 
  providers: [ DatePipe, DecimalPipe ], 
  templateUrl: './products.html', 
  styleUrls: ['./products.css']   
})
export class ProductsComponent implements OnInit { 
  
  // Injeções
  private readonly fb = inject(FormBuilder); 
  private readonly productService = inject(ProductService); 
  private readonly supplierService = inject(SupplierService); 
  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2); 
  private readonly reportService = inject(ReportService);
  
  // Estado para forçar o refresh
  private refreshTrigger$ = new BehaviorSubject<void>(undefined); 
  
  // Observables para dados e estados
  products$: Observable<IProductResponse[]>;
  public suppliers: ISupplierResponse[] = []; // Array para guardar fornecedores
  isLoading = true; 
  public isGeneratingReport = false; // Flag para o botão de relatório
  
  // Estado para Modal de Edição
  showEditDialog = false;
  editingProduct: IProductResponse | null = null;
  editErrorMessage: string | null = null; 

  // Estado para Modal de Relatório
  isReportModalOpen = false;
  reportForm: FormGroup;
  reportErrorMessage: string | null = null;
  months: { value: number, name: string }[] = [];
  years: number[] = [];

  constructor() {
    // Lógica do products$ e suppliers$
    // 1. Busca fornecedores PRIMEIRO
    this.products$ = this.supplierService.listSuppliers().pipe(
      tap(suppliers => this.suppliers = suppliers), // 2. Armazena os fornecedores na propriedade 'suppliers'
      switchMap(() => this.refreshTrigger$), // 3. Dispara o gatilho de busca de produtos
      switchMap(() => { // 4. Busca os produtos
        this.isLoading = true; 
        return this.productService.listProducts().pipe( 
          catchError((err: HttpErrorResponse) => {
            console.error('Falha ao carregar produtos.', err);
            return of([] as IProductResponse[]); // Retorna array vazio em caso de erro
          }),
          finalize(() => this.isLoading = false) // Garante que o loading termina
        );
      }),
      catchError((err: HttpErrorResponse) => { // 5. Trata erro da busca de FORNECEDORES
        console.error('Falha ao carregar fornecedores.', err);
        this.isLoading = true; 
         // Tenta carregar produtos mesmo assim
         return this.productService.listProducts().pipe( 
          catchError((prodErr: HttpErrorResponse) => {
            console.error('Falha ao carregar produtos após erro de fornecedor.', prodErr);
             return of([] as IProductResponse[]); 
          }),
          finalize(() => this.isLoading = false)
        );
      })
    );

    // Inicializa o formulário do relatório
    const now = new Date();
    this.reportForm = this.fb.group({
      month: [now.getMonth() + 1, [Validators.required]], // Mês atual (1-12)
      year: [now.getFullYear(), [Validators.required]]
    });
    
    // Preenche os selects de data
    this.months = [
      { value: 1, name: 'Janeiro' }, { value: 2, name: 'Fevereiro' }, { value: 3, name: 'Março' },
      { value: 4, name: 'Abril' }, { value: 5, name: 'Maio' }, { value: 6, name: 'Junho' },
      { value: 7, name: 'Julho' }, { value: 8, name: 'Agosto' }, { value: 9, name: 'Setembro' },
      { value: 10, name: 'Outubro' }, { value: 11, name: 'Novembro' }, { value: 12, name: 'Dezembro' }
    ];
    const currentYear = now.getFullYear();
    this.years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4]; 
  }

  ngOnInit(): void {
    // A inscrição no template (com async pipe) já dispara o fluxo do constructor
    // Se não usar async pipe, chame this.refreshTrigger$.next() aqui.
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
        sale === null || sale === undefined || sale <= 0 || sale < purchase) {
      return '- %'; // Retorna '-' se o custo for maior que a venda ou dados inválidos
    }
    try {
      const margin = ((sale - purchase) / sale) * 100; 
      return `${margin % 1 === 0 ? margin.toFixed(0) : margin.toFixed(1)}%`;
    } catch (e) {
      return '- %';
    }
  }

  getSupplierName(supplierId: number | null | undefined): string {
    if (supplierId === null || supplierId === undefined) return 'N/D';
    const supplier = this.suppliers.find(s => s.id === supplierId); 
    return supplier ? supplier.companyName : `ID ${supplierId} não encontrado`;
  }

  // --- Funções do Modal de Edição ---
  
  handleEdit(product: IProductResponse): void {
    this.editingProduct = JSON.parse(JSON.stringify(product)); // Cria cópia profunda
    this.showEditDialog = true;
    this.editErrorMessage = null; 
    this.renderer.addClass(document.body, 'modal-open'); 
  }
  
  handleSaveEdit(): void {
    if (!this.editingProduct) return;

    this.isLoading = true; 
    this.editErrorMessage = null;
    const productId = this.editingProduct.id; 

    // Garante que supplierId seja número (select pode retornar string)
    if (this.editingProduct.supplierId && typeof this.editingProduct.supplierId === 'string') {
        this.editingProduct.supplierId = parseInt(this.editingProduct.supplierId, 10);
    }

    this.productService.updateProduct(productId, this.editingProduct).subscribe({
      next: (updatedProduct) => {
        console.log('Produto atualizado:', updatedProduct);
        this.handleCloseEdit(); 
        this.refreshTrigger$.next(); // Recarrega a lista
        // isLoading será resetado pelo finalize() do observable principal
      },
      error: (err: Error) => {
        console.error('Erro ao atualizar produto:', err);
        this.editErrorMessage = `Erro ao salvar: ${err.message}`; 
        this.isLoading = false; // Para o loading em caso de erro
      }
    });
  }

  handleCloseEdit(): void {
    this.showEditDialog = false;
    this.editingProduct = null;
    this.editErrorMessage = null;
    this.renderer.removeClass(document.body, 'modal-open'); 
    if(this.isLoading) { this.isLoading = false; } // Reseta loading se o usuário cancelar
  }
  
  // --- Função CRUD (Delete) ---

  handleDelete(id: number): void {
    if (confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita e removerá todo o histórico de movimentação (mas não o de vendas).')) {
      this.isLoading = true; 
      this.productService.deleteProduct(id).subscribe({
        next: (response) => {
          console.log(response.message || 'Produto excluído com sucesso.');
          this.refreshTrigger$.next(); // Recarrega a lista
        },
        error: (err: Error) => {
          console.error('Erro ao deletar:', err);
          alert(`Erro ao deletar: ${err.message}`); // Exibe erro (ex: produto com vendas)
          this.isLoading = false; // Para o loading em caso de erro
        }
      });
    }
  }

  // --- Funções do Modal de Relatório ---

  openReportModal(): void {
    this.isReportModalOpen = true;
    this.reportErrorMessage = null;
    this.renderer.addClass(document.body, 'modal-open');
    // Reseta o formulário para o mês/ano atual
    const now = new Date();
    this.reportForm.patchValue({
        month: now.getMonth() + 1,
        year: now.getFullYear()
    });
  }

  closeReportModal(): void {
    this.isReportModalOpen = false;
    this.isGeneratingReport = false; // Garante que reseta o botão
    this.renderer.removeClass(document.body, 'modal-open');
  }

  onGenerateReport(): void {
    if (this.reportForm.invalid) {
      this.reportErrorMessage = 'Por favor, selecione um mês e um ano válidos.';
      return;
    }

    this.isGeneratingReport = true;
    this.reportErrorMessage = null;
    
    const { year, month } = this.reportForm.value;

    this.reportService.downloadStockFinancialReport(year, month).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const monthStr = month.toString().padStart(2, '0');
        link.download = `Fluxa_Relatorio_Vendas_${year}_${monthStr}.pdf`;
        
        document.body.appendChild(link); // Necessário para Firefox
        link.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        this.isGeneratingReport = false;
        this.closeReportModal(); // Fecha o modal após o sucesso
      },
      error: (err: Error) => {
        console.error('Erro ao gerar relatório:', err);
        // Tenta exibir a mensagem de erro específica do backend (lida pelo ReportService)
        this.reportErrorMessage = err.message || 'Erro desconhecido ao gerar o relatório.'; 
        this.isGeneratingReport = false;
      }
    });
  }
}