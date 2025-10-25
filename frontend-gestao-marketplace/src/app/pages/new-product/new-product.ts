// Em src/app/pages/new-product/new-product.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of, finalize, catchError } from 'rxjs';

// Seus Serviços e Interfaces
import { ProductService } from '../../services/product'; // Importa IProductRequest
import { SupplierService } from '../../services/supplier';
import { ISupplierResponse } from '../../interfaces/supplier-response';
import { IProductRequest } from '../../interfaces/product-request'; // Correto

@Component({
  selector: 'app-new-product',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  providers: [DatePipe],
  templateUrl: './new-product.html',
  styleUrls: ['./new-product.css']
})
export class NewProductComponent implements OnInit {

  // Injeções
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private supplierService = inject(SupplierService); // Injetar SupplierService
  private router = inject(Router);
  private datePipe = inject(DatePipe);

  // Estado do Componente
  public productForm: FormGroup;
  public suppliers$: Observable<ISupplierResponse[]> = of([]); // Observable para suppliers
  public isEditing = false;
  private currentProductId: number | null = null;
  public pageTitle = "Adicionar Produto";
  public isLoading = false;
  public apiErrorMessage: string | null = null;

  constructor() {
    // Inicializa o formulário reativo com supplierId
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      supplierId: [null, [Validators.required]], // Alterado para supplierId
      category: ['', [Validators.required]],
      purchase_price: [null, [Validators.required, Validators.min(0)]],
      sale_price: [null, [Validators.required, Validators.min(0)]],
      quantity: [null, [Validators.required, Validators.min(0)]],
      date: ['', [Validators.required]], // Validação de data
      description: ['', [Validators.required, Validators.minLength(10)]],
      imageBase64: ['', [Validators.required]] // Imagem é obrigatória inicialmente
    });
  }

  ngOnInit(): void {
    // Carrega a lista de fornecedores para o dropdown
    this.loadSuppliers();

    // Verifica se há um ID na URL para determinar se é edição
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      // --- MODO DE EDIÇÃO ---
      this.isEditing = true;
      this.currentProductId = +idParam;
      this.pageTitle = "Editar Produto";
      this.isLoading = true;

      // Desabilita o campo quantidade na edição
      this.productForm.get('quantity')?.disable();
       // Na edição, a imagem não é mais obrigatória para alterar
       this.productForm.get('imageBase64')?.setValidators(null);
       this.productForm.get('imageBase64')?.updateValueAndValidity();

      // Busca os dados do produto pelo ID
      this.productService.getProductById(this.currentProductId)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (product) => { // API retorna o produto diretamente
            // Formata a data antes de preencher o formulário
            const formattedDate = this.datePipe.transform(product.date, 'yyyy-MM-dd');
            // Preenche o formulário (incluindo supplierId)
            this.productForm.patchValue({ ...product, date: formattedDate });
          },
          error: (err) => {
            this.apiErrorMessage = `Erro ao carregar produto para edição: ${err.message}`;
            console.error(err);
             // Redireciona ou mostra erro mais grave
            this.router.navigate(['/products']);
          }
        });

    } else {
      // --- MODO DE CRIAÇÃO ---
      this.isEditing = false;
      this.pageTitle = "Adicionar Produto";
      // Formata a data atual para preencher o campo 'date'
      this.productForm.patchValue({ date: this.datePipe.transform(new Date(), 'yyyy-MM-dd') });
      // Habilita quantidade (caso tenha sido desabilitado antes)
      this.productForm.get('quantity')?.enable();
      // Garante que imagem seja obrigatória
      this.productForm.get('imageBase64')?.setValidators([Validators.required]);
      this.productForm.get('imageBase64')?.updateValueAndValidity();
    }
  }

  // Carrega fornecedores
  loadSuppliers(): void {
      this.suppliers$ = this.supplierService.listSuppliers().pipe(
        catchError(err => {
          this.apiErrorMessage = "Erro crítico ao carregar fornecedores. Verifique a API e o login.";
          console.error(err);
          return of([]); // Retorna vazio em caso de erro
        })
      );
  }

  // Função chamada ao selecionar um arquivo de imagem
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
       // Validação simples de tipo e tamanho (ex: max 2MB)
      if (!['image/png', 'image/jpeg'].includes(file.type)) {
         this.apiErrorMessage = 'Formato de imagem inválido. Use PNG ou JPG.';
         fileInput.value = ''; // Limpa o input
         this.productForm.patchValue({ imageBase64: '' });
         this.productForm.get('imageBase64')?.markAsDirty();
         this.productForm.get('imageBase64')?.updateValueAndValidity();
         return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB
         this.apiErrorMessage = 'Imagem muito grande. O tamanho máximo é 2MB.';
         fileInput.value = ''; // Limpa o input
         this.productForm.patchValue({ imageBase64: '' });
         this.productForm.get('imageBase64')?.markAsDirty();
         this.productForm.get('imageBase64')?.updateValueAndValidity();
         return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.productForm.patchValue({ imageBase64: reader.result as string });
        this.productForm.get('imageBase64')?.markAsDirty();
        this.productForm.get('imageBase64')?.updateValueAndValidity();
        this.apiErrorMessage = null; // Limpa erro se a leitura for ok
      };
      reader.onerror = (error) => {
         this.apiErrorMessage = 'Erro ao ler a imagem.';
         console.error('FileReader error: ', error);
      };
      reader.readAsDataURL(file);
    } else {
      // Limpa o campo se nenhum arquivo for selecionado
      // Só limpa se for obrigatório (modo criação)
      if(!this.isEditing) {
        this.productForm.patchValue({ imageBase64: '' });
        this.productForm.get('imageBase64')?.markAsDirty();
        this.productForm.get('imageBase64')?.updateValueAndValidity();
      }
    }
  }

  // Função chamada ao submeter o formulário
  onSubmit(): void {
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      this.apiErrorMessage = "Por favor, preencha todos os campos obrigatórios corretamente.";
      // Foca no primeiro campo inválido (melhora UX)
      const firstInvalidControl = document.querySelector('form .ng-invalid');
      if (firstInvalidControl) {
        (firstInvalidControl as HTMLElement).focus();
      }
      return;
    }

    this.isLoading = true;
    this.apiErrorMessage = null;

    // Pega os valores do formulário (incluindo desabilitados como 'quantity' na edição)
    const formValue = this.productForm.getRawValue();

    if (this.isEditing && this.currentProductId) {
      // --- LÓGICA DE UPDATE ---
      // O ProductService já remove 'quantity'
      this.productService.updateProduct(this.currentProductId, formValue)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.router.navigate(['/products']); // Volta para a lista
          },
          error: (err) => {
            this.apiErrorMessage = `Erro ao atualizar: ${err.message}`;
            console.error(err);
          }
        });

    } else {
      // --- LÓGICA DE CREATE ---
      // O payload deve corresponder a IProductRequest
      const createPayload: IProductRequest = formValue;

      this.productService.createProduct(createPayload)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.router.navigate(['/products']); // Volta para a lista
          },
          error: (err) => {
            this.apiErrorMessage = `Erro ao criar: ${err.message}`;
            console.error(err);
          }
        });
    }
  }
}