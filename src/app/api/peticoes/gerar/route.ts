import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Inicializar o cliente OpenAI com a chave da API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    
    const {
      tipoPeticao,
      processNumber,
      entity,
      reason,
      description,
      arguments: argumentsText,
      request: requestText
    } = data;
    
    // Criar o prompt para a OpenAI
    const prompt = `
    Gere uma petição jurídica do tipo "${tipoPeticao}" com as seguintes informações:
    
    Número do Processo: ${processNumber}
    Órgão/Entidade: ${entity}
    Motivo: ${reason}
    Descrição dos Fatos: ${description}
    Argumentos Jurídicos: ${argumentsText}
    Pedido: ${requestText}
    
    A petição deve seguir o formato padrão jurídico brasileiro, incluindo cabeçalho, qualificação das partes, 
    fatos, fundamentos jurídicos, pedidos e fechamento. Use linguagem formal e técnica apropriada para documentos jurídicos.
    `;
    
    // Chamar a API da OpenAI para gerar o conteúdo da petição
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "Você é um assistente jurídico especializado em redigir petições jurídicas no formato brasileiro." },
        { role: "user", content: prompt }
      ],
      model: "gpt-3.5-turbo",
    });
    
    const peticaoContent = completion.choices[0].message.content;
    
    // Salvar a petição no banco de dados
    const peticao = await prisma.petition.create({
      data: {
        processNumber,
        type: tipoPeticao,
        entity,
        reason,
        description,
        arguments: argumentsText,
        request: requestText,
        userId: userId
      }
    });
    
    return NextResponse.json({
      success: true,
      peticaoId: peticao.id,
      content: peticaoContent
    });
    
  } catch (error) {
    console.error('Erro ao gerar petição:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar petição' },
      { status: 500 }
    );
  }
} 