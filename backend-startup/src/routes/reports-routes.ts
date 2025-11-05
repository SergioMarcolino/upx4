// Em src/routes/reports-routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth'; 
import { getStockFinancialReport } from '../controllers/reports-controller';

const router = Router();

// Define a rota GET para o relatório, esperando ano e mês como parâmetros de URL
// Exemplo: GET /api/reports/stock-financial/2025/10
router.get(
    '/stock-financial/:year/:month', // Parâmetros na URL
    authenticateToken,                 // Middleware de segurança
    getStockFinancialReport          // Controller que gera o PDF
);

export default router;