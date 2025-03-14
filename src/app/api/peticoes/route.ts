import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// Função auxiliar para obter o ID do usuário da sessão
async function getUserId(): Promise<number> {
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return 0;
  }
  
  // Buscar o usuário pelo email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  
  return user?.id || 0;
}

// GET /api/peticoes - Listar todas as petições
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    const peticoes = await prisma.petition.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(peticoes);
  } catch (error) {
    console.error('Erro ao buscar petições:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar petições' },
      { status: 500 }
    );
  }
}

// POST /api/peticoes - Salvar uma nova petição
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    const data = await request.json();
    
    // Extrair dados da petição gerada pela API Python
    const {
      peticao_id,
      nome_arquivo,
      download_url,
      cliente_id,
      template_id,
      dados_peticao
    } = data;
    
    // Extrair dados adicionais da petição
    const {
      numero_processo = '',
      vara = '',
      comarca = ''
    } = dados_peticao || {};
    
    // Criar a petição no banco de dados
    const peticao = await prisma.petition.create({
      data: {
        processNumber: numero_processo,
        type: template_id,
        entity: vara,
        reason: comarca,
        description: `Petição gerada a partir do template ${template_id} para o cliente ${cliente_id}`,
        arguments: JSON.stringify(dados_peticao || {}),
        request: `Arquivo: ${nome_arquivo}, ID: ${peticao_id}`,
        userId: userId
      }
    });
    
    return NextResponse.json(peticao, { status: 201 });
  } catch (error) {
    console.error('Erro ao salvar petição:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar petição no banco de dados' },
      { status: 500 }
    );
  }
} 