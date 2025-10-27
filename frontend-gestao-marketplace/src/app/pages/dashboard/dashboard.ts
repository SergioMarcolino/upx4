// Em src/app/pages/dashboard/dashboard.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Para possíveis links
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

// Serviços e Interfaces
import { ProductService } from '../../services/product';
import { SaleService } from '../../services/sale'; // Precisamos de um método para LISTAR vendas
import { SupplierService } from '../../services/supplier';
import { IProductResponse } from '../../interfaces/product-response';
import { SaleResponse } from '../../interfaces/sale-response'; // Interface de Venda (precisa buscar todas)
import { ISupplierResponse } from '../../interfaces/supplier-response';

// Interface para guardar os totais calculados
interface DashboardTotals {
  totalRevenue: number;
  totalCostOfGoods: number;
  grossProfit: number;
  productCount: number;
  totalStockValueCost: number;
  totalStockValueSale: number;
  lowStockCount: number;
  outOfStockCount: number;
  supplierCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  // Injeções
  private productService = inject(ProductService);
  private saleService = inject(SaleService); // Assumindo que terá um 'listSales'
  private supplierService = inject(SupplierService);

  // Estado
  isLoading = true;
  errorMessage: string | null = null;
  totals: DashboardTotals | null = null;

  // Limite para considerar estoque baixo
  readonly LOW_STOCK_THRESHOLD = 10;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Carrega todos os dados necessários (produtos, vendas, fornecedores)
   * e calcula os totais.
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.totals = null;

    // TODO: Adicionar um método `listSales()` ao seu SaleService no frontend
    // que chama um endpoint GET /api/sales no backend (que precisa ser criado).
    // Por enquanto, vamos simular com um array vazio.
    const listSalesObservable = of([] as SaleResponse[]); // Simulação
    // const listSalesObservable = this.saleService.listSales().pipe(catchError(() => of([])));

    forkJoin({
      products: this.productService.listProducts().pipe(catchError(() => of([] as IProductResponse[]))),
      sales: listSalesObservable,
      suppliers: this.supplierService.listSuppliers().pipe(catchError(() => of([] as ISupplierResponse[])))
    })
    .pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: (results) => {
        if (!results.products && !results.sales && !results.suppliers) {
           this.errorMessage = "Falha ao carregar todos os dados do dashboard.";
           return;
        }
        this.calculateTotals(results.products || [], results.sales || [], results.suppliers || []);
      },
      error: (err) => {
        console.error("Erro ao carregar dados do dashboard:", err);
        this.errorMessage = "Erro geral ao carregar dados do dashboard.";
      }
    });
  }

  /**
   * Calcula as métricas do dashboard a partir dos dados brutos.
   */
  calculateTotals(products: IProductResponse[], sales: SaleResponse[], suppliers: ISupplierResponse[]): void {
    let totalRevenue = 0;
    let totalCostOfGoods = 0;
    let productCount = products.length;
    let totalStockValueCost = 0;
    let totalStockValueSale = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let supplierCount = suppliers.length;

    // Calcular totais de vendas e custos das vendas
    // (Precisa buscar TODAS as vendas - pode ser ineficiente)
    sales.forEach(sale => {
      totalRevenue += sale.totalAmount;
      sale.items.forEach(item => {
        // Usa o custo congelado no item da venda
        totalCostOfGoods += (item.costPerUnit * item.quantitySold);
      });
    });

    // Calcular totais de estoque
    products.forEach(product => {
       // Só considera estoque de produtos "anunciados"
       if(product.status === 'anunciado'){
            const currentStock = product.quantity >= 0 ? product.quantity : 0; // Trata estoque negativo como 0 para valor
            totalStockValueCost += (product.purchase_price * currentStock);
            totalStockValueSale += (product.sale_price * currentStock);

            if (product.quantity <= 0) {
              outOfStockCount++;
            } else if (product.quantity <= this.LOW_STOCK_THRESHOLD) {
              lowStockCount++;
            }
       }
    });

    const grossProfit = totalRevenue - totalCostOfGoods;

    this.totals = {
      totalRevenue,
      totalCostOfGoods,
      grossProfit,
      productCount,
      totalStockValueCost,
      totalStockValueSale,
      lowStockCount,
      outOfStockCount,
      supplierCount
    };
  }
}