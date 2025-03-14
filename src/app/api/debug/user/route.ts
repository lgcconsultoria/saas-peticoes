import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { compareSync } from 'bcrypt-ts';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }
    
    console.log(`Verificando usuário: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Informações seguras para retornar (sem a senha completa)
    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordFormat: {
        length: user.password.length,
        isHashed: user.password.startsWith('$2'),
        prefix: user.password.substring(0, 7) + '...'
      }
    };
    
    // Se a senha foi fornecida, verificar
    if (password) {
      const isPasswordValid = compareSync(password, user.password);
      return NextResponse.json({ 
        ...userInfo, 
        passwordValid: isPasswordValid 
      });
    }
    
    return NextResponse.json(userInfo);
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return NextResponse.json({ error: 'Erro ao verificar usuário' }, { status: 500 });
  }
} 