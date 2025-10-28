import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user'; // Verifique o caminho
import { UserAuthService } from '../../services/user-auth'; // Verifique o caminho
import { Router, RouterLink } from '@angular/router';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
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
   if(this.userForm.invalid) {
       // Opcional: Marcar campos como 'touched' para mostrar erros
       this.userForm.markAllAsTouched();
       return;
   }

   // Limpa erro anterior e inicia loading (opcional)
   this.loginErrorMessage = '';
   // this.isLoading = true; // Se tiver uma flag de loading

   // Acessa os valores do formulário
   const email = this.userForm.get('email')?.value as string;
   const password = this.userForm.get('password')?.value as string;

   // 2. Chama o serviço de login
   this._userService.login(email, password).pipe(take(1)).subscribe({
     next: (response) => {
       // this.isLoading = false; // Para loading

       // 👇 CORREÇÃO APLICADA AQUI 👇
       this._userAuthService.setUserToken(response.token);

       // Redireciona para a tela de produtos
       this._router.navigate(['/products']);
     },
     error: (error: HttpErrorResponse) => { // Tipar o erro ajuda
       // this.isLoading = false; // Para loading
       console.error('Erro de Login:', error);

       // Tenta pegar a mensagem específica do backend
       if (error.error && error.error.message) {
           this.loginErrorMessage = error.error.message;
       } else if (error.status === 0 || error.status === 503) {
           this.loginErrorMessage = 'Erro de conexão com o servidor. Tente novamente mais tarde.';
       } else {
           this.loginErrorMessage = 'Credenciais inválidas ou erro desconhecido.';
       }
     },
   });
  }
}