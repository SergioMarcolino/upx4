import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { CommonModule, NgClass, DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms'; 

// Seus serviços e interfaces
import { ProductService } from '../../services/product'; 
import { IProductResponse } from '../../interfaces/product-response'; 
import { SupplierService } from '../../services/supplier'; 
import { ISupplierResponse } from '../../interfaces/supplier-response'; 
import { ReportService } from '../../services/report';

import { Observable, BehaviorSubject, switchMap, catchError, of, finalize, tap, combineLatest, startWith } from 'rxjs'; 
import { map } from 'rxjs/operators';
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
  	FormsModule,
  	ReactiveFormsModule
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
  public suppliers$: Observable<ISupplierResponse[]>;
  private allProducts$: Observable<IProductResponse[]>;
  public filteredProducts$: Observable<IProductResponse[]>;
  public suppliers: ISupplierResponse[] = [];
  isLoading = true; 
  
  // Controles de Filtro
  public searchTerm = new FormControl('');
  public supplierFilter = new FormControl<number | null>(null);
  
  // --- Estado para Modal de Edição ---
  public isEditModalOpen = false;
  public isClosing = false;
  public editingProduct: IProductResponse | null = null;
  public apiEditErrorMessage: string | null = null;
  public editProductForm: FormGroup;
  public isSaving = false;

  // --- Estado para Modal de Relatório ---
  public isReportModalOpen = false;
  public isReportModalClosing = false; // Flag de animação de saída
  public reportForm: FormGroup;
  public reportErrorMessage: string | null = null;
  public isGeneratingReport = false;
  public months: { value: number, name: string }[] = [];
  public years: number[] = [];

  constructor() {
    // Lógica de Dados (Filtros e Produtos)
    this.suppliers$ = this.supplierService.listSuppliers().pipe(
      tap(suppliers => {
        this.suppliers = suppliers;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Falha ao carregar fornecedores.', err);
        return of([] as ISupplierResponse[]); 
      })
    );

    this.allProducts$ = this.refreshTrigger$.pipe(
      switchMap(() => {
        this.isLoading = true;
        return this.productService.listProducts().pipe(
          catchError((err: HttpErrorResponse) => {
            console.error('Falha ao carregar produtos.', err);
            return of([] as IProductResponse[]);
          }),
          finalize(() => this.isLoading = false)
        );
      })
    );

    this.filteredProducts$ = combineLatest([
      this.allProducts$,
      this.searchTerm.valueChanges.pipe(startWith('')),
      this.supplierFilter.valueChanges.pipe(startWith(null))
    ]).pipe(
      map(([products, searchTerm, supplierId]) => {
        let filtered = products;
        const term = (searchTerm || '').toLowerCase();
        
        if (term) {
          filtered = filtered.filter(p => p.title.toLowerCase().includes(term));
        }
        if (supplierId) {
          filtered = filtered.filter(p => p.supplierId === supplierId);
        }
        return filtered;
      })
    );

    // Inicializa o formulário do relatório
  	const now = new Date();
  	this.reportForm = this.fb.group({
  	  month: [now.getMonth() + 1, [Validators.required]],
  	  year: [now.getFullYear(), [Validators.required]]
  	});

    // Inicializa o formulário de EDIÇÃO
    this.editProductForm = this.fb.group({
      title: ['', [Validators.required]],
      category: ['', [Validators.required]],
      purchase_price: [null, [Validators.required, Validators.min(0.01)]],
      sale_price: [null, [Validators.required, Validators.min(0.01)]],
      supplierId: [null, [Validators.required]],
      description: ['', [Validators.required]],
      imageBase64: ['']
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
  	this.refreshTrigger$.next();
  }

  // --- Funções Auxiliares de Formatação ---
  
  calculateMargin(product: IProductResponse): string {
    const sale = product.sale_price;
    const purchase = product.purchase_price;

  	if (purchase === null || purchase === undefined || purchase <= 0 || 
  		  sale === null || sale === undefined || sale <= 0 || sale < purchase) {
  	  return '-';
  	}
  	try {
  	  const margin = ((sale - purchase) / sale) * 100; 
  	  return `${margin % 1 === 0 ? margin.toFixed(0) : margin.toFixed(1)}`;
  	} catch (e) {
  	  return '-';
  	}
  }

  getSupplierName(supplierId: number | null | undefined): string {
  	if (supplierId === null || supplierId === undefined) return 'N/D';
  	const supplier = this.suppliers.find(s => s.id === supplierId); 
  	return supplier ? supplier.companyName : `ID ${supplierId} não encontrado`;
  }

  // --- Funções do Modal de Edição ---
  
  openEditModal(product: IProductResponse): void {
  	this.editingProduct = product;
    this.editProductForm.patchValue(product);
  	this.isClosing = false; 
    this.isEditModalOpen = true; 
  	this.apiEditErrorMessage = null; 
  	this.renderer.addClass(document.body, 'modal-open'); 
  }
  
  handleSaveEdit(): void {
  	if (this.editProductForm.invalid || !this.editingProduct) {
      this.editProductForm.markAllAsTouched();
      return;
    }

  	this.isSaving = true; 
  	this.apiEditErrorMessage = null;
  	const productId = this.editingProduct.id; 
    const formValues = this.editProductForm.value; 

    if (formValues.supplierId && typeof formValues.supplierId === 'string') {
        formValues.supplierId = parseInt(formValues.supplierId, 10);
    }

  	this.productService.updateProduct(productId, formValues).subscribe({
  	  next: (updatedProduct) => {
  		console.log('Produto atualizado:', updatedProduct);
  		this.closeEditModal(); 
  		this.refreshTrigger$.next(); 
  	  },
  	  error: (err: Error) => {
  		console.error('Erro ao atualizar produto:', err);
  		this.apiEditErrorMessage = `Erro ao salvar: ${err.message}`; 
  		this.isSaving = false;
  	  }
  	});
  }

  closeEditModal(): void {
    if (this.isClosing) return;
    this.isClosing = true;

    setTimeout(() => {
      this.isEditModalOpen = false; 
      this.isClosing = false;
      
      this.editingProduct = null;
      this.apiEditErrorMessage = null;
      this.renderer.removeClass(document.body, 'modal-open');
      this.editProductForm.reset();
      this.isSaving = false;
    }, 300); 
  }
  
  // --- Função CRUD (Delete) ---

  handleDelete(id: number): void {
  	if (confirm('Tem certeza que deseja excluir este produto?')) {
  	  this.isLoading = true;
  	  this.productService.deleteProduct(id).subscribe({
  		next: (response) => {
  		  console.log(response.message || 'Produto excluído com sucesso.');
  		  this.refreshTrigger$.next();
  		},
  		error: (err: Error) => {
  		  console.error('Erro ao deletar:', err);
  		  alert(`Erro ao deletar: ${err.message}`); 
  		  this.isLoading = false; 
  		}
  	  });
  	}
  }

  // --- Funções do Modal de Relatório (com animação de saída) ---

  openReportModal(): void {
    this.isReportModalClosing = false; // Reseta a flag de saída
  	this.isReportModalOpen = true;
  	this.reportErrorMessage = null;
  	this.renderer.addClass(document.body, 'modal-open');
  	const now = new Date();
  	this.reportForm.patchValue({
  		month: now.getMonth() + 1,
  		year: now.getFullYear()
  	});
  }

  closeReportModal(): void {
    if (this.isReportModalClosing) return; // Previne cliques múltiplos
    this.isReportModalClosing = true; // Inicia a animação de saída

    setTimeout(() => {
    	this.isReportModalOpen = false;
      this.isReportModalClosing = false; // Reseta a flag
    	this.isGeneratingReport = false; // Garante que reseta o botão
    	this.renderer.removeClass(document.body, 'modal-open');
    }, 300); // 300ms = tempo da animação
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
  		
  		document.body.appendChild(link);
  		link.click();
  		
  		window.URL.revokeObjectURL(url);
  		document.body.removeChild(link);
  		
  		this.isGeneratingReport = false;
  		this.closeReportModal(); // Fecha o modal com a nova animação
  	  },
  	  error: (err: Error) => {
  		console.error('Erro ao gerar relatório:', err);
  		this.reportErrorMessage = err.message || 'Erro desconhecido ao gerar o relatório.'; 
  		this.isGeneratingReport = false;
  	  }
  	});
  }
}