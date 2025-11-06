import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductService, IStockAdjustmentRequest } from '../../services/product';
import { IProductResponse } from '../../interfaces/product-response';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './stock-adjustment.html',
  styleUrls: ['./stock-adjustment.css']
})
export class StockAdjustmentComponent implements OnInit {

  // Injeções
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);

  // Estado
  adjustmentForm: FormGroup;
  isLoading = false; 
  isProductsLoading = true; 
  apiErrorMessage: string | null = null;
  successMessage: string | null = null;
  products$: Observable<IProductResponse[]>; 

  constructor() {
    this.adjustmentForm = this.fb.group({
      productId: [null, [Validators.required]], 
      quantity: [null, [Validators.required, Validators.min(1)]], 
      reason: [''] // Opcional
    });
    this.products$ = of([]); 
  }

  ngOnInit(): void {
    this.isProductsLoading = true;

    this.products$ = this.productService.listActiveProducts().pipe( // <--- MUDANÇA
      catchError(err => {
        // Se a busca falhar (ex: token inválido), mostra o erro
        this.apiErrorMessage = `Erro ao carregar produtos: ${err.message}`;
        return of([]); // Retorna array vazio em caso de erro
      }),
      finalize(() => {
        // Garante que o loading dos produtos termine
        this.isProductsLoading = false;
      })
    );
  }

  // Função chamada ao submeter o formulário
  onSubmit(): void {
    if (this.adjustmentForm.invalid) {
      this.adjustmentForm.markAllAsTouched();
      this.apiErrorMessage = "Formulário inválido. Verifique os campos.";
      this.successMessage = null;
      return;
    }

    this.isLoading = true;
    this.apiErrorMessage = null;
    this.successMessage = null;

    const payload: IStockAdjustmentRequest = {
      productId: Number(this.adjustmentForm.value.productId), 
      quantity: Number(this.adjustmentForm.value.quantity),
      reason: this.adjustmentForm.value.reason || 'Ajuste manual de estoque'
    };

    this.productService.adjustStock(payload)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedProduct) => {
          this.successMessage = `Estoque de "${updatedProduct.title}" atualizado para ${updatedProduct.quantity} unidades!`;
          this.adjustmentForm.get('quantity')?.reset(); 
          
          this.ngOnInit(); 
        },
        error: (err: Error) => {
          this.apiErrorMessage = `Erro ao salvar ajuste: ${err.message}`;
        }
      });
  }
}