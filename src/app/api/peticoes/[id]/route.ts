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

// Rota PUT para atualizar uma petição existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    const peticaoId = parseInt(params.id);
    
    // Verificar se a petição existe e pertence ao usuário
    const peticaoExistente = await prisma.petition.findFirst({
      where: {
        id: peticaoId,
        userId: userId
      }
    });
    
    if (!peticaoExistente) {
      return NextResponse.json({ error: 'Petição não encontrada' }, { status: 404 });
    }
    
    // Obter os dados da requisição
    const data = await request.json();
    const { tipoPeticao, processNumber, entity, reason, description, arguments: argumentsText, request: requestText } = data;
    
    // Atualizar a petição no banco de dados
    const peticaoAtualizada = await prisma.petition.update({
      where: {
        id: peticaoId
      },
      data: {
        type: tipoPeticao,
        processNumber,
        entity,
        reason,
        description,
        arguments: argumentsText,
        request: requestText
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Petição atualizada com sucesso',
      peticao: peticaoAtualizada
    });
    
  } catch (error) {
    console.error('Erro ao atualizar petição:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar petição' },
      { status: 500 }
    );
  }
}

// Rota DELETE para excluir uma petição
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    const peticaoId = parseInt(params.id);
    
    // Verificar se a petição existe e pertence ao usuário
    const peticaoExistente = await prisma.petition.findFirst({
      where: {
        id: peticaoId,
        userId: userId
      }
    });
    
    if (!peticaoExistente) {
      return NextResponse.json({ error: 'Petição não encontrada' }, { status: 404 });
    }
    
    // Excluir a petição do banco de dados
    await prisma.petition.delete({
      where: {
        id: peticaoId
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Petição excluída com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir petição:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir petição' },
      { status: 500 }
    );
  }
}

// Rota GET para obter uma petição específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    const peticaoId = parseInt(params.id);
    
    // Buscar a petição no banco de dados
    const peticao = await prisma.petition.findFirst({
      where: {
        id: peticaoId,
        userId: userId
      }
    });
    
    if (!peticao) {
      return NextResponse.json({ error: 'Petição não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      peticao
    });
    
  } catch (error) {
    console.error('Erro ao buscar petição:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar petição' },
      { status: 500 }
    );
  }
} 