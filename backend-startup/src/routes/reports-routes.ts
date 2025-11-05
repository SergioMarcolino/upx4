import { Router } from 'express';
import { authenticateToken } from '../middleware/auth'; 
import { getStockFinancialReport } from '../controllers/reports-controller';

const router = Router();

router.get(
    '/stock-financial/:year/:month', 
    authenticateToken,                 
    getStockFinancialReport          
);

export default router;