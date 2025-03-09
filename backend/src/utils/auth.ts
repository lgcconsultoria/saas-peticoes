import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Hash senha
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Verificar senha
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Gerar token JWT
export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

// Verificar token JWT
export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};