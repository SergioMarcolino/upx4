// Em src/controllers/products-controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Product } from '../entities/Product'; // Importa a ENTIDADE Product
import { Supplier } from '../entities/Supplier'; // Importa Supplier para validação
import { ProductRequest, MovementType } from '../types';
import { StockService } from '../services/stockService'; // Importa o StockService já refatorado
import { QueryFailedError, FindOptionsWhere } from 'typeorm'; // Para erros e filtros

// Obtém o repositório para a entidade Product
const productRepository = AppDataSource.getRepository(Product);
const supplierRepository = AppDataSource.getRepository(Supplier); // Repositório de Supplier para validação
const stockService = new StockService();

// =======================================================
// GET: Listar Produtos (/api/products)
// =======================================================
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Busca todos os produtos usando o repositório
    // 'relations' carrega o objeto Supplier junto
    const products = await productRepository.find({ relations: ['supplier'] });
    res.status(200).json({
      message: 'Produtos listados com sucesso',
      data: products
    });
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: 'Falha ao buscar produtos.' });
  }
};

// =======================================================
// POST: Criar Produto (/api/products)
// =======================================================
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title, purchase_price, sale_price, description,
      category, imageBase64, supplierId, quantity
    }: ProductRequest = req.body;

    // --- Validações ---
    if (isNaN(purchase_price) || isNaN(sale_price) || isNaN(quantity) || isNaN(supplierId)) {
       res.status(400).json({ error: 'Tipo inválido', message: 'Preços, quantidade e ID do fornecedor devem ser números.' });
       return;
    }
    if (purchase_price < 0 || sale_price < 0 || quantity < 0) {
       res.status(400).json({ error: 'Valor inválido', message: 'Preços e quantidade não podem ser negativos.' });
       return;
    }
    if (!title || !description || !category /*|| !imageBase64*/) {
       res.status(400).json({ error: 'Campos obrigatórios', message: 'Título, Descrição e Categoria são obrigatórios.' });
       return;
    }
    // Validação de Fornecedor
    const supplierExists = await supplierRepository.exist({ where: { id: supplierId } });
    if (!supplierExists) {
        res.status(400).json({ error: 'Fornecedor inválido', message: `O ID do fornecedor ${supplierId} não existe.` });
        return;
    }
    // --- Fim Validações ---

    // Cria a instância da entidade Product
    const newProductEntity = productRepository.create({
      title: title.trim(),
      purchase_price: purchase_price,
      sale_price: sale_price,
      description: description.trim(),
      category: category,
      imageBase64: imageBase64 || null,
      supplierId: supplierId,
      quantity: quantity,
      status: "anunciado",
    });

    const savedProduct = await productRepository.save(newProductEntity);

    try {
      await stockService.addMovement(savedProduct.id, savedProduct.quantity, MovementType.INITIAL_ADJUSTMENT);
    } catch (stockErr: any) {
       console.error(`Produto [${savedProduct.id}] salvo no DB, MAS falhou ao registrar movimento de estoque:`, stockErr.message);
    }

    res.status(201).json({ message: 'Produto cadastrado com sucesso', data: savedProduct });

  } catch (error: any) {
    console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível cadastrar o produto.' });
  }
};

// =======================================================
// PUT: Atualizar Produto (/api/products/:id)
// =======================================================
 export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(req.params.id, 10);
        if (isNaN(productId)) {
            res.status(400).json({ error: 'ID inválido', message: 'O ID do produto deve ser um número.' });
            return;
        }

        const { quantity, supplierId, ...updateData }: Partial<ProductRequest & {quantity?: number}> = req.body;

        if (supplierId !== undefined) {
             if (isNaN(supplierId)) {
                 res.status(400).json({ error: 'Tipo inválido', message: 'ID do fornecedor deve ser um número.' });
                 return;
             }
             const supplierExists = await supplierRepository.exist({ where: { id: supplierId } });
             if (!supplierExists) {
                 res.status(400).json({ error: 'Fornecedor inválido', message: `O ID do fornecedor ${supplierId} não existe.` });
                 return;
             }
        }

        const updatePayload: Partial<Product> = {
            ...updateData,
             ...(supplierId !== undefined && { supplierId: supplierId }),
             date: new Date()
        };

        const updateResult = await productRepository.update({ id: productId }, updatePayload);

        if (updateResult.affected === 0) {
            res.status(404).json({ error: 'Produto não encontrado', message: `Produto ID ${productId} não encontrado para atualização.` });
            return; // Correção TS2322
        }

        const updatedProduct = await productRepository.findOne({ where: { id: productId }, relations: ['supplier'] });

        const warningMessage = quantity !== undefined ? "Atualização de 'quantity' ignorada." : undefined;

        res.status(200).json({
            message: `Produto ID ${productId} atualizado com sucesso`,
            data: updatedProduct,
            warning: warningMessage
        });

    } catch (error: any) {
        console.error(`Erro ao atualizar produto ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível atualizar o produto.' });
    }
};


// =======================================================
// GET: Buscar Produto por ID (/api/products/:id)
// =======================================================
 export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(req.params.id, 10);
        if (isNaN(productId)) {
           res.status(400).json({ error: 'ID inválido', message: 'O ID do produto deve ser um número.' });
           return; // Adicionado return
        }

        const product = await productRepository.findOne({
             where: { id: productId },
             relations: ['supplier']
        });

        // 👇 CORREÇÃO TS2322 APLICADA AQUI 👇
        if (!product) {
             res.status(404).json({ error: 'Produto não encontrado', message: `Produto ID ${productId} não encontrado.` });
             return; // Adicionado return
        }
        // 👆 FIM DA CORREÇÃO 👆

        res.status(200).json({ message: 'Produto encontrado', data: product });

    } catch (error: any) {
        console.error(`Erro ao buscar produto ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível buscar o produto.' });
    }
};

// =======================================================
// DELETE: Excluir Produto (/api/products/:id)
// =======================================================
 export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(req.params.id, 10);
        if (isNaN(productId)) {
           res.status(400).json({ error: 'ID inválido', message: 'O ID do produto deve ser um número.' });
           return; // Adicionado return
        }

        const deleteResult = await productRepository.delete({ id: productId });

        // 👇 CORREÇÃO TS2322 APLICADA AQUI 👇
        if (deleteResult.affected === 0) {
            res.status(404).json({ error: 'Produto não encontrado', message: `Produto ID ${productId} não encontrado para exclusão.` });
            return; // Adicionado return
        }
        // 👆 FIM DA CORREÇÃO 👆

        res.status(200).json({
          message: `Produto ID ${productId} excluído com sucesso (e suas movimentações de estoque).`
        });

    } catch (error: any) {
         // Captura erro específico de FK constraint violation
         if (error instanceof QueryFailedError && error.message.includes('conflicted with the REFERENCE constraint')) {
              if (error.message.includes('FK_SaleItems_Products')) {
                  // 👇 CORREÇÃO TS2322 APLICADA AQUI 👇
                  res.status(400).json({ error: 'Exclusão não permitida', message: `Produto ID ${req.params.id} não pode ser excluído pois possui vendas associadas no histórico.` });
                  return; // Adicionado return
                  // 👆 FIM DA CORREÇÃO 👆
              }
         }
        console.error(`Erro ao excluir produto ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível excluir o produto.' });
    }
};