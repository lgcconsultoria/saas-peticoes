import { Router } from 'express';
import { signup, login, logout, getMe } from '../controllers/auth';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/register', signup);
router.post('/', login);
router.post('/logout', logout);

router.get('/dashboard', authMiddleware, getMe);

export default router;