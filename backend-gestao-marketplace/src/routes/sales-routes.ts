// Em src/routes/sales-routes.ts
import { Router } from 'express';
import { createSaleController } from '../controllers/saleController';
import { authenticateToken } from '../middleware/auth'; // Importa seu middleware

const router = Router();

// POST /api/sales
// Vamos proteger esta rota. Apenas usuários logados podem vender.
router.post('/', authenticateToken, createSaleController);

// (Aqui também podemos adicionar a rota do relatório de lucro no futuro)

// ESSA É A LINHA QUE PROVAVELMENTE ESTÁ FALTANDO:
export default router;