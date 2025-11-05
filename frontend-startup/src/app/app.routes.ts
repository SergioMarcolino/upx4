import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Layout } from './pages/layout/layout';
import { NewProductComponent } from './pages/new-product/new-product';
import { authGuard } from './guards/auth-guards';
import { Register } from './pages/register/register';
import { ProductsComponent } from './pages/products/products';
import { SalesComponent } from './pages/sales/sales';
import { NewSupplierComponent} from './pages/new-supplier/new-supplier';
import { SupplierListComponent } from './pages/supplier-list/supplier-list';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { LandingComponent } from './pages/landing/landing';
import { StockAdjustmentComponent } from './pages/stock-adjustment/stock-adjustment'; 

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
    component: LandingComponent,
    pathMatch: 'full'
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
      { path: 'new-supplier', 
        component: NewSupplierComponent 
      },
      { path: 'suppliers', 
        component: SupplierListComponent
       },
      {
        path: 'new-product',
        component:  NewProductComponent,
      },
      { path: 'dashboard',
    component: DashboardComponent 
    },
    { path: 'adjustment', 
      component: StockAdjustmentComponent 
    },
    {
    path: 'vendas',
    component: SalesComponent,
  },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  }
];