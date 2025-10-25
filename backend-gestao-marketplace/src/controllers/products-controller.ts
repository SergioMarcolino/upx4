// Em src/controllers/products-controller.ts
import { Request, Response } from 'express';
// Importa os tipos necessários
import { Product, ProductRequest, MovementType } from '../types';
import { StockService } from '../services/stockService';
import { db } from '../repository'; // Usar o repository para ler/escrever

const stockService = new StockService();

// =======================================================
// GET: Listar Produtos
// =======================================================
export const getProducts = (req: Request, res: Response): void => {
  try {
    // Lê produtos usando o repository
    const products = db.read().products || [];
    res.status(200).json({
      message: 'Produtos listados com sucesso',
      data: products
    });
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
};

// =======================================================
// POST: Criar Produto (Corrigido)
// =======================================================
export const createProduct = (req: Request, res: Response): void => {
  try {
    // Desestrutura direto do body com a tipagem
    const {
      title,
      purchase_price,
      sale_price,
      description,
      category,
      imageBase64, // Nome correto
      supplierId,
      quantity
    }: ProductRequest = req.body;

    // --- Validações Essenciais ---
    // Checa se os valores numéricos são realmente números
    if (isNaN(purchase_price) || isNaN(sale_price) || isNaN(quantity) || isNaN(supplierId)) {
       // 👇 CORREÇÃO: Remover 'return'
       res.status(400).json({ error: 'Tipo inválido', message: 'Preços, quantidade e ID do fornecedor devem ser números.' });
       return; // Adicionar return vazio para parar a execução
    }
    // Checa se os valores numéricos são positivos ou zero
     if (purchase_price < 0 || sale_price < 0 || quantity < 0) {
       // 👇 CORREÇÃO: Remover 'return'
       res.status(400).json({ error: 'Valor inválido', message: 'Preços e quantidade não podem ser negativos.' });
       return; // Adicionar return vazio
    }
    // Checa se os campos string obrigatórios não estão vazios
    if (!title || !description || !category || !imageBase64) {
        // 👇 CORREÇÃO: Remover 'return'
        res.status(400).json({ error: 'Campos obrigatórios', message: 'Título, Descrição, Categoria e Imagem são obrigatórios.' });
        return; // Adicionar return vazio
    }

    // Lê os dados atuais do "banco"
    const data = db.read();

    // Valida se o supplierId existe
    const allSuppliers = data.suppliers || [];
    if (!allSuppliers.some(s => s.id === supplierId)) {
        // 👇 CORREÇÃO: Remover 'return'
        res.status(400).json({ error: 'Fornecedor inválido', message: `O ID do fornecedor ${supplierId} não existe.` });
        return; // Adicionar return vazio
    }
    // --- Fim Validações ---


    const products = data.products || [];
    const newProductId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

    const newProduct: Product = {
      id: newProductId,
      title: title.trim(),
      purchase_price: purchase_price,
      sale_price: sale_price,
      description: description.trim(),
      category: category,
      status: "anunciado", // Status inicial padrão
      imageBase64: imageBase64, // Salva o base64
      supplierId: supplierId, // Salva o ID do fornecedor
      quantity: quantity, // Salva a quantidade inicial como cache
      date: new Date().toISOString() // Data de criação
    };

    products.push(newProduct);
    data.products = products; // Atualiza o objeto data
    db.write(data); // Salva tudo de uma vez

    // Registra estoque inicial (DEPOIS de salvar o produto)
    try {
      stockService.addMovement(newProduct.id, newProduct.quantity, MovementType.INITIAL_ADJUSTMENT);
    } catch (stockErr: any) {
       console.error(`Produto [${newProduct.id}] salvo, MAS falhou ao registrar movimento de estoque:`, stockErr.message);
       // Não retorna erro para o cliente aqui, pois o produto foi criado.
    }

    res.status(201).json({ message: 'Produto cadastrado com sucesso', data: newProduct });

  } catch (error: any) {
    console.error('Erro ao cadastrar produto:', error);
    // Verifica se é um erro de leitura/escrita do db para dar uma mensagem melhor
    if (error.message.includes('Falha ao ler') || error.message.includes('Falha ao salvar')) {
       // 👇 CORREÇÃO: Remover 'return'
       res.status(500).json({ error: 'Erro de Banco de Dados', message: error.message });
       return; // Adicionar return vazio
    }
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
};

// =======================================================
// PUT: Atualizar Produto
// =======================================================
export const updateProduct = (req: Request, res: Response): void => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
        // 👇 CORREÇÃO: Remover 'return'
        res.status(400).json({ error: 'ID inválido', message: 'O ID do produto deve ser um número.' });
        return; // Adicionar return vazio
    }

    // Pega supplierId do body, remove quantity (ignorado)
    // Também pega imageBase64 se foi enviado
    const { quantity, supplierId, imageBase64, ...updateData } = req.body;

    const data = db.read(); // Lê o estado atual do DB

    // Valida supplierId se foi fornecido
    if (supplierId !== undefined) {
        if (isNaN(supplierId)) {
           // 👇 CORREÇÃO: Remover 'return'
           res.status(400).json({ error: 'Tipo inválido', message: 'ID do fornecedor deve ser um número.' });
           return; // Adicionar return vazio
        }
        const allSuppliers = data.suppliers || [];
        if (!allSuppliers.some(s => s.id === supplierId)) {
            // 👇 CORREÇÃO: Remover 'return'
            res.status(400).json({ error: 'Fornecedor inválido', message: `O ID do fornecedor ${supplierId} não existe.` });
            return; // Adicionar return vazio
        }
    }

    const products = data.products || [];
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
       // 👇 CORREÇÃO: Remover 'return'
       res.status(404).json({ error: 'Produto não encontrado', message: `Produto ID ${productId} não encontrado.` });
       return; // Adicionar return vazio
    }

    // Monta o produto atualizado
    const originalProduct = products[productIndex];
    const updatedProduct: Product = {
        ...originalProduct, // Mantém campos não enviados
        ...updateData,      // Aplica as atualizações do body (exceto quantity e imageBase64)
        // Atualiza supplierId APENAS se ele veio no body
        ...(supplierId !== undefined && { supplierId: supplierId }),
         // Atualiza imageBase64 APENAS se ele veio no body
        ...(imageBase64 !== undefined && { imageBase64: imageBase64 }),
        date: new Date().toISOString() // Atualiza a data da última modificação
    };

    products[productIndex] = updatedProduct;
    data.products = products; // Atualiza o objeto data
    db.write(data); // Salva tudo

    // Monta a mensagem de aviso sobre quantity
    const warningMessage = quantity !== undefined
      ? "A atualização de 'quantity' foi ignorada. Use Vendas/Compras/Ajustes para alterar o estoque."
      : undefined;

    res.status(200).json({
        message: `Produto ID ${productId} atualizado com sucesso`,
        data: updatedProduct,
        warning: warningMessage
    });

  } catch (error: any) {
    console.error(`Erro ao atualizar produto ID ${req.params.id}:`, error);
     if (error.message.includes('Falha ao ler') || error.message.includes('Falha ao salvar')) {
       // 👇 CORREÇÃO: Remover 'return'
       res.status(500).json({ error: 'Erro de Banco de Dados', message: error.message });
       return; // Adicionar return vazio
    }
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
};

