// Em src/controllers/saleController.ts
import { Request, Response } from 'express';
import { SaleService } from '../services/saleService';
import { SaleRequestDTO } from '../types';

// Instancia o serviço
const saleService = new SaleService();

// O "Atendente": pega o pedido e passa para a "Cozinha" (Service)
export const createSaleController = (req: Request, res: Response) => {
  try {
    const saleRequest: SaleRequestDTO = req.body;

    if (!saleRequest || !saleRequest.items || saleRequest.items.length === 0) {
      return res.status(400).json({ message: 'Requisição de venda inválida. "items" é obrigatório.' });
    }

    // Chama o serviço que faz toda a mágica
    const newSale = saleService.createSale(saleRequest);

    // Retorna a venda criada
    res.status(201).json(newSale);

  } catch (error: any) {
    // Pega erros como "Estoque insuficiente" e retorna para o frontend
    console.error('Falha na API /api/sales:', error.message);
    res.status(400).json({ message: error.message });
  }
};