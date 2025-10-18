// src/app/pages/register/register.ts

import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService } from '../../services/user'; 
import { Router, RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';
import { IRegisterPayload } from '../../interfaces/register-payload';
import { HttpErrorResponse } from '@angular/common/http'; // 👈 Adicionado para tipagem de erro

// ** FUNÇÃO DE VALIDAÇÃO CUSTOMIZADA **
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  if (!password || !confirmPassword) {
    return null;
  }
  
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
};


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    RouterLink, 
    CommonModule, 
    HttpClientModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerErrorMessage = '';
  
  userForm = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required]),
  }, { validators: passwordMatchValidator }); // 👈 Aplica o validador aqui

  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);

  register() {
    // 2. Verifica a validade geral do formulário (incluindo a checagem das senhas)
    if (this.userForm.invalid) return;

    // 🎯 CORREÇÃO: Usa o 'as' para fazer a asserção de tipo no valor do formulário
    const payload = this.userForm.value as IRegisterPayload;
    
    // 3. Chama o serviço de registro usando o objeto payload tipado
    this._userService.register(payload).pipe(take(1)).subscribe({
      next: () => {
        this.registerErrorMessage = '';
        
        // Em caso de sucesso, redireciona o usuário para a página de login
        this._router.navigate(['/login']);
      },
      // CORREÇÃO: Adicionamos a tipagem explícita para o objeto 'error'
      error: (error: HttpErrorResponse) => { 
        console.error('Erro de Cadastro:', error);
        // Lógica para obter a mensagem de erro da API
        this.registerErrorMessage = error.error?.message || 'Erro ao tentar cadastrar usuário.';
      },
    });
  }
}