import { Router } from 'express';
import { createSaleController, getSales } from '../controllers/saleController';
import { authenticateToken } from '../middleware/auth'; 

const router = Router();

router.post('/', authenticateToken, createSaleController);

router.get('/', authenticateToken, getSales);

export default router;