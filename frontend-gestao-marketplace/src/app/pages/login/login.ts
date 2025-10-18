// src/app/pages/login/login.ts

import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user'; // Verifique o caminho
import { UserAuthService } from '../../services/user-auth'; // Verifique o caminho
import { Router, RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    RouterLink, // Para o link "Cadastre-se"
    CommonModule, // Para usar as diretivas @if
    HttpClientModule // Para permitir o uso do HttpClient no UserService
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginErrorMessage = '';
  
  // Define o FormGroup para o formulário
  userForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  // Injeção de dependências usando `inject`
  private readonly _userService = inject(UserService);
  private readonly _userAuthService = inject(UserAuthService);
  private readonly _router = inject(Router);

  login() {
    // 1. Não prossegue se o formulário for inválido
    if(this.userForm.invalid) return;

    // Acessa os valores do formulário
    const email = this.userForm.get('email')?.value as string;
    const password = this.userForm.get('password')?.value as string;

    // 2. Chama o serviço de login
    this._userService.login(email, password).pipe(take(1)).subscribe({
      next: (response) => {
        this.loginErrorMessage = '';
        
        // Salva o token (assumindo que a resposta tenha 'data.token')
        this._userAuthService.setUserToken(response.data.token);

        // Redireciona para a tela de produtos
        this._router.navigate(['/products']);
      },
      error: (error) => {
        console.error('Erro de Login:', error);
        
        // Exibe mensagem de erro da API
        this.loginErrorMessage = error.error.message || 'Erro de conexão ou credenciais inválidas.';
      },
    });
  }
}