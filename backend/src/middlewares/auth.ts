import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = req.cookies.token || (authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) : null);

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado: Token não fornecido' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Acesso negado: Token inválido' });
  }

  req.user = { userId: decoded.userId };
  next();
};