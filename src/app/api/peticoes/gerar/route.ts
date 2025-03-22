import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

// Configurar o timeout da Edge Function (pode ser até 60 segundos em produção)
export const config = {
  runtime: 'edge',
  maxDuration: 120, // 120 segundos para a Vercel
};

// Conexão singleton com o Prisma para evitar múltiplas conexões
let prismaClient: PrismaClient;

function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

// Log environment variables (partially redacted for security)
console.log("OPENAI_API_KEY disponível:", process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}` : "Não definida");
console.log("ASSISTANT_ID disponível:", process.env.ASSISTANT_ID ? `${process.env.ASSISTANT_ID.substring(0, 10)}...` : "Não definida");

// Inicializar o cliente OpenAI com a chave da API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("Cliente OpenAI inicializado com a chave da API", openai ? "com sucesso" : "falhou");

// Função auxiliar para obter o ID do usuário da sessão
async function getUserId(): Promise<number> {
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return 0;
  }
  
  // Buscar o usuário pelo email
  const prisma = getPrismaClient();
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
    
    // Log das variáveis de ambiente novamente quando a rota é chamada
    console.log("API chamada - OPENAI_API_KEY disponível:", process.env.OPENAI_API_KEY ? "Sim" : "Não");
    console.log("API chamada - ASSISTANT_ID disponível:", process.env.ASSISTANT_ID ? "Sim" : "Não");
    
    const data = await request.json();
    
    // Extrair dados do pedido
    const {
      tipoPeticao,
      customerId,
      processNumber,
      modalidade,
      objeto,
      entity,
      reason,
      description,
      arguments: argumentsText,
      request: requestText,
      autoridade,
      contraparte,
      cidade,
      dataDocumento,
      nomeAdvogado,
      numeroOAB
    } = data;
    
    console.log("Dados recebidos para geração de petição:", {
      tipoPeticao,
      processNumber,
      entity,
      reason,
      description: description?.substring(0, 100) + "...",
    });
    
    // Validar campos obrigatórios
    if (!tipoPeticao || !reason || !description) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios faltando',
        message: 'O tipo de petição, motivo e descrição dos fatos são obrigatórios'
      }, { status: 400 });
    }
    
    // Buscar dados do cliente se um ID foi fornecido
    const prisma = getPrismaClient();
    let clienteInfo = '';
    if (customerId) {
      try {
        const cliente = await prisma.customer.findUnique({
          where: { id: customerId }
        });
        
        if (cliente) {
          // Construir informações do cliente para o prompt
          clienteInfo = `
          Informações do cliente:
          - Razão Social: ${cliente.razaoSocial}
          - CNPJ: ${cliente.cnpj}
          - Endereço Completo: ${cliente.enderecoRua}, ${cliente.enderecoNumero || 'S/N'}${cliente.enderecoComplemento ? ', ' + cliente.enderecoComplemento : ''}, ${cliente.enderecoBairro || ''}, ${cliente.enderecoCidade || ''} - ${cliente.enderecoUF || ''}, CEP: ${cliente.enderecoCEP || ''}
          - Representante Legal: ${cliente.nomeResponsavel || 'Não informado'}
          - Contato: ${cliente.email || 'Email não informado'}, ${cliente.telefone || 'Telefone não informado'}
          
          IMPORTANTE: Use esses dados do cliente na petição, especialmente na qualificação da parte. Refira-se ao cliente pelo nome da empresa (razão social) e inclua seus dados completos nos momentos apropriados do documento.
          `;
        }
      } catch (error) {
        console.error("Erro ao buscar dados do cliente:", error);
      }
    }
    
    // Criar um contexto adicional para a petição
    let contextoAdicional = '';
    if (processNumber) contextoAdicional += `Número do Processo: ${processNumber}. `;
    if (entity) contextoAdicional += `Órgão/Entidade: ${entity}. `;
    if (modalidade) contextoAdicional += `Modalidade: ${modalidade}. `;
    if (objeto) contextoAdicional += `Objeto: ${objeto}. `;
    if (autoridade) contextoAdicional += `Autoridade: ${autoridade}. `;
    if (contraparte) contextoAdicional += `Contraparte: ${contraparte}. `;
    
    // Criar o prompt aprimorado para a OpenAI (reduzido para otimização)
    const prompt = `
    Por favor, gere uma petição completa do tipo ${tipoPeticao} com o seguinte motivo: "${reason}". 
    Os fatos básicos são: "${description}".
    
    É EXTREMAMENTE IMPORTANTE que você ELABORE E EXPANDA os fatos fornecidos, criando uma narrativa jurídica completa.
    
    Preciso que você gere:
    1. Uma versão COMPLETA dos fatos apresentados, expandindo-os significativamente
    2. Argumentos jurídicos baseados nos fatos, com citações de leis relevantes
    3. Pedidos claros e objetivos
    
    ${clienteInfo ? `IMPORTANTE: Esta petição está sendo feita em nome do cliente cuja qualificação foi informada. Inclua seus dados.` : ''}
    
    Formate sua resposta EXATAMENTE neste formato:
    
    # I - DOS FATOS
    [Sua versão completa e expandida dos fatos aqui]
    
    # II - DOS FUNDAMENTOS JURÍDICOS
    [Seus argumentos jurídicos aqui]
    
    # III - DOS PEDIDOS
    [Seus pedidos aqui]
    
    ${contextoAdicional ? `Contexto adicional: ${contextoAdicional}` : ''}
    `;
    
    console.log("Enviando prompt para a OpenAI...");
    
    // Inicializar variável para armazenar o conteúdo da petição
    let peticaoContent = "";
    
    // Usar diretamente o método de chat completions com um timeout reduzido
    try {
      console.log("Usando método de chat completions otimizado...");
      
      // Definir um timeout para a requisição à API da OpenAI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 segundos
      
      const completion = await openai.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `Você é um advogado especializado em petições jurídicas. Seja conciso e direto.` 
          },
          { role: "user", content: prompt }
        ],
        model: "gpt-3.5-turbo", // Usar modelo mais rápido
        temperature: 0.7,
        max_tokens: 2500, // Reduzir tamanho máximo
      }, { signal: controller.signal });
      
      clearTimeout(timeoutId);
      
      peticaoContent = completion.choices[0].message.content || '';
      console.log("Petição gerada com método otimizado. Tamanho:", peticaoContent.length);
    } catch (error) {
      console.error("Erro ao gerar usando método otimizado:", error);
      
      // Fallback para uma versão ainda mais simplificada
      try {
        const fallbackCompletion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: "Gere uma petição jurídica resumida." },
            { role: "user", content: `Tipo: ${tipoPeticao}. Motivo: ${reason}. Fatos: ${description.substring(0, 500)}` }
          ],
          model: "gpt-3.5-turbo",
          temperature: 0.5,
          max_tokens: 1500,
        });
        
        peticaoContent = fallbackCompletion.choices[0].message.content || '';
        console.log("Petição gerada com fallback simplificado. Tamanho:", peticaoContent.length);
      } catch (fallbackError) {
        console.error("Falha completa ao gerar petição:", fallbackError);
        return NextResponse.json({ error: 'Timeout ao gerar petição. Tente novamente com um texto mais curto.' }, { status: 408 });
      }
    }

    console.log("Petição gerada com sucesso. Tamanho total:", peticaoContent.length);
    
    // Extrair seções da petição para análise e validação
    const fatosMatch = peticaoContent.match(/I - DOS FATOS\s*([\s\S]*?)(?=II -|$)/i);
    const fundamentosMatch = peticaoContent.match(/II - DOS FUNDAMENTOS\s*([\s\S]*?)(?=III -|$)/i);
    const pedidosMatch = peticaoContent.match(/III - DOS PEDIDOS\s*([\s\S]*?)(?=IV -|$)/i);
    
    const fatos = fatosMatch ? fatosMatch[1].trim() : '';
    const fundamentos = fundamentosMatch ? fundamentosMatch[1].trim() : '';
    const pedidos = pedidosMatch ? pedidosMatch[1].trim() : '';
    
    // Validar se todas as seções foram geradas adequadamente
    if (fatos.length < 50 || fundamentos.length < 100 || pedidos.length < 30) {
      console.log("Seções da petição incompletas, ajustando conteúdo...");
      console.log(`Tamanho das seções - Fatos: ${fatos.length}, Fundamentos: ${fundamentos.length}, Pedidos: ${pedidos.length}`);
    }
    
    // Salvar a petição no banco de dados
    const peticao = await prisma.petition.create({
      data: {
        processNumber,
        type: tipoPeticao,
        entity,
        reason,
        description,
        arguments: argumentsText || fundamentos,
        request: requestText || pedidos,
        userId: userId,
        modalidade,
        objeto,
        autoridade,
        contraparte,
        cidade,
        dataDocumento,
        nomeAdvogado,
        numeroOAB,
        customerId: customerId || undefined
      } as any // Type assertion para contornar limitações do TypeScript
    });
    
    return NextResponse.json({
      success: true,
      peticaoId: peticao.id,
      content: peticaoContent,
      sections: {
        fatos,
        fundamentos,
        pedidos
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar petição:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar petição', message: (error as Error).message },
      { status: 500 }
    );
  }
} 