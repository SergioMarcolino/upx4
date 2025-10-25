// Em src/services/stockService.ts
import { db } from '../repository';
import { MovementType, Product } from '../types'; // Certifique-se que Product está importado se usar o título no log

export class StockService {

  /**
   * Adiciona uma movimentação de estoque E ATUALIZA O ESTOQUE NO PRODUTO.
   * Esta é a única função que deve alterar o estoque.
   */
  public addMovement(productId: number, quantity: number, type: MovementType) {

    // --- LOG 1: O que a função recebeu? ---
    console.log(`[StockService DEBUG] addMovement chamado com: productId=${productId}, quantity=${quantity}, type=${type}`);

    // Lê o estado atual completo do "banco de dados"
    const data = db.read();

    // Cria o objeto da nova movimentação
    const newMovement = {
      id: Date.now() + Math.random(), // ID simples baseado no tempo + aleatoriedade
      productId: productId,
      quantity: quantity, // A quantidade recebida (ex: -10 para venda)
      type: type,         // O tipo recebido (ex: 'SALE')
      createdAt: new Date().toISOString() // Data/Hora atual em formato ISO
    };

    // Adiciona a nova movimentação ao array existente (ou cria o array se não existir)
    data.stock_movements = data.stock_movements || [];
    data.stock_movements.push(newMovement);

    // --- LOG 2: Quais são TODAS as movimentações DESSE produto AGORA? ---
    // Filtra todas as movimentações apenas para o produto que está sendo alterado
    const movementsForProduct = (data.stock_movements || []).filter(m => m.productId === productId);
    console.log(`[StockService DEBUG] Movimentações encontradas para productId ${productId}:`, JSON.stringify(movementsForProduct, null, 2));

    // --- LOG 3: Qual o resultado da SOMA? ---
    // Calcula o saldo somando TODAS as quantidades (+ e -) das movimentações filtradas
    const totalStock = movementsForProduct.reduce((sum, m) => sum + m.quantity, 0);
    console.log(`[StockService DEBUG] Soma calculada (totalStock): ${totalStock}`);

    // Encontra o índice do produto correspondente no array de produtos
    // Garante que data.products existe antes de procurar
    const productsArray = data.products || [];
    const productIndex = productsArray.findIndex(p => p.id === productId);

    // Se o produto não for encontrado no products.json, lança um erro
    if (productIndex === -1) {
      console.error(`[StockService ERROR] Produto com ID ${productId} NÃO encontrado no array de produtos! Impossível atualizar o cache de estoque.`);
      // Em um sistema real, talvez você queira apenas logar e não lançar erro,
      // dependendo da regra de negócio (a movimentação foi salva, mas o cache falhou).
      // Por agora, lançar erro ajuda a identificar inconsistências.
      throw new Error(`Produto com ID ${productId} não encontrado no 'products.json'.`);
    }

    // --- LOG 4: O que está sendo salvo no produto? ---
    const currentProductStock = data.products[productIndex].quantity; // Pega o valor antigo para logar
    console.log(`[StockService DEBUG] Atualizando data.products[${productIndex}].quantity de ${currentProductStock} para ${totalStock}`);

    // ATUALIZA o campo 'quantity' (cache de estoque) do produto encontrado com a SOMA calculada
    data.products[productIndex].quantity = totalStock;

    // Salva TODAS as alterações (novo movimento + produto atualizado) nos arquivos JSON
    db.write(data);

    // Log final confirmando a atualização (inclui o título para fácil identificação)
    const updatedProductTitle = data.products[productIndex].title;
    console.log(`[StockService] Estoque do produto ${productId} [${updatedProductTitle}] atualizado para ${totalStock}`);
  }
}