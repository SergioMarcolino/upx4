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
    RouterLink, 
    CommonModule, 
    HttpClientModule 
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginErrorMessage = '';
  

  userForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });


  private readonly _userService = inject(UserService);
  private readonly _userAuthService = inject(UserAuthService);
  private readonly _router = inject(Router);

  login() {
 
   if(this.userForm.invalid) {
       this.userForm.markAllAsTouched();
       return;
   }

   this.loginErrorMessage = '';

   const email = this.userForm.get('email')?.value as string;
   const password = this.userForm.get('password')?.value as string;

   // 2. Chama o serviço de login
   this._userService.login(email, password).pipe(take(1)).subscribe({
     next: (response) => {

       this._userAuthService.setUserToken(response.token);

       this._router.navigate(['/products']);
     },
     error: (error: HttpErrorResponse) => { 
       console.error('Erro de Login:', error);

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