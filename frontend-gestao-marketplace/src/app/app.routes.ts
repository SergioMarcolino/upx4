import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Layout } from './pages/layout/layout';
import { NewProductComponent } from './pages/new-product/new-product';
import { authGuard } from './guards/auth-guards';
import { Register } from './pages/register/register';
import { ProductsComponent } from './pages/products/products';


export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
   {
    path: 'register',
    component: Register,
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '',
    component: Layout,
    canActivateChild: [authGuard],
    children: [
      {
        path: 'products',
        component: ProductsComponent,
      },
      {
        path: 'new-product',
        component:  NewProductComponent,
      }
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  }
];