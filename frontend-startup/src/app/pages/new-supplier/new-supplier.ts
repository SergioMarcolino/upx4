import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { SupplierService } from '../../services/supplier';
import { ISupplierRequest } from '../../interfaces/supplier-request';

@Component({
  selector: 'app-new-supplier',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    RouterModule 
  ],
  templateUrl: './new-supplier.html', 
  styleUrls: ['./new-supplier.css']   
})
export class NewSupplierComponent {

  // Injeções
  private fb = inject(FormBuilder);
  private supplierService = inject(SupplierService);
  private router = inject(Router);

  // Estado do Componente
  public supplierForm: FormGroup;
  public isLoading = false;
  public apiErrorMessage: string | null = null;
  public successMessage: string | null = null; // Para mensagem de sucesso

  constructor() {
    // Inicializa o formulário reativo
    this.supplierForm = this.fb.group({
      // Adiciona validações
      companyName: ['', [Validators.required, Validators.minLength(3)]],
      // Adiciona validação básica de CNPJ (pode ser melhorada com máscara/validador customizado)
      cnpj: ['', [Validators.required, Validators.pattern(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/)]], 
      contactName: [''], // Opcional
      phone: ['']        // Opcional
    });
  }

  // Função chamada ao submeter o formulário
  onSubmit(): void {
    // Marca todos os campos como 'touched' para exibir erros
    this.supplierForm.markAllAsTouched();

    if (this.supplierForm.invalid) {
      this.apiErrorMessage = "Por favor, preencha os campos obrigatórios corretamente.";
      this.successMessage = null;
      // Foca no primeiro campo inválido
      const firstInvalidControl = document.querySelector('form .ng-invalid');
      if (firstInvalidControl) {
        (firstInvalidControl as HTMLElement).focus();
      }
      return;
    }

    this.isLoading = true;
    this.apiErrorMessage = null;
    this.successMessage = null;

    // Pega os valores do formulário como ISupplierRequest
    const formValue: ISupplierRequest = this.supplierForm.value;

    this.supplierService.createSupplier(formValue)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (newSupplier) => {
          this.successMessage = `Fornecedor "${newSupplier.companyName}" cadastrado com sucesso!`;
          this.supplierForm.reset(); 

        },
        error: (err) => {
          this.apiErrorMessage = `Erro ao cadastrar: ${err.message}`;
          console.error(err);
        }
      });
  }
}