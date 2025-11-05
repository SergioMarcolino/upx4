
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth'; 
import { getSuppliers, createSupplier } from '../controllers/suppliers-controller';

const router = Router();

router.get('/', authenticateToken, getSuppliers);

router.post('/', authenticateToken, createSupplier);


export default router;