// Em src/services/saleService.ts (BACKEND)
import { AppDataSource } from '../data-source';
import { Sale } from '../entities/Sale';
import { SaleItem } from '../entities/SaleItem';
import { Product } from '../entities/Product';
import { SaleRequestDTO} from '../types'; // Renomeia SaleItemDTO para evitar conflito
import { StockService } from './stockService';
import { MovementType } from '../types';
import { EntityManager, In } from 'typeorm'; // In para buscar múltiplos produtos

// Repositórios (podem ser obtidos dentro da transação também)
const productRepository = AppDataSource.getRepository(Product);
const saleRepository = AppDataSource.getRepository(Sale);
// const saleItemRepository = AppDataSource.getRepository(SaleItem); // Não usado diretamente se cascade=true

const stockService = new StockService();

export class SaleService {

  /**
   * Processa uma nova venda completa dentro de uma transação.
   * Valida estoque, cria Sale, cria SaleItems, chama StockService para baixa.
   */
  public async createSale(saleRequest: SaleRequestDTO): Promise<Sale> { // Retorna Promise<Sale>

    // --- PARTE 1: VALIDAÇÃO PRELIMINAR ---
    if (!saleRequest || !Array.isArray(saleRequest.items) || saleRequest.items.length === 0) {
        throw new Error('Requisição de venda inválida. O array "items" é obrigatório e não pode ser vazio.');
    }
    const productIds = saleRequest.items.map(item => item.productId);
    if (productIds.some(id => isNaN(id) || id <= 0)) {
        throw new Error('Requisição contém IDs de produto inválidos.');
    }

    // Variável para armazenar a venda criada
    let savedSale: Sale;

    // --- PARTE 2: EXECUÇÃO DENTRO DE UMA TRANSAÇÃO ---
    await AppDataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {
        // Obtém repositórios específicos da transação
        const productRepoTx = transactionalEntityManager.getRepository(Product);
        const saleRepoTx = transactionalEntityManager.getRepository(Sale);
        // const saleItemRepoTx = transactionalEntityManager.getRepository(SaleItem); // Necessário se cascade=false

        // 1. Busca TODOS os produtos da venda de uma vez no banco
        const productsInSale = await productRepoTx.findBy({
            id: In(productIds) // Usa operador IN para buscar múltiplos IDs
        });

        // Mapeia produtos por ID para fácil acesso
        const productMap = new Map(productsInSale.map(p => [p.id, p]));

        let totalSaleAmount = 0;
        const saleItemsToCreate: Partial<SaleItem>[] = []; // Usamos Partial aqui

        // 2. Valida estoque e prepara os SaleItems
        for (const itemDTO of saleRequest.items) {
            const product = productMap.get(itemDTO.productId);

            if (!product) {
                // Se algum produto não foi encontrado no DB, a transação dará rollback
                throw new Error(`Produto com ID ${itemDTO.productId} não encontrado no banco de dados.`);
            }

            // Valida o estoque (usando a quantidade ATUAL do banco)
            if (product.quantity < itemDTO.quantity) {
                 // Se estoque insuficiente, a transação dará rollback
                throw new Error(`Estoque insuficiente para: ${product.title} (Disponível: ${product.quantity}, Pedido: ${itemDTO.quantity})`);
            }

            // Prepara o objeto SaleItem (sem ID, sem 'sale' ainda)
            const saleItemData: Partial<SaleItem> = {
                productId: product.id,
                quantitySold: itemDTO.quantity,
                pricePerUnit: product.sale_price,     // Congela o preço de venda
                costPerUnit: product.purchase_price, // Congela o custo
            };
            saleItemsToCreate.push(saleItemData);

            // Acumula o total
            totalSaleAmount += (product.sale_price * itemDTO.quantity);
        }

        // 3. Cria a Entidade Sale (ainda sem salvar)
        const newSale = saleRepoTx.create({
            totalAmount: totalSaleAmount,
            // createdAt será definido pelo @CreateDateColumn
            // Cria instâncias da entidade SaleItem a partir dos dados parciais
            items: saleItemsToCreate.map(itemData => transactionalEntityManager.create(SaleItem, itemData))
        });


        // 4. Salva a Sale e seus Items (cascade: true salva os items automaticamente)
        savedSale = await saleRepoTx.save(newSale); // Salva a venda e os itens relacionados
        console.log(`[SaleService TYPEORM] Venda ID ${savedSale.id} e itens salvos.`);

        // 5. Dá baixa no estoque para cada item vendido (chamando StockService)
        // O StockService já usa sua própria transação interna ou pode ser adaptado
        // para receber o transactionalEntityManager se necessário.
        // Por segurança, chamamos fora do save, mas ainda dentro da transação principal.
        for (const item of savedSale.items) {
             // O StockService fará o INSERT em StockMovements e o UPDATE em Products
            await stockService.addMovement(
                item.productId,
                -item.quantitySold, // Quantidade NEGATIVA
                MovementType.SALE
            );
        }
        console.log(`[SaleService TYPEORM] Baixa de estoque processada para venda ID ${savedSale.id}.`);

        // Se chegar aqui sem erros, a transação será commitada.

    }).catch(error => {
        // Captura erros da transação (ex: produto não encontrado, estoque insuficiente, erro no stockService)
        console.error(`[SaleService TYPEORM ERROR] Falha na transação da venda:`, error);
        // Re-lança o erro para o controller saber que falhou
        throw error;
    });

    // Retorna a venda salva (se a transação foi bem-sucedida)
    // Usamos '!' pois a lógica garante que savedSale será definida se não houver erro.
    return savedSale!;
  }
}