// =======================================================
// GET: Buscar Produto por ID
// =======================================================
export const getProductById = (req: Request, res: Response): void => {
  try {
    const productId = parseInt(req.params.id, 10);
     if (isNaN(productId)) {
        // 👇 CORREÇÃO: Remover 'return'
        res.status(400).json({ error: 'ID inválido', message: 'O ID do produto deve ser um número.' });
        return; // Adicionar return vazio
    }

    const products = db.read().products || [];
    const product = products.find(p => p.id === productId);

    if (!product) {
      // 👇 CORREÇÃO: Remover 'return'
      res.status(404).json({ error: 'Produto não encontrado', message: `Produto ID ${productId} não encontrado.` });
      return; // Adicionar return vazio
    }

    res.status(200).json({ message: 'Produto encontrado', data: product });

  } catch (error: any) {
    console.error(`Erro ao buscar produto ID ${req.params.id}:`, error);
     if (error.message.includes('Falha ao ler')) {
       // 👇 CORREÇÃO: Remover 'return'
       res.status(500).json({ error: 'Erro de Banco de Dados', message: error.message });
       return; // Adicionar return vazio
    }
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
};

// =======================================================
// DELETE: Excluir Produto
// =======================================================
export const deleteProduct = (req: Request, res: Response): void => {
  try {
    const productId = parseInt(req.params.id, 10);
     if (isNaN(productId)) {
        // 👇 CORREÇÃO: Remover 'return'
        res.status(400).json({ error: 'ID inválido', message: 'O ID do produto deve ser um número.' });
        return; // Adicionar return vazio
    }

    const data = db.read();
    let products = data.products || [];
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      // 👇 CORREÇÃO: Remover 'return'
      res.status(404).json({ error: 'Produto não encontrado', message: `Produto ID ${productId} não encontrado.` });
      return; // Adicionar return vazio
    }

    // Remove o produto do array
    const [deletedProduct] = products.splice(productIndex, 1);

    // Remove também as movimentações de estoque associadas (IMPORTANTE!)
    let stockMovements = data.stock_movements || [];
    stockMovements = stockMovements.filter(m => m.productId !== productId);

    // Atualiza o objeto data e salva
    data.products = products;
    data.stock_movements = stockMovements;
    db.write(data);

    res.status(200).json({
      message: `Produto "${deletedProduct.title}" (ID: ${productId}) e suas movimentações foram excluídos.`
    });

  } catch (error: any) {
    console.error(`Erro ao excluir produto ID ${req.params.id}:`, error);
     if (error.message.includes('Falha ao ler') || error.message.includes('Falha ao salvar')) {
       // 👇 CORREÇÃO: Remover 'return'
       res.status(500).json({ error: 'Erro de Banco de Dados', message: error.message });
       return; // Adicionar return vazio
    }
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
};