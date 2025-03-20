import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Buscar todos os clientes ativos do banco de dados
    const customers = await prisma.customer.findMany({
      where: {
        ativo: true,
        ehCliente: true
      },
      select: {
        id: true,
        razaoSocial: true,
        nomeFantasia: true,
        cnpj: true
      },
      orderBy: {
        razaoSocial: 'asc'
      }
    });

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao buscar os clientes.' },
      { status: 500 }
    );
  }
} 