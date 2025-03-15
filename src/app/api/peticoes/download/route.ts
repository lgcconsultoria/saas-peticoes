import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import * as docx from 'docx';
import { saveAs } from 'file-saver';

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
    const { peticaoId, content } = data;
    
    // Verificar se a petição existe e pertence ao usuário
    const peticao = await prisma.petition.findFirst({
      where: {
        id: peticaoId,
        userId: userId
      }
    });
    
    if (!peticao) {
      return NextResponse.json({ error: 'Petição não encontrada' }, { status: 404 });
    }
    
    // Criar o documento DOCX
    const doc = new docx.Document({
      sections: [
        {
          properties: {},
          children: [
            new docx.Paragraph({
              text: content,
              style: "Normal"
            })
          ]
        }
      ]
    });
    
    // Gerar o buffer do documento
    const buffer = await docx.Packer.toBuffer(doc);
    
    // Converter o buffer para base64 para enviar ao cliente
    const base64 = Buffer.from(buffer).toString('base64');
    
    return NextResponse.json({
      success: true,
      fileName: `peticao_${peticaoId}.docx`,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content: base64
    });
    
  } catch (error) {
    console.error('Erro ao gerar documento:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar documento' },
      { status: 500 }
    );
  }
} 