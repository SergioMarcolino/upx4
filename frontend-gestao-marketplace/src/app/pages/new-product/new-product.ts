// src/app/pages/new-product/new-product.component.ts

import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user'; // Ajuste o caminho conforme a sua estrutura
import { take } from 'rxjs';
import { IProductResponse } from '../../interfaces/product-response'; // Sua interface de produto completa
import { HttpErrorResponse } from '@angular/common/http'; // Para tipagem de erro

// Tipo auxiliar para o payload de criação 
type NewProductPayload = Omit<IProductResponse, 'id' | 'status'>; 

@Component({
  selector: 'app-new-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './new-product.html',
  styleUrls: ['./new-product.css']
})
export class NewProductComponent {
  
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);
  
  public apiErrorMessage: string = '';
  
  private defaultDate = new Date().toISOString().substring(0, 10); 
  
  productForm = new FormGroup({
    // Strings obrigatórias:
    title: new FormControl('', [Validators.required]),
    supplier: new FormControl('', [Validators.required]),
    // Usamos null para que o validador 'required' no select funcione melhor
    category: new FormControl(null as any, [Validators.required]), 
    description: new FormControl('', [Validators.required]),
    imageBase64: new FormControl('', [Validators.required]), 
    
    // Números (validados para serem > 0)
    purchase_price: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    sale_price: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    quantity: new FormControl(0, [Validators.required, Validators.min(1)]),
    
    // Data (usando o valor padrão formatado)
    date: new FormControl(this.defaultDate, [Validators.required]),
  });
  
  /**
   * Converte o arquivo selecionado para uma string Base64 e atualiza o FormControl.
   */
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.apiErrorMessage = ''; 
      const reader = new FileReader();
      
      reader.onload = () => {
        this.productForm.get('imageBase64')?.setValue(reader.result as string);
        console.log("Base64 gerada. Tamanho:", (reader.result as string).length);
      };
      
      reader.onerror = () => {
        this.apiErrorMessage = 'Erro ao ler arquivo. Tente um arquivo menor.';
      };
      
      reader.readAsDataURL(file);
    }
  }

  createProduct() {
    // 1. Verifica a validade do formulário no Front-end
    if (this.productForm.invalid) {
      console.error("Formulário inválido no Front-end.");
      this.productForm.markAllAsTouched(); 
      this.apiErrorMessage = 'Preencha todos os campos corretamente.';
      return;
    }
    
    // 2. Limpeza e Asserção de tipo no payload
    
    // Filtra para remover a data (se gerada no backend) e strings vazias, enviando null.
    const cleanedPayload = Object.fromEntries(
      Object.entries(this.productForm.value).filter(([key, value]) => {
        // Remove 'date' (assumindo que o backend a gera)
        if (key === 'date') return false; 
        // Remove strings vazias para evitar a validação rigorosa do Express
        if (typeof value === 'string' && value.trim() === '') return false;
        return true;
      })
    );
    
    // 3. Chamada à API de criação
    // 🎯 CORREÇÃO: Usamos 'as any' no envio para resolver o erro de tipagem estrutural do subscribe.
    this._userService.createProduct(cleanedPayload as any).pipe(take(1)).subscribe({
        next: () => {
            this.apiErrorMessage = '';
            alert('Produto adicionado com sucesso!');
            this._router.navigate(['/products']);
        },
        error: (err: HttpErrorResponse) => {
            console.error('Erro ao criar produto:', err);
            
            const apiMessage = err.error?.message || err.statusText || 'Erro desconhecido ao comunicar com a API.';
            this.apiErrorMessage = apiMessage;
            alert(`Falha no Cadastro: ${apiMessage}`);
        }
    });
  }
}