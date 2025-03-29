import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import * as docx from 'docx';
import { AlignmentType, Document, Packer } from 'docx';
import { prisma } from "@/lib/prisma";
import { saveAs } from "file-saver";
import * as fs from 'fs/promises';
import path from "path";
// Importar as dependências para manipulação de templates DOCX
import PizZip from 'pizzip';
import Docxtemplater from "docxtemplater";
import { writeFile } from "fs/promises";
import { promisify } from "util";
import { mkdir } from "fs/promises";
import { readFile } from "fs/promises";

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

// Função para extrair seções do conteúdo da petição
function extrairSecoes(content: string): { fatos: string, argumentos: string, pedidos: string } {
  // Valores padrão
  let fatos = '';
  let argumentos = '';
  let pedidos = '';
  
  // Verificar se o conteúdo é válido
  if (!content || typeof content !== 'string') {
    console.warn('Conteúdo inválido fornecido para extrairSecoes');
    return { fatos, argumentos, pedidos };
  }
  
  try {
    // Extrair cada seção usando expressões regulares
    // Padrão 1: FATOS: texto ARGUMENTOS: texto PEDIDO: texto
    const fatosMatch = content.match(/FATOS:?\s*([\s\S]*?)(?=ARGUMENTOS:?|$)/i);
    const argumentosMatch = content.match(/ARGUMENTOS:?\s*([\s\S]*?)(?=PEDIDO:?|$)/i);
    const pedidosMatch = content.match(/PEDIDO:?\s*([\s\S]*?)(?=$)/i);
    
    // Padrão 2: DOS FATOS texto DOS ARGUMENTOS JURÍDICOS texto DOS PEDIDOS texto
    if (!fatosMatch) {
      const fatosMatch2 = content.match(/DOS FATOS\s*([\s\S]*?)(?=DOS ARGUMENTOS|$)/i);
      if (fatosMatch2) fatos = fatosMatch2[1].trim();
    } else {
      fatos = fatosMatch[1].trim();
    }
    
    if (!argumentosMatch) {
      const argumentosMatch2 = content.match(/DOS ARGUMENTOS(?: JURÍDICOS)?\s*([\s\S]*?)(?=DOS PEDIDOS|$)/i);
      if (argumentosMatch2) argumentos = argumentosMatch2[1].trim();
    } else {
      argumentos = argumentosMatch[1].trim();
    }
    
    if (!pedidosMatch) {
      const pedidosMatch2 = content.match(/DOS PEDIDOS\s*([\s\S]*?)(?=$)/i);
      if (pedidosMatch2) pedidos = pedidosMatch2[1].trim();
    } else {
      pedidos = pedidosMatch[1].trim();
    }
    
    // Se não encontrar usando os padrões acima, tenta dividir o texto em partes
    if (!fatos && !argumentos && !pedidos) {
      const partes = content.split(/\n\n|\r\n\r\n/);
      
      if (partes.length >= 3) {
        fatos = partes[0].trim();
        argumentos = partes[1].trim();
        pedidos = partes[2].trim();
      } else if (partes.length === 2) {
        fatos = partes[0].trim();
        argumentos = partes[1].trim();
      } else if (partes.length === 1) {
        fatos = partes[0].trim();
      }
    }
    
    console.log('Extração de seções concluída:');
    console.log(`Fatos: ${fatos.substring(0, 50)}${fatos.length > 50 ? '...' : ''}`);
    console.log(`Argumentos: ${argumentos.substring(0, 50)}${argumentos.length > 50 ? '...' : ''}`);
    console.log(`Pedidos: ${pedidos.substring(0, 50)}${pedidos.length > 50 ? '...' : ''}`);
    
  } catch (error) {
    console.error('Erro ao extrair seções:', error);
  }
  
  return {
    fatos: fatos || 'Não foi possível extrair os fatos.',
    argumentos: argumentos || 'Não foi possível extrair os argumentos.',
    pedidos: pedidos || 'Não foi possível extrair os pedidos.'
  };
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { peticaoId, content, teste } = data;
    
    // Verificar se está em modo de teste
    const modoTeste = teste === true;
    
    let userId = 0;
    let peticao: PeticaoWithCustomer | null = null;
    
    // Bypass de autenticação para testes
    if (!modoTeste) {
      const session = await getServerSession();
      
      if (!session) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
      
      userId = await getUserId();
      
      if (!userId) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      
      // Verificar se a petição existe e pertence ao usuário
      peticao = await prismaClient.petition.findFirst({
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
    } else {
      console.log('Modo de teste ativado - usando dados simulados');
      // Criar um objeto simulado para testes
      peticao = {
        id: 1,
        processNumber: 'Processo Administrativo nº 123/2023',
        type: 'recurso',
        entity: 'Prefeitura Municipal de São Paulo',
        reason: 'Desclassificação indevida em processo licitatório',
        description: 'Descrição detalhada do processo licitatório',
        arguments: 'Argumentos jurídicos detalhados sobre o processo',
        request: 'Pedidos específicos para o recurso',
        modalidade: 'Pregão Eletrônico',
        objeto: 'Contratação de serviços de TI',
        autoridade: 'EXCELENTÍSSIMO(A) SENHOR(A)',
        contraparte: 'Prefeitura Municipal de São Paulo',
        cidade: 'São Paulo',
        dataDocumento: '2023-03-20',
        nomeAdvogado: 'Dr. José Santos',
        numeroOAB: 'SP 123.456',
        customer: {
          id: '1',
          razaoSocial: 'Empresa XYZ Ltda.',
          nomeFantasia: 'XYZ Tecnologia',
          cnpj: '12.345.678/0001-90',
          email: 'contato@xyz.com.br',
          enderecoRua: 'Av. Paulista',
          enderecoNumero: '1000',
          enderecoComplemento: 'Sala 100',
          enderecoBairro: 'Bela Vista',
          enderecoCidade: 'São Paulo',
          enderecoUF: 'SP',
          enderecoCEP: '01310-100',
          nomeResponsavel: 'João da Silva'
        }
      };
    }
    
    // Extrair as seções do conteúdo
    const { fatos, argumentos, pedidos } = extrairSecoes(content);
    
    // Converter os dados da petição para o formato esperado pelo Docxtemplater
    const dadosParaTemplate: Record<string, string> = {
      COMPETENTE: peticao.autoridade || '',
      CIDADE: peticao.cidade || '',
      MODALIDADE: peticao.modalidade || '',
      PROCESSO: peticao.processNumber || '',
      OBJETO: peticao.objeto || '',
      INTRODUCAO: (peticao.customer?.razaoSocial ? peticao.customer.razaoSocial : (peticao.entity || ' ')) + 
        (peticao.customer?.cnpj ? (`, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${peticao.customer.cnpj}`) : ' ') + 
        ', vem, respeitosamente, apresentar ' + 
        (peticao.type ? peticao.type.toUpperCase() : 'RECURSO ADMINISTRATIVO') +
        (peticao.contraparte ? (` contra ${peticao.contraparte}`) : ' ') + 
        ', pelos motivos de fato e de direito a seguir expostos.',
      TEMPESTIVIDADE: `O presente ${peticao.type || 'recurso'} é tempestivo, conforme estabelecido na legislação aplicável.`,
      FATOS: fatos || 'Não foi possível extrair os fatos.',
      ARGUMENTOS: argumentos || 'Não foi possível extrair os argumentos.',
      EXEQUIBILIDADE: 'A proposta apresentada é plenamente exequível, conforme demonstrado nos documentos anexos.',
      CONCLUSAO: `Diante do exposto, requer-se o provimento do presente ${peticao.type || 'recurso'}.`,
      PEDIDO: pedidos || 'Não foi possível extrair os pedidos.',
      DATA: peticao.dataDocumento ? formatarData(peticao.dataDocumento) : formatarData(new Date().toISOString().split('T')[0]),
      NOME_ADVOGADO: peticao.nomeAdvogado || ' ',
      NUMERO_OAB: peticao.numeroOAB ? `OAB ${peticao.numeroOAB}` : ' ',
    };
    
    // Logar quaisquer valores undefined
    Object.entries(dadosParaTemplate).forEach(([chave, valor]) => {
      if (!valor) {
        console.warn(`Valor não definido para ${chave}, substituindo por string vazia`);
      }
    });

    // Caminho do arquivo de template
    const templatePath = path.join(process.cwd(), "templates", "recurso_administrativo.docx");
    
    // Ler o arquivo template como binário
    const content2 = await fs.readFile(templatePath, { encoding: 'binary' });
    
    // Criar o zip
    const zip = new PizZip(content2);
    
    // Verificar se o documento.xml existe no arquivo
    if (!zip.files['word/document.xml']) {
      throw new Error('Arquivo word/document.xml não encontrado no template DOCX');
    }
    
    // Criar o docxtemplater com as opções corretas
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '[[',
        end: ']]'
      }
    });
    
    // Renderizar com os dados
    doc.render(dadosParaTemplate);
    
    // Gerar o documento de saída
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    // Verificar se há placeholders não substituídos
    const xmlContent = zip.files['word/document.xml'].asText();
    const placeholderRegex = /\[\[(.*?)\]\]/g;
    const placeholdersRestantes = xmlContent.match(placeholderRegex);
    
    if (placeholdersRestantes && placeholdersRestantes.length > 0) {
      console.warn(`AVISO: ${placeholdersRestantes.length} placeholders não foram substituídos:`);
      const uniquePlaceholders = [...new Set(placeholdersRestantes)];
      uniquePlaceholders.forEach(p => console.warn(`  - ${p}`));
    }

    // Converter o arquivo para base64 e enviar como resposta
    const base64 = Buffer.from(buf).toString('base64');
    
    return NextResponse.json({
      success: true,
      fileName: `${formatarNomeArquivo(peticao.type)}_${peticaoId}.docx`,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content: base64
    });

  } catch (error) {
    console.error("Erro ao gerar a petição:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao gerar a petição" },
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