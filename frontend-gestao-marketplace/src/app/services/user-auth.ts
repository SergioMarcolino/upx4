// src/app/services/user-auth.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {

  // Chave usada no LocalStorage
  private readonly TOKEN_KEY = 'auth-token'; 

  /**
   * Obtém o token armazenado.
   * @returns O token ou uma string vazia se não existir.
   */
  getUserToken(): string {
    return localStorage.getItem(this.TOKEN_KEY) || '';
  }

  /**
   * Armazena o token no LocalStorage.
   * @param token O token JWT a ser armazenado.
   */
  setUserToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Remove o token do LocalStorage (usado no logout).
   */
  removeUserToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Verifica se o usuário está logado (possui token válido).
   * @returns true se o token existir e não for vazio.
   */
  isLoggedIn(): boolean {
    return !!this.getUserToken();
  }
}