import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import * as docx from 'docx';
import { AlignmentType } from 'docx';
import { prisma } from "@/lib/prisma";
import { saveAs } from "file-saver";

const prismaClient = new PrismaClient();

// Interface para incluir o cliente na consulta
interface PeticaoInclude {
  customer: boolean;
}

// Interface para petição com cliente
interface PeticaoWithCustomer {
  id: number;
  processNumber: string;
  type: string;
  entity: string;
  reason: string;
  description: string;
  arguments: string;
  request: string;
  modalidade?: string | null;
  objeto?: string | null;
  autoridade?: string | null;
  contraparte?: string | null;
  cidade?: string | null;
  dataDocumento?: string | null;
  nomeAdvogado?: string | null;
  numeroOAB?: string | null;
  customer?: {
    id: string;
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    email?: string | null;
    enderecoRua?: string | null;
    enderecoNumero?: string | null;
    enderecoComplemento?: string | null;
    enderecoBairro?: string | null;
    enderecoCidade?: string | null;
    enderecoUF?: string | null;
    enderecoCEP?: string | null;
    nomeResponsavel?: string | null;
  };
}

// Função auxiliar para obter o ID do usuário da sessão
async function getUserId(): Promise<number> {
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return 0;
  }
  
  // Buscar o usuário pelo email
  const user = await prismaClient.user.findUnique({
    where: { email: session.user.email }
  });
  
  return user?.id || 0;
}

// Função para processar o texto e criar parágrafos formatados
function processTextToDocumentParagraphs(content: string): docx.Paragraph[] {
  // Pré-processamento para remover formatação Markdown e aplicar formatação DOCX
  content = preprocessMarkdown(content);
  
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
      // Processar formatação inline (negrito, itálico, etc.)
      const textRuns = processInlineFormatting(line.trim());
      
      // Criar parágrafo para texto normal
      paragraph = new docx.Paragraph({
        ...baseOptions,
        children: textRuns,
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

// Função para pré-processar o texto Markdown
function preprocessMarkdown(text: string): string {
  // Processar cabeçalhos Markdown (# Título)
  text = text.replace(/^#+\s+(.*?)$/gm, '$1');
  
  // Processar listas Markdown
  text = text.replace(/^\s*[-*+]\s+(.*?)$/gm, '• $1');
  text = text.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '$1. $2');
  
  // Processar links Markdown [texto](url)
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
  
  // Processar imagens Markdown ![alt](url)
  text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '$1');
  
  // Processar blocos de código
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```([\s\S]*?)```/g, '$1').trim();
  });
  
  // Processar código inline
  text = text.replace(/`(.*?)`/g, '$1');
  
  // Processar citações
  text = text.replace(/^\s*>\s+(.*?)$/gm, '$1');
  
  // Processar linhas horizontais
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, '');
  
  // Remover espaços extras
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text;
}

// Função para processar formatação inline (negrito, itálico, etc.)
function processInlineFormatting(text: string): docx.TextRun[] {
  // Verificar se o texto contém formatação
  const hasBold = text.includes('**');
  const hasItalic = text.includes('*');
  
  // Remover as marcações de formatação do texto
  let cleanText = text;
  
  // Remover marcações de negrito primeiro (para não confundir com itálico)
  if (hasBold) {
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1');
  }
  
  // Remover marcações de itálico
  if (hasItalic) {
    cleanText = cleanText.replace(/\*(.*?)\*/g, '$1');
  }
  
  // Criar TextRun com a formatação apropriada
  return [
    new docx.TextRun({
      text: cleanText,
      bold: hasBold,
      italics: hasItalic && !hasBold // Aplicar itálico apenas se não for negrito
    })
  ];
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
    const peticao = await prismaClient.petition.findFirst({
      where: {
        id: peticaoId,
        userId: userId
      },
      include: {
        user: true, // Incluir dados do usuário para o documento
        customer: true // Incluir dados do cliente
      } as PeticaoInclude
    }) as PeticaoWithCustomer; // Type assertion para contornar as limitações do TypeScript
    
    if (!peticao) {
      return NextResponse.json({ error: 'Petição não encontrada' }, { status: 404 });
    }
    
    // Criar cabeçalho da petição com os dados do processo
    const headerParagraphs: docx.Paragraph[] = [];
    
    // Título da petição (EXCELENTÍSSIMO SENHOR...)
    headerParagraphs.push(
      new docx.Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new docx.TextRun({
            text: `EXCELENTÍSSIMO(A) SENHOR(A) ${peticao.autoridade || 'DOUTOR(A) JUIZ(A) DE DIREITO'}`,
            bold: true,
            size: 24, // 12pt
          }),
        ],
      })
    );
    
    // Processo
    if (peticao.processNumber) {
      headerParagraphs.push(
        new docx.Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [
            new docx.TextRun({
              text: `Processo nº ${peticao.processNumber}`,
              bold: true,
              size: 24, // 12pt
            }),
          ],
        })
      );
    }
    
    // Separador
    headerParagraphs.push(
      new docx.Paragraph({
        spacing: { after: 480 }, // Espaço maior
        children: [],
      })
    );
    
    // Qualificação do cliente
    if (peticao.customer) {
      const endereco = `${peticao.customer.enderecoRua}, ${peticao.customer.enderecoNumero || 'S/N'}${peticao.customer.enderecoComplemento ? ', ' + peticao.customer.enderecoComplemento : ''}, ${peticao.customer.enderecoBairro || ''}, ${peticao.customer.enderecoCidade || ''} - ${peticao.customer.enderecoUF || ''}, CEP: ${peticao.customer.enderecoCEP || ''}`;
      
      headerParagraphs.push(
        new docx.Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          spacing: { after: 240 },
          children: [
            new docx.TextRun({
              text: `${peticao.customer.razaoSocial}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${peticao.customer.cnpj}, com sede em ${endereco}${peticao.customer.nomeResponsavel ? `, neste ato representada por ${peticao.customer.nomeResponsavel}` : ''}`,
              size: 24, // 12pt
            }),
          ],
        })
      );
    } else if (peticao.entity) {
      headerParagraphs.push(
        new docx.Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          spacing: { after: 240 },
          children: [
            new docx.TextRun({
              text: `${peticao.entity}`,
              size: 24, // 12pt
            }),
          ],
        })
      );
    }
    
    // Tipo de petição e parte introdutória
    let tipoTexto = '';
    switch (peticao.type.toLowerCase()) {
      case 'recurso administrativo':
        tipoTexto = 'RECURSO ADMINISTRATIVO';
        break;
      case 'pedido de reajustamento':
        tipoTexto = 'PEDIDO DE REAJUSTAMENTO';
        break;
      case 'contrarrazões':
        tipoTexto = 'CONTRARRAZÕES AO RECURSO ADMINISTRATIVO';
        break;
      case 'defesa de sanções':
        tipoTexto = 'DEFESA ADMINISTRATIVA';
        break;
      default:
        tipoTexto = peticao.type.toUpperCase();
    }
    
    // Introdução com qualificação
    let introducao = '';
    if (peticao.customer) {
      introducao = `${peticao.customer.razaoSocial}, já devidamente qualificada,`;
    } else if (peticao.entity) {
      introducao = `${peticao.entity},`;
    }
    introducao += ' devidamente qualificado nos autos do processo em epígrafe, vem, respeitosamente, à presença de Vossa Excelência, por intermédio de seu advogado que esta subscreve, apresentar';
    
    headerParagraphs.push(
      new docx.Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: 720 },
        spacing: { after: 240 },
        children: [
          new docx.TextRun({
            text: introducao,
            size: 24, // 12pt
          }),
        ],
      })
    );
    
    // Tipo de petição em destaque
    headerParagraphs.push(
      new docx.Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240 },
        children: [
          new docx.TextRun({
            text: tipoTexto,
            bold: true,
            size: 24, // 12pt
          }),
        ],
      })
    );
    
    // Contraparte
    if (peticao.contraparte) {
      headerParagraphs.push(
        new docx.Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          spacing: { after: 480 },
          children: [
            new docx.TextRun({
              text: `em face de ${peticao.contraparte}, pelas razões de fato e de direito a seguir expostas.`,
              size: 24, // 12pt
            }),
          ],
        })
      );
    } else {
      headerParagraphs.push(
        new docx.Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          spacing: { after: 480 },
          children: [
            new docx.TextRun({
              text: `pelas razões de fato e de direito a seguir expostas.`,
              size: 24, // 12pt
            }),
          ],
        })
      );
    }
    
    // Processar o conteúdo principal e criar parágrafos formatados
    const contentParagraphs = processTextToDocumentParagraphs(content);
    
    // Criar rodapé da petição
    const footerParagraphs: docx.Paragraph[] = [];
    
    // Cidade e data
    if (peticao.cidade || peticao.dataDocumento) {
      const dataFormatada = peticao.dataDocumento ? formatarData(peticao.dataDocumento) : 'data atual';
      const cidadeData = `${peticao.cidade || 'Local'}, ${dataFormatada}.`;
      footerParagraphs.push(
        new docx.Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 480, after: 480 },
          children: [
            new docx.TextRun({
              text: cidadeData,
              size: 24, // 12pt
            }),
          ],
        })
      );
    }
    
    // Espaço para assinatura
    footerParagraphs.push(
      new docx.Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 240 },
        children: [
          new docx.TextRun({
            text: '________________________________________',
            size: 24, // 12pt
          }),
        ],
      })
    );
    
    // Nome do advogado e OAB
    if (peticao.nomeAdvogado || peticao.numeroOAB) {
      footerParagraphs.push(
        new docx.Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [
            new docx.TextRun({
              text: `${peticao.nomeAdvogado || 'Advogado'}`,
              bold: true,
              size: 24, // 12pt
            }),
          ],
        })
      );
      
      if (peticao.numeroOAB) {
        footerParagraphs.push(
          new docx.Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new docx.TextRun({
                text: `OAB ${peticao.numeroOAB}`,
                size: 24, // 12pt
              }),
            ],
          })
        );
      }
    }
    
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
          children: [...headerParagraphs, ...contentParagraphs, ...footerParagraphs],
        },
      ],
    });
    
    // Gerar o buffer do documento
    const buffer = await docx.Packer.toBuffer(doc);
    
    // Converter o buffer para base64 para enviar ao cliente
    const base64 = Buffer.from(buffer).toString('base64');
    
    return NextResponse.json({
      success: true,
      fileName: `${formatarNomeArquivo(peticao.type)}_${peticaoId}.docx`,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content: base64
    });
    
  } catch (error) {
    console.error('Erro ao gerar documento:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar documento', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Função para formatar a data no padrão brasileiro
function formatarData(data?: string): string {
  if (!data) return '';
  
  try {
    // Formato esperado: YYYY-MM-DD
    const [ano, mes, dia] = data.split('-');
    
    // Lista de meses em português
    const meses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    return `${dia} de ${meses[parseInt(mes) - 1]} de ${ano}`;
  } catch (_) {
    return data;
  }
}

// Função para formatar o nome do arquivo
function formatarNomeArquivo(tipo: string): string {
  const tipoFormatado = tipo
    .toLowerCase()
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  return tipoFormatado;
} 