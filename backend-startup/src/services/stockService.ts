// Em src/services/stockService.ts
import { AppDataSource } from '../data-source';
import { Product } from '../entities/Product';
import { StockMovement } from '../entities/StockMovement';
import { MovementType } from '../types'; // Ou defina o Enum aqui
import { EntityManager } from 'typeorm'; // Para transações

// Obtém os repositórios fora da classe (padrão comum)
const productRepository = AppDataSource.getRepository(Product);
const stockMovementRepository = AppDataSource.getRepository(StockMovement);

export class StockService {

  /**
   * Adiciona uma movimentação de estoque E ATUALIZA O ESTOQUE NO PRODUTO.
   * Executa a inserção do movimento e a atualização do produto dentro de uma transação.
   */
  public async addMovement(productId: number, quantity: number, type: MovementType): Promise<void> {
    console.log(`[StockService TYPEORM] addMovement: pId=${productId}, qty=${quantity}, type=${type}`);

    // Usa o gerenciador de transações do DataSource
    await AppDataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {
      // Obtém repositórios específicos da transação
      const productRepoTx = transactionalEntityManager.getRepository(Product);
      const stockMovementRepoTx = transactionalEntityManager.getRepository(StockMovement);

      // 1. Cria e salva a nova movimentação DENTRO da transação
      const newMovement = stockMovementRepoTx.create({
        productId: productId,
        quantity: quantity,
        type: type
        // createdAt será definido pelo @CreateDateColumn
      });
      await stockMovementRepoTx.save(newMovement);
      console.log(`[StockService TYPEORM] Movimentação inserida para productId ${productId}`);

      // 2. Recalcula o estoque total SOMANDO no banco DENTRO da transação
      // Usando QueryBuilder para fazer SUM() de forma segura
      const sumResult = await stockMovementRepoTx.createQueryBuilder("sm")
        .select("SUM(sm.quantity)", "totalStock") // Seleciona a soma e a nomeia como totalStock
        .where("sm.productId = :productId", { productId: productId }) // Filtra pelo ID do produto
        .getRawOne(); // Pega o resultado bruto ( { totalStock: VALOR } )

      const totalStock = sumResult?.totalStock ?? 0; // Pega a soma ou 0
      console.log(`[StockService TYPEORM] Soma calculada no DB: ${totalStock}`);

      // 3. Atualiza o cache 'quantity' na tabela Products DENTRO da transação
      // Usando o método update que é mais eficiente para atualizar um campo específico
      const updateResult = await productRepoTx.update(
        { id: productId }, // Critério: WHERE id = productId
        { quantity: totalStock } // Dados a atualizar: SET quantity = totalStock
      );

      // Verifica se o produto foi encontrado e atualizado
      if (updateResult.affected === 0) {
        console.warn(`[StockService TYPEORM WARNING] Produto com ID ${productId} não encontrado durante atualização do cache. Movimento foi salvo, mas estoque não atualizado.`);
        // Lançar um erro aqui faria a transação inteira dar rollback (movimento não seria salvo)
        // Decida a melhor estratégia: lançar erro ou apenas logar.
        // throw new Error(`Produto ${productId} não encontrado para atualizar estoque.`);
      } else {
        console.log(`[StockService TYPEORM] Cache de estoque do produto ${productId} atualizado para ${totalStock}`);
      }

      // Se todas as operações acima funcionarem, a transação será commitada automaticamente.
      // Se qualquer 'await' lançar um erro, a transação dará rollback automaticamente.
    }).catch(error => {
        // Captura erros da transação
        console.error(`[StockService TYPEORM ERROR] Falha na transação de movimentação para productId ${productId}:`, error);
        // Re-lança o erro para o chamador (controller) saber que falhou
        throw error;
    });
  }
}