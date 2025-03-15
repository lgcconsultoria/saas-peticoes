import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import * as docx from 'docx';
import { AlignmentType } from 'docx';

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

// Função para processar o texto e criar parágrafos formatados
function processTextToDocumentParagraphs(content: string): docx.Paragraph[] {
  // Dividir o conteúdo em linhas
  const lines = content.split('\n');
  const paragraphs: docx.Paragraph[] = [];
  
  let inList = false;
  let listItemNumber = 1;
  
  // Processar cada linha
  lines.forEach((line, index) => {
    // Pular linhas vazias mas adicionar espaço
    if (line.trim() === '') {
      paragraphs.push(new docx.Paragraph({
        spacing: {
          after: 200,
        },
      }));
      return;
    }
    
    // Verificar se é um título (em maiúsculas)
    const isTitle = line.trim() === line.trim().toUpperCase() && line.trim().length > 3;
    
    // Verificar se é o cabeçalho (primeiras linhas)
    const isHeader = index < 5 && (line.includes('EXCELENTÍSSIMO') || line.includes('ILUSTRÍSSIMO') || line.includes('SENHOR'));
    
    // Verificar se é uma assinatura (últimas linhas)
    const isSignature = index > lines.length - 5 && (line.includes('Advogado') || line.includes('OAB'));
    
    // Verificar se é um item de lista numerada
    const listItemMatch = line.trim().match(/^(\d+)[\.\)]\s+(.+)$/);
    const isListItem = !!listItemMatch;
    
    // Verificar se é um item de lista com marcadores
    const bulletListItemMatch = line.trim().match(/^[\-\*•]\s+(.+)$/);
    const isBulletListItem = !!bulletListItemMatch;
    
    // Verificar se é uma citação (recuada e com fonte menor)
    const isCitation = line.trim().startsWith('"') && line.trim().endsWith('"') && line.trim().length > 20;
    
    // Verificar se é uma data/local (geralmente no final)
    const isDateLocation = index > lines.length - 10 && 
                          (line.includes('de') && 
                           (line.includes('janeiro') || line.includes('fevereiro') || 
                            line.includes('março') || line.includes('abril') || 
                            line.includes('maio') || line.includes('junho') || 
                            line.includes('julho') || line.includes('agosto') || 
                            line.includes('setembro') || line.includes('outubro') || 
                            line.includes('novembro') || line.includes('dezembro')));
    
    // Configurações básicas do parágrafo
    const baseOptions = {
      style: isTitle ? "Heading2" : "Normal",
      alignment: isTitle || isHeader ? AlignmentType.CENTER : 
                isSignature || isDateLocation ? AlignmentType.CENTER : 
                isListItem || isBulletListItem ? AlignmentType.LEFT : 
                AlignmentType.JUSTIFIED,
      spacing: {
        before: isTitle ? 400 : 200,
        after: isTitle ? 400 : 200,
        line: 360, // Espaçamento entre linhas (1.5)
      },
      indent: {
        firstLine: isTitle || isHeader || isSignature || isListItem || isBulletListItem ? 0 : 720, // Recuo de primeira linha para parágrafos normais
      },
    };
    
    let paragraph: docx.Paragraph;
    
    // Configurações específicas para cada tipo de parágrafo
    if (isListItem) {
      // Extrair o número e o texto do item
      const itemNumber = parseInt(listItemMatch![1]);
      const itemText = listItemMatch![2];
      
      // Resetar a contagem se o número for 1 e não estávamos em uma lista ou se o número for menor que o anterior
      if ((itemNumber === 1 && !inList) || (inList && itemNumber < listItemNumber)) {
        inList = true;
        listItemNumber = 1;
      }
      
      // Criar parágrafo para item de lista numerada
      paragraph = new docx.Paragraph({
        ...baseOptions,
        bullet: {
          level: 0,
        },
        numbering: {
          reference: "petitionList",
          level: 0,
          instance: itemNumber === 1 ? listItemNumber : undefined,
        },
        indent: {
          left: 720, // Recuo à esquerda para itens de lista
          hanging: 360, // Recuo suspenso para a numeração
        },
        children: [
          new docx.TextRun({
            text: itemText,
          }),
        ],
      });
      
      listItemNumber++;
    } else if (isBulletListItem) {
      // Extrair o texto do item
      const itemText = bulletListItemMatch![1];
      
      // Criar parágrafo para item de lista com marcadores
      paragraph = new docx.Paragraph({
        ...baseOptions,
        bullet: {
          level: 0,
        },
        indent: {
          left: 720, // Recuo à esquerda para itens de lista
          hanging: 360, // Recuo suspenso para o marcador
        },
        children: [
          new docx.TextRun({
            text: itemText,
          }),
        ],
      });
    } else if (isCitation) {
      // Criar parágrafo para citação
      paragraph = new docx.Paragraph({
        ...baseOptions,
        indent: {
          left: 1440, // Recuo maior para citações
          right: 1440,
        },
        children: [
          new docx.TextRun({
            text: line.trim(),
            italics: true,
            size: 22, // Tamanho menor (11pt)
          }),
        ],
      });
    } else if (isDateLocation) {
      // Criar parágrafo para data/local
      paragraph = new docx.Paragraph({
        ...baseOptions,
        alignment: AlignmentType.RIGHT,
        children: [
          new docx.TextRun({
            text: line.trim(),
          }),
        ],
      });
    } else {
      // Criar parágrafo para texto normal
      paragraph = new docx.Paragraph({
        ...baseOptions,
        children: [
          new docx.TextRun({
            text: line.trim(),
          }),
        ],
      });
    }
    
    paragraphs.push(paragraph);
    
    // Atualizar o estado da lista
    if (!isListItem && !isBulletListItem) {
      inList = false;
    }
  });
  
  return paragraphs;
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
    
    // Processar o conteúdo e criar parágrafos formatados
    const paragraphs = processTextToDocumentParagraphs(content);
    
    // Criar o documento DOCX com formatação adequada
    const doc = new docx.Document({
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: {
              font: "Times New Roman",
              size: 24, // 12pt
            },
            paragraph: {
              spacing: {
                line: 360, // Espaçamento entre linhas (1.5)
                before: 200,
                after: 200,
              },
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            run: {
              font: "Times New Roman",
              size: 24, // 12pt
              bold: true,
            },
            paragraph: {
              spacing: {
                before: 400,
                after: 400,
              },
            },
          },
        ],
      },
      numbering: {
        config: [
          {
            reference: "petitionList",
            levels: [
              {
                level: 0,
                format: "decimal",
                text: "%1.",
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: 720, hanging: 360 },
                  },
                },
              },
              {
                level: 1,
                format: "lowerLetter",
                text: "%2)",
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: 1440, hanging: 360 },
                  },
                },
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 polegada (720 = 0.5 polegada)
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: paragraphs,
        },
      ],
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