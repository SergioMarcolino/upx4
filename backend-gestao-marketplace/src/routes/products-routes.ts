import { Router } from 'express';
// 👇 1. Importe as funções que faltam do controller
import { 
    createProduct, 
    getProducts, 
    updateProduct, 
    getProductById, 
    deleteProduct 
} from '../controllers/products-controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/products (Listar todos) - Rota PÚBLICA (ou PROTEGIDA, se preferir)
// Nota: Removi o authenticateToken aqui baseado no seu código anterior, 
// mas você pode querer adicioná-lo de volta se a listagem deve ser privada.
router.get('/', getProducts); 

// POST /api/products (Criar) - Rota PROTEGIDA
router.post('/', authenticateToken, createProduct);

// GET /api/products/:id (Buscar um) - Rota PROTEGIDA
// 👇 2. Adicione a rota GET por ID
router.get('/:id', authenticateToken, getProductById);

// PUT /api/products/:id (Atualizar) - Rota PROTEGIDA
router.put('/:id', authenticateToken, updateProduct);

// DELETE /api/products/:id (Excluir) - Rota PROTEGIDA
// 👇 3. Adicione a rota DELETE
router.delete('/:id', authenticateToken, deleteProduct);

export default router;