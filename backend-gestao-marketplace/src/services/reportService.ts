// Em src/services/reportService.ts
import { AppDataSource } from '../data-source';
import { Product } from '../entities/Product';
import { Sale } from '../entities/Sale';
import { Between } from 'typeorm'; // Importa 'Between'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'; // Para filtrar datas

// Repositórios
const productRepo = AppDataSource.getRepository(Product);
const saleRepo = AppDataSource.getRepository(Sale);

export class ReportService {

  /**
   * Busca dados detalhados e agregados para o relatório.
   */
  public async getReportData(year: number, month: number) {

    // Define o intervalo de datas para o mês solicitado (mês no JS é 0-11)
    const startDate = startOfMonth(new Date(year, month - 1, 1));
    const endDate = endOfMonth(startDate);

    // 1. Buscar Vendas e Itens do Período
    // Carrega 'items' (SaleItems) e 'items.product' (o Produto dentro do SaleItem)
    const salesInPeriod = await saleRepo.find({
      where: {
        createdAt: Between(startDate, endDate) // Filtra vendas pela data
      },
      // Carrega relações aninhadas: Venda -> Itens -> Produto
      relations: ['items', 'items.product'], 
      order: {
        createdAt: 'ASC' // Ordena por data
      }
    });

    // 2. Calcular Finanças do Período (com base nas vendas filtradas)
    let totalRevenue = 0;
    let totalCostOfGoods = 0;
    salesInPeriod.forEach(sale => {
      totalRevenue += sale.totalAmount;
      if (sale.items) { // Garante que a venda tem itens
          sale.items.forEach(item => {
            totalCostOfGoods += (item.costPerUnit * item.quantitySold);
          });
      }
    });
    const grossProfit = totalRevenue - totalCostOfGoods;

    // 3. Buscar Dados de Estoque (Snapshot ATUAL)
    // Busca apenas produtos 'anunciados'
    const activeProducts = await productRepo.find({ where: { status: 'anunciado' } }); 
    
    // Calcula o valor de custo total do estoque
    const totalStockValueCost = activeProducts.reduce((sum, p) => sum + (p.purchase_price * Math.max(p.quantity, 0)), 0);
    // Conta produtos com estoque baixo ou zerado
    const lowStockProducts = activeProducts.filter(p => p.quantity <= 10 && p.quantity > 0);
    const outOfStockProducts = activeProducts.filter(p => p.quantity <= 0);

    // 4. Retornar todos os dados compilados para o controller
    return {
      period: `${month.toString().padStart(2, '0')}/${year}`,
      startDate: startDate,
      endDate: endDate,
      
      // Lista detalhada para a tabela do PDF
      salesInPeriod: salesInPeriod, 

      // Resumo financeiro do período
      financials: {
        totalRevenue,
        totalCostOfGoods,
        grossProfit,
        totalSalesCount: salesInPeriod.length
      },
      
      // Resumo do estoque (do dia atual)
      stock: {
        totalStockValueCost,
        activeProductCount: activeProducts.length,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length
      },
      
      // Lista simplificada para o PDF
      lowStockProductsList: lowStockProducts.map(p => ({ title: p.title, quantity: p.quantity })) 
    };
  }
}