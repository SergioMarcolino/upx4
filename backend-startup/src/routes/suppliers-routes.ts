// Em src/routes/suppliers-routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth'; 
import { getSuppliers, createSupplier } from '../controllers/suppliers-controller';

const router = Router();

// GET /api/suppliers (Listar) - Precisa estar logado para ver
router.get('/', authenticateToken, getSuppliers);

// POST /api/suppliers (Criar) - Precisa estar logado para criar
router.post('/', authenticateToken, createSupplier);

// (Poderia adicionar PUT /:id, DELETE /:id, GET /:id aqui se necessário no futuro)

export default router;