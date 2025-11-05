import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { login, register } from "../controllers/auth-controller";

const router = Router();

router.post('/login', login); 
router.post('/register', register); 

router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    message: 'Perfil do usuário',
    user: {
      id: req.user?.userId,
      email: req.user?.email
    }
  });
});

export default router;