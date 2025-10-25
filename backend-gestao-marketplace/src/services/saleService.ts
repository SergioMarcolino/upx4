// Em src/services/saleService.ts
import { db } from '../repository';
import { Sale, SaleItem, SaleRequestDTO, MovementType, Product } from '../types';
import { StockService } from './stockService';

export class SaleService {
  private stockService: StockService;

  constructor() {
    this.stockService = new StockService(); // Instancia o serviço de estoque
  }

  /**
   * Processa uma nova venda.
   * Valida estoque, salva a venda e dá baixa.
   */
  public createSale(saleRequest: SaleRequestDTO): Sale {
    
    // --- PARTE 1: LEITURA E VALIDAÇÃO ---
    const data = db.read();
    let totalSaleAmount = 0;
    const saleItems: SaleItem[] = [];
    // Lista temporária dos produtos que vamos dar baixa
    const itemsToProcess: Array<{ product: Product, quantityToSell: number }> = [];

    for (const itemDTO of saleRequest.items) {
      const product = data.products.find(p => p.id === itemDTO.productId);

      if (!product) {
        throw new Error(`Produto não encontrado: ${itemDTO.productId}`);
      }

      // Valida o estoque (usando o campo 'quantity' do produto)
      if (!product.quantity || product.quantity < itemDTO.quantity) {
        throw new Error(`Estoque insuficiente para: ${product.title} (Estoque atual: ${product.quantity})`);
      }

      // Cria o SaleItem (congelando preços e custos)
      const saleItem: SaleItem = {
        id: Date.now() + Math.random(),
        productId: product.id,
        quantitySold: itemDTO.quantity,
        pricePerUnit: product.sale_price,     // 👈 Pega o preço de venda
        costPerUnit: product.purchase_price, // 👈 Pega o preço de custo
      };
      saleItems.push(saleItem);

      // Acumula o total e guarda o item para dar baixa
      totalSaleAmount += (product.sale_price * itemDTO.quantity);
      itemsToProcess.push({ product, quantityToSell: itemDTO.quantity });
    }

    // --- PARTE 2: ESCRITA (SALVAR NO "BANCO") ---
    // Se chegou até aqui, todas as validações passaram.
    
    try {
      // 1. Cria a Venda "pai"
      const newSale: Sale = {
        id: Date.now(),
        totalAmount: totalSaleAmount,
        createdAt: new Date().toISOString(),
        items: saleItems
      };

      // 2. Dá baixa no estoque (um item de cada vez)
      // O StockService vai ler e salvar o db.json para CADA item
      for (const item of itemsToProcess) {
        this.stockService.addMovement(
          item.product.id,
          -item.quantityToSell, // 👈 IMPORTANTE: Quantidade NEGATIVA
          MovementType.SALE
        );
      }
      
      // 3. Salva a Venda
      // (Temos que ler o DB de novo, pois o stockService já o modificou)
      const finalDb = db.read();
      finalDb.sales.push(newSale);
      db.write(finalDb);

      return newSale; // Retorna a venda para o controller

    } catch (error: any) {
      // Se o stockService falhar, o erro será pego aqui
      console.error("ERRO GRAVE ao processar venda:", error);
      throw new Error(`Falha ao salvar a venda: ${error.message}`);
    }
  }
}