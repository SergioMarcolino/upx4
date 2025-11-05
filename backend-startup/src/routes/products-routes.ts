import { Router } from 'express';
import { 
    createProduct, 
    getProducts, 
    updateProduct, 
    getProductById, 
    deleteProduct,
    adjustStock
} from '../controllers/products-controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', getProducts); 

router.post('/', authenticateToken, createProduct);

router.get('/:id', authenticateToken, getProductById);

router.put('/:id', authenticateToken, updateProduct);

router.delete('/:id', authenticateToken, deleteProduct);

router.post('/adjust', authenticateToken, adjustStock);

export default router;