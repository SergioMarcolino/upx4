import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IAuthSuccessResponse } from '../interfaces/auth-sucess-response';
import { ILoginSuccessResponse } from '../interfaces/login-success-response';
import { IRegisterPayload } from '../interfaces/register-payload';
import { IProductResponse } from '../interfaces/product-response';
import { map } from 'rxjs/operators';
import { IRegisterResponse } from '../interfaces/register-response';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly _httpClient = inject(HttpClient);

  validateUser(): Observable<IAuthSuccessResponse> {
    return this._httpClient.get<IAuthSuccessResponse>('http://localhost:3000/api/protected');
  }

  login(email: string, password: string): Observable<ILoginSuccessResponse> {
    const body = { email, password };
    return this._httpClient.post<ILoginSuccessResponse>('http://localhost:3000/api/users/login', body);
  }

register(payload: IRegisterPayload): Observable<IRegisterResponse> {
    return this._httpClient.post<IRegisterResponse>('http://localhost:3000/api/users/register', payload);
  }

  listProducts(): Observable<IProductResponse[]> {
    return this._httpClient.get<any>(`http://localhost:3000/api/products`).pipe(
        map(response => response.data as IProductResponse[])
    );
  }


  deleteProduct(id: number): Observable<any> {
    return this._httpClient.delete(`http://localhost:3000/api/products/${id}`);
  }

  updateProduct(id: number, data: Partial<IProductResponse>): Observable<IProductResponse> {
    return this._httpClient.put<IProductResponse>(`http://localhost:3000/api/products/${id}`, data);
  }

  createProduct(payload: Omit<IProductResponse, 'id' | 'status'>): Observable<IProductResponse> {

    return this._httpClient.post<IProductResponse>(`http://localhost:3000/api/products`, payload);
  }
}