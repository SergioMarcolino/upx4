import { AppDataSource } from '../data-source';
import { Sale } from '../entities/Sale';
import { SaleItem } from '../entities/SaleItem';
import { Product } from '../entities/Product'; // Importe a entidade Product
import { SaleRequestDTO } from '../types';

export class SaleService {

  public async createSale(saleRequest: SaleRequestDTO): Promise<Sale> {
    
    return AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      
      const productRepo = transactionalEntityManager.getRepository(Product);
      const saleRepo = transactionalEntityManager.getRepository(Sale);
      const saleItemRepo = transactionalEntityManager.getRepository(SaleItem);

      let calculatedTotal = 0; // 1. Variável para calcular o total

      // =================================================================
      // ETAPA 1: VERIFICAR PRODUTOS E CALCULAR TOTAL
      // =================================================================
      for (const item of saleRequest.items) {
        
        const product = await productRepo.findOne({ 
          where: { id: item.productId } 
        });

        if (!product) {
          throw new Error(`Produto com ID ${item.productId} não encontrado.`);
        }

        // Validação de Status
        if (product.status === 'desativado') {
          throw new Error(`O produto "${product.title}" está desativado e não pode ser vendido.`);
        }

        // Validação de Estoque
        if (product.quantity < item.quantity) {
          throw new Error(`Estoque insuficiente para "${product.title}". Disponível: ${product.quantity}, Pedido: ${item.quantity}.`);
        }
        
        // 2. CALCULA O TOTAL AQUI (no backend)
        // Converte para Number para garantir a multiplicação correta
        const itemTotal = Number(product.sale_price) * Number(item.quantity);
        calculatedTotal += itemTotal;
      }

      // =================================================================
      // ETAPA 2: CRIAR A VENDA
      // =================================================================
      
      const newSale = new Sale();
      
      // 3. ATRIBUI O TOTAL CALCULADO
      // Esta linha substitui a que estava dando erro
      newSale.totalAmount = calculatedTotal; 
      
      // Salva a venda principal para obter um ID
      const savedSale = await saleRepo.save(newSale);

      // =================================================================
      // ETAPA 3: ATUALIZAR O ESTOQUE E SALVAR OS ITENS
      // =================================================================
      
      for (const item of saleRequest.items) {
        const product = await productRepo.findOneByOrFail({ id: item.productId });
        
        const newSaleItem = new SaleItem();
        newSaleItem.product = product;
        newSaleItem.sale = savedSale;
        newSaleItem.quantitySold = item.quantity;
        newSaleItem.pricePerUnit = product.sale_price;
        newSaleItem.costPerUnit = product.purchase_price;
        
        await saleItemRepo.save(newSaleItem);
        
        // Atualiza (decrementa) o estoque do produto
        await productRepo.decrement(
          { id: item.productId },
          'quantity',
          item.quantity
        );
      }

      // Busca a venda completa com as relações para retornar
      const completeSale = await saleRepo.findOne({
        where: { id: savedSale.id },
        relations: ['items', 'items.product']
      });

      return completeSale!;
    });
  }
}