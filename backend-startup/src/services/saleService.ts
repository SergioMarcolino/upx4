import { AppDataSource } from '../data-source';
import { Sale } from '../entities/Sale';
import { SaleItem } from '../entities/SaleItem';
import { Product } from '../entities/Product';
import { SaleRequestDTO} from '../types'; 
import { StockService } from './stockService';
import { MovementType } from '../types';
import { EntityManager, In } from 'typeorm'; 

const productRepository = AppDataSource.getRepository(Product);
const saleRepository = AppDataSource.getRepository(Sale);

const stockService = new StockService();

export class SaleService {

  public async createSale(saleRequest: SaleRequestDTO): Promise<Sale> { 

    if (!saleRequest || !Array.isArray(saleRequest.items) || saleRequest.items.length === 0) {
        throw new Error('Requisição de venda inválida. O array "items" é obrigatório e não pode ser vazio.');
    }
    const productIds = saleRequest.items.map(item => item.productId);
    if (productIds.some(id => isNaN(id) || id <= 0)) {
        throw new Error('Requisição contém IDs de produto inválidos.');
    }

    let savedSale: Sale;

    await AppDataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {

        const productRepoTx = transactionalEntityManager.getRepository(Product);
        const saleRepoTx = transactionalEntityManager.getRepository(Sale);


        const productsInSale = await productRepoTx.findBy({
            id: In(productIds) 
        });

        const productMap = new Map(productsInSale.map(p => [p.id, p]));

        let totalSaleAmount = 0;
        const saleItemsToCreate: Partial<SaleItem>[] = []; 

        for (const itemDTO of saleRequest.items) {
            const product = productMap.get(itemDTO.productId);

            if (!product) {
                throw new Error(`Produto com ID ${itemDTO.productId} não encontrado no banco de dados.`);
            }

            if (product.quantity < itemDTO.quantity) {
                throw new Error(`Estoque insuficiente para: ${product.title} (Disponível: ${product.quantity}, Pedido: ${itemDTO.quantity})`);
            }

            const saleItemData: Partial<SaleItem> = {
                productId: product.id,
                quantitySold: itemDTO.quantity,
                pricePerUnit: product.sale_price,     
                costPerUnit: product.purchase_price, 
            };
            saleItemsToCreate.push(saleItemData);

            totalSaleAmount += (product.sale_price * itemDTO.quantity);
        }

        const newSale = saleRepoTx.create({
            totalAmount: totalSaleAmount,

            items: saleItemsToCreate.map(itemData => transactionalEntityManager.create(SaleItem, itemData))
        });


        savedSale = await saleRepoTx.save(newSale); 
        console.log(`[SaleService TYPEORM] Venda ID ${savedSale.id} e itens salvos.`);

        for (const item of savedSale.items) {
            await stockService.addMovement(
                item.productId,
                -item.quantitySold, 
                MovementType.SALE
            );
        }
        console.log(`[SaleService TYPEORM] Baixa de estoque processada para venda ID ${savedSale.id}.`);


    }).catch(error => {
        console.error(`[SaleService TYPEORM ERROR] Falha na transação da venda:`, error);
        throw error;
    });

    return savedSale!;
  }
}