import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts'; 
import { ChartConfiguration, ChartData, ChartType, TooltipItem } from 'chart.js'; 
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import {
  format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isWithinInterval, eachDayOfInterval, eachMonthOfInterval

} from 'date-fns';
import { ptBR } from 'date-fns/locale'; 

// Serviços e Interfaces
import { ProductService } from '../../services/product';
import { SaleService } from '../../services/sale';
import { SupplierService } from '../../services/supplier';
import { IProductResponse } from '../../interfaces/product-response';
import { SaleResponse } from '../../interfaces/sale-response'; // Interface de Venda Individual
import { ISupplierResponse } from '../../interfaces/supplier-response';

// Importa o componente de card reutilizável
import { DashboardCardComponent } from '../../components/dashboard-card/dashboard-card';

// Interface interna para guardar os totais calculados
interface DashboardTotals {
  totalRevenue: number;
  totalCostOfGoods: number;
  grossProfit: number;
  productCount: number;
  activeProductCount: number;
  totalStockValueCost: number;
  totalStockValueSale: number;
  lowStockCount: number;
  outOfStockCount: number;
  supplierCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    DashboardCardComponent, 
    BaseChartDirective    
  ],

  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  // Injeções
  private productService = inject(ProductService);
  private saleService = inject(SaleService);
  private supplierService = inject(SupplierService);

  // Estado
  isLoading = true;
  errorMessage: string | null = null;
  totals: DashboardTotals | null = null;
  private allSalesData: SaleResponse[] = []; 
  private allProductsData: IProductResponse[] = []; 

  // Limite para estoque baixo
  readonly LOW_STOCK_THRESHOLD = 10;

  // --- Estado do Filtro de Período (Unificado) ---
  public selectedPeriod: 'day' | 'month' | 'year' = 'month';

  // --- Configurações dos Gráficos ---

  // Gráfico 1: Produtos por Categoria (Pizza)
  public pieChartOptions: ChartConfiguration['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: { callbacks: { label: (context: any) => {
              const label = context.label || '';
              const value = (typeof context.parsed === 'number' ? context.parsed : 0);
              let sum = 0;
              if (context.dataset && context.dataset.data) {
                  sum = context.dataset.data.reduce((a: any, b: any) => ((typeof a === 'number'?a:0) + (typeof b === 'number'?b:0)), 0);
              }
              const percentage = sum > 0 ? ((value / sum) * 100).toFixed(1) + '%' : '0%';
              return `${label}: ${value} (${percentage})`;
         },}}
      },
  };
  public pieChartData: ChartData<'pie', number[], string | string[]> = { labels: [], datasets: [{ data: [], backgroundColor: [ 'rgba(54, 162, 235, 0.8)', 'rgba(75, 192, 192, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(201, 203, 207, 0.8)' ], borderColor: '#fff' }] };
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;

  // Gráfico 2: Valor do Estoque (Custo) por Categoria (Barras)
  public barChartOptions: ChartConfiguration['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { autoSkip: true, maxRotation: 0 } },
        y: { beginAtZero: true, ticks: { callback: (value) => typeof value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits:0 }).format(value) : value }}
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (context: any) => {
             let label = context.dataset.label || '';
             if (label) { label += ': '; }
             const valueY = context.parsed?.y;
             if (typeof valueY === 'number') {
                 label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueY);
             }
             return label;
         },}}
      },
  };
  public barChartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: 'Valor Estoque (Custo)', backgroundColor: 'rgba(153, 102, 255, 0.6)', borderColor: 'rgba(153, 102, 255, 1)', borderWidth: 1 }] }; // Cor Roxa
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;

  // Gráfico 3: Lucro Bruto por Período (Linha)
   public profitChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { ticks: { autoSkip: true, maxTicksLimit: 15, maxRotation: 0 } },
      y: { beginAtZero: true, ticks: { callback: (value) => typeof value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : value } }
    },
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { callbacks: { label: (context: any) => {
           let label = context.dataset.label || '';
           if (label) { label += ': '; }
           const valueY = context.parsed?.y;
           if (typeof valueY === 'number') {
               label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueY);
           }
           return label;
       },}}
    },
  };
   public profitChartData: ChartData<'line'> = { labels: [], datasets: [ { data: [], label: 'Lucro Bruto', borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)', tension: 0.1, fill: true } ] };
   public profitChartType: ChartType = 'line';
   public profitChartLegend = true;

  // Gráfico 4: Receita Bruta por Período (Linha)
   public revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { x: { ticks: { autoSkip: true, maxTicksLimit: 15, maxRotation: 0 } }, y: { beginAtZero: true, ticks: { callback: (value) => typeof value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : value } } },
    plugins: { legend: { display: true, position: 'top' }, tooltip: { callbacks: { label: (context: any) => {
           let label = context.dataset.label || ''; if (label) { label += ': '; } const valueY = context.parsed?.y; if (typeof valueY === 'number') { label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueY); } return label;
       }}}
    },
   };
   public revenueChartData: ChartData<'line'> = { labels: [], datasets: [ { data: [], label: 'Receita Bruta', borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.2)', tension: 0.1, fill: true } ] };
   public revenueChartType: ChartType = 'line';
   public revenueChartLegend = true;

  // Gráfico 5: Top 5 Produtos Mais Vendidos (Quantidade) (Barras Horizontais)
  public topProductsChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y', // Barras Horizontais
    responsive: true, maintainAspectRatio: false,
    scales: { x: { beginAtZero: true, title: { display: true, text: 'Quantidade Vendida (Este Mês)' } }, y: { ticks: { autoSkip: false } } },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context: any) => {
           let label = context.dataset.label || ''; if (label) { label += ': '; } const valueX = context.parsed?.x; if (typeof valueX === 'number') { label += `${valueX} unid.`; } return label;
       }}}
    },
  };
   public topProductsChartData: ChartData<'bar'> = { labels: [], datasets: [ { data: [], label: 'Qtd Vendida', backgroundColor: 'rgba(255, 159, 64, 0.6)', borderColor: 'rgba(255, 159, 64, 1)', borderWidth: 1 } ] };
  public topProductsChartType: ChartType = 'bar';

  // --- Fim Configurações dos Gráficos ---

  constructor() {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true; this.errorMessage = null; this.totals = null; this.allSalesData = []; this.allProductsData = [];

    const products$ = this.productService.listProducts().pipe(catchError(err => this.handleDataLoadError(err, 'produtos')));
    const sales$ = this.saleService.listSales().pipe(catchError(err => this.handleDataLoadError(err, 'vendas')));
    const suppliers$ = this.supplierService.listSuppliers().pipe(catchError(err => this.handleDataLoadError(err, 'fornecedores')));

    forkJoin({ products: products$, sales: sales$, suppliers: suppliers$ })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (results) => {
          this.allSalesData = results.sales;
          this.allProductsData = results.products;
          this.calculateTotals(results.products, results.sales, results.suppliers);
          this.updateTimeCharts(); // Atualiza gráficos de Lucro e Receita
          this.updateTopProductsChart(); // Atualiza gráfico Top Produtos
        },
        error: (err) => {
          console.error("Erro inesperado no forkJoin do dashboard:", err);
          this.errorMessage = "Erro geral ao carregar dados do dashboard.";
        }
      });
  }

  calculateTotals(products: IProductResponse[], sales: SaleResponse[], suppliers: ISupplierResponse[]): void {
    let totalRevenue = 0, totalCostOfGoods = 0, productCount = products.length, activeProductCount = 0;
    let totalStockValueCost = 0, totalStockValueSale = 0, lowStockCount = 0, outOfStockCount = 0;
    let supplierCount = suppliers.length;

    sales.forEach(sale => {
      totalRevenue += sale.totalAmount;
      if (sale.items) {
          sale.items.forEach(item => { totalCostOfGoods += (item.costPerUnit * item.quantitySold); });
      }
    });

    const categoryCounts: { [key: string]: number } = {};
    const categoryStockValue: { [key: string]: number } = {};

    products.forEach(product => {
      const category = product.category || 'Sem Categoria';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

       if(product.status === 'anunciado'){
            activeProductCount++;
            const stockForValueCalc = Math.max(product.quantity, 0);
            totalStockValueCost += (product.purchase_price * stockForValueCalc);
            totalStockValueSale += (product.sale_price * stockForValueCalc);
            categoryStockValue[category] = (categoryStockValue[category] || 0) + (product.purchase_price * stockForValueCalc);

            if (product.quantity <= 0) { outOfStockCount++; }
            else if (product.quantity <= this.LOW_STOCK_THRESHOLD) { lowStockCount++; }
       }
    });

    const grossProfit = totalRevenue - totalCostOfGoods;

    this.totals = {
      totalRevenue, totalCostOfGoods, grossProfit, productCount,
      activeProductCount, totalStockValueCost, totalStockValueSale,
      lowStockCount, outOfStockCount, supplierCount
    };

    this.updateCategoryCharts(categoryCounts, categoryStockValue);
  }

  /** Atualiza APENAS os gráficos de categoria (pizza e barra) */
  updateCategoryCharts(categoryCounts: { [key: string]: number }, categoryStockValue: { [key: string]: number }): void {
      this.pieChartData = {
        labels: Object.keys(categoryCounts),
        datasets: [{ ...this.pieChartData.datasets[0], data: Object.values(categoryCounts) }]
      };
      this.barChartData = {
         labels: Object.keys(categoryStockValue),
         datasets: [{ ...this.barChartData.datasets[0], data: Object.values(categoryStockValue) }]
      };
  }

  // --- Funções para Gráficos de Lucro e Receita por Período ---

  setPeriod(period: 'day' | 'month' | 'year'): void {
    if (this.selectedPeriod !== period) {
        this.selectedPeriod = period;
        this.updateTimeCharts();
    }
  }

  /** Filtra e AGREGA as vendas pelo período selecionado para os gráficos de tempo */
  updateTimeCharts(): void {
    if (!this.allSalesData) return;

    const now = new Date();
    let startDate: Date, endDate: Date, labels: string[] = [];
    let profitData: number[] = [], revenueData: number[] = [];

    // 1. Define Intervalo e Labels
    switch (this.selectedPeriod) {
      case 'month':
        startDate = startOfMonth(now); endDate = endOfMonth(now);
        const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
        labels = daysInMonth.map(day => format(day, 'dd')); // '01', '02', ...
        profitData = Array(daysInMonth.length).fill(0);
        revenueData = Array(daysInMonth.length).fill(0);
        break;
      case 'year':
        startDate = startOfYear(now); endDate = endOfYear(now);
        const monthsInYear = eachMonthOfInterval({ start: startDate, end: endDate });
        labels = monthsInYear.map(month => format(month, 'MMM', { locale: ptBR })); // 'jan', 'fev', ...
        profitData = Array(monthsInYear.length).fill(0);
        revenueData = Array(monthsInYear.length).fill(0);
        break;
      case 'day':
      default: 
        startDate = startOfDay(now); endDate = endOfDay(now);
        labels = [`Hoje (${format(now, 'dd/MM')})`];
        profitData = [0];
        revenueData = [0];
        break;
    }

    // 2. Filtra Vendas e Agrega no Sub-Período Correto
    this.allSalesData.forEach(sale => {
      try {
        const saleDate = parseISO(sale.createdAt); // saleDate é um objeto Date
        if (isWithinInterval(saleDate, { start: startDate, end: endDate })) {
          const saleCost = sale.items?.reduce((sum, item) => sum + (item.costPerUnit * item.quantitySold), 0) || 0;
          const saleProfit = sale.totalAmount - saleCost;

          let index = -1;
          
          if (this.selectedPeriod === 'month') { 
            index = saleDate.getDate() - 1; 
          } 
          else if (this.selectedPeriod === 'year') { 
            index = saleDate.getMonth(); 
          } 
          else { 
            index = 0; 
          }

          if (index >= 0 && index < profitData.length) {
            // Garante que estamos somando números
            profitData[index] = (profitData[index] || 0) + saleProfit;
            revenueData[index] = (revenueData[index] || 0) + sale.totalAmount;
          }
        }
      } catch {} // Ignora datas inválidas
    });

    // 3. Atualiza Dados dos Gráficos de Tempo
    this.profitChartData = {
      labels: labels,
      datasets: [ { ...this.profitChartData.datasets[0], data: profitData } ]
    };
    this.revenueChartData = {
      labels: labels,
      datasets: [ { ...this.revenueChartData.datasets[0], data: revenueData } ]
    };
  }

  // --- Função para Gráfico Top Produtos ---

  /** Atualiza o gráfico de Top 5 Produtos mais vendidos (quantidade) no mês atual */
  updateTopProductsChart(): void {
    if (!this.allSalesData || !this.allProductsData) return;

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    // 1. Filtra vendas do mês atual
    const salesThisMonth = this.allSalesData.filter(sale => {
      try {
        const saleDate = parseISO(sale.createdAt);
        return isWithinInterval(saleDate, { start: startOfCurrentMonth, end: endOfCurrentMonth });
      } catch { return false; }
    });

    // 2. Agrega quantidade vendida por productId
    const quantitySoldPerProduct: { [productId: number]: number } = {};
    salesThisMonth.forEach(sale => {
      sale.items?.forEach(item => {
        quantitySoldPerProduct[item.productId] = (quantitySoldPerProduct[item.productId] || 0) + item.quantitySold;
      });
    });

    // 3. Mapeia para um array { id, name, quantity } e ordena
    const productMap = new Map(this.allProductsData.map(p => [p.id, p.title])); // Mapa para pegar nomes
    const sortedProducts = Object.entries(quantitySoldPerProduct)
      .map(([productIdStr, quantity]) => ({
        id: parseInt(productIdStr, 10),
        name: productMap.get(parseInt(productIdStr, 10)) || `Produto ID ${productIdStr}`,
        quantity: quantity
      }))
      .sort((a, b) => b.quantity - a.quantity); // Ordena por quantidade (maior primeiro)

    // 4. Pega o Top 5
    const top5Products = sortedProducts.slice(0, 5);

    // 5. Atualiza dados do gráfico de barras horizontais
    this.topProductsChartData = {
      // Inverte a ordem para mostrar o maior em cima no gráfico horizontal
      labels: top5Products.map(p => p.name).reverse(), 
      datasets: [{
        ...this.topProductsChartData.datasets[0],
        data: top5Products.map(p => p.quantity).reverse() 
      }]
    };
  }

  /** Helper para lidar com erros individuais do forkJoin */
  private handleDataLoadError(error: any, dataType: string): Observable<any[]> {
      console.error(`Dashboard: Erro ao carregar ${dataType}`, error);
      const message = `Falha ao carregar ${dataType}.`;
       if (this.errorMessage) {
          if (!this.errorMessage.includes(message)) { this.errorMessage += '; ' + message; }
      } else {
          this.errorMessage = message;
      }
      return of([]);
  }
}