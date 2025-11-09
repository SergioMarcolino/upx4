import { Request, Response } from 'express';
import { SaleService } from '../services/saleService'; 
import { SaleRequestDTO } from '../types'; 
import { Sale } from '../entities/Sale'; 
import { AppDataSource } from '../data-source'; 

// Instancia o serviço UMA VEZ
const saleService = new SaleService();

// ==============================================
// POST: Criar uma Nova Venda (/api/sales)
// ==============================================
export const createSaleController = async (req: Request, res: Response): Promise<void> => { // async/Promise
  try {
    const saleRequest: SaleRequestDTO = req.body;

    // Validação básica do corpo
    if (!saleRequest || !Array.isArray(saleRequest.items) || saleRequest.items.length === 0) {
      res.status(400).json({ message: 'Requisição de venda inválida. "items" é obrigatório.' });
      return;
    }

    // Chama o método assíncrono do serviço refatorado
    const newSale = await saleService.createSale(saleRequest);

    // Retorna a venda básica retornada pelo save:
    res.status(201).json(newSale);


  } catch (error: any) {
    // Captura erros lançados pelo saleService
    console.error('Falha na API /api/sales [POST]:', error.message);
    res.status(400).json({ message: error.message });
  }
};


// ==============================================
// GET: Listar Todas as Vendas (/api/sales)
// ==============================================
export const getSales = async (req: Request, res: Response): Promise<void> => { // async/Promise
  try {
    // Usa o repositório do TypeORM para buscar as vendas
    const saleRepository = AppDataSource.getRepository(Sale); // Agora AppDataSource é conhecido
    // Busca todas as vendas, incluindo os itens e os produtos dentro dos itens
    const salesData = await saleRepository.find({ relations: ['items', 'items.product'] });

    res.status(200).json({
      message: 'Vendas listadas com sucesso',
      data: salesData
    });

  } catch (error: any) {
    console.error('Falha na API /api/sales [GET]:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível listar as vendas.' });
  }
};