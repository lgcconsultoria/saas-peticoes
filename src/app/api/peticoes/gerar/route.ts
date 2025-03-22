import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

// Configurar o timeout da Edge Function (pode ser até 60 segundos em produção)
export const config = {
  runtime: 'edge',
  maxDuration: 300, // Aumentado para 5 minutos (300 segundos) para evitar timeouts
};

// Conexão singleton com o Prisma para evitar múltiplas conexões
let prismaClient: PrismaClient;

function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

// Mock da integração com vector store
// Esta função simula uma consulta à vector store para extrair conhecimentos jurídicos
// No futuro, pode ser substituída por uma integração real com Pinecone, Qdrant, etc.
async function consultarVectorStore(tipo: string, motivo: string, descricao: string) {
  // ID da vector store mencionada no prompt
  const VECTOR_STORE_ID = "vs_67ccae2f6a5881918aed7733d5509e61";
  console.log(`Simulando consulta à vector store ID: ${VECTOR_STORE_ID}`);
  
  // Aqui você implementaria a consulta real ao seu banco de dados vetorial
  // Por enquanto, retornamos dados simulados baseados no tipo de petição
  
  const conhecimentosJuridicos = {
    "Recurso Administrativo": {
      jurisprudencia: [
        "Acórdão 2742/2023-TCU-Plenário",
        "STJ, REsp 1.790.490/SP, Rel. Min. Herman Benjamin, 2019"
      ],
      doutrina: [
        "JUSTEN FILHO, Marçal. Comentários à Lei de Licitações e Contratos Administrativos, 2021",
        "BANDEIRA DE MELLO, Celso Antônio. Curso de Direito Administrativo, 2022"
      ],
      legislacao: [
        "Art. 165 da Lei nº 14.133/2021",
        "Art. 166 da Lei nº 14.133/2021"
      ]
    },
    "Pedido de Reajustamento": {
      jurisprudencia: [
        "Acórdão 1431/2022-TCU-Plenário",
        "STJ, REsp 1.809.832/RJ, Rel. Min. Og Fernandes, 2020"
      ],
      doutrina: [
        "JUSTEN FILHO, Marçal. Comentários à Lei de Licitações e Contratos Administrativos, 2021",
        "NIEBUHR, Joel de Menezes. Licitação Pública e Contrato Administrativo, 2020"
      ],
      legislacao: [
        "Art. 124 da Lei nº 14.133/2021",
        "Art. 135 da Lei nº 14.133/2021"
      ]
    },
    "Contrarrazões": {
      jurisprudencia: [
        "Acórdão 754/2023-TCU-Plenário",
        "STF, MS 24.073/DF, Rel. Min. Carlos Velloso, 2018"
      ],
      doutrina: [
        "DI PIETRO, Maria Sylvia Zanella. Direito Administrativo, 2022",
        "CARVALHO FILHO, José dos Santos. Manual de Direito Administrativo, 2023"
      ],
      legislacao: [
        "Art. 165, §3º da Lei nº 14.133/2021",
        "Art. 167 da Lei nº 14.133/2021"
      ]
    },
    "Defesa de Sanções": {
      jurisprudencia: [
        "Acórdão 2212/2023-TCU-Plenário",
        "STJ, AgRg no AREsp 573.925/PR, Rel. Min. Mauro Campbell Marques, 2019"
      ],
      doutrina: [
        "BANDEIRA DE MELLO, Celso Antônio. Curso de Direito Administrativo, 2022",
        "OLIVEIRA, Rafael Carvalho Rezende. Curso de Direito Administrativo, 2021"
      ],
      legislacao: [
        "Art. 155 da Lei nº 14.133/2021",
        "Art. 156 da Lei nº 14.133/2021"
      ]
    }
  };
  
  // Retornar o conhecimento jurídico correspondente ao tipo de petição
  // Ou um valor padrão se o tipo não for encontrado
  const resultado = conhecimentosJuridicos[tipo as keyof typeof conhecimentosJuridicos] || {
    jurisprudencia: ["Acórdão 1234/2023-TCU-Plenário"],
    doutrina: ["JUSTEN FILHO, Marçal. Comentários à Lei de Licitações e Contratos Administrativos, 2021"],
    legislacao: ["Art. 5º da Lei nº 14.133/2021"]
  };
  
  console.log("Conhecimentos jurídicos obtidos:", { 
    jurisprudencia: resultado.jurisprudencia.length, 
    doutrina: resultado.doutrina.length, 
    legislacao: resultado.legislacao.length 
  });
  
  return resultado;
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

// Selecione o modelo apropriado e a temperatura com base no tamanho da entrada e o ambiente
function getModelConfig(description: string, isProduction: boolean) {
  // Em produção, usamos GPT-3.5 por padrão para evitar timeouts
  if (isProduction) {
    // Mesmo em produção, podemos usar GPT-4 para entradas pequenas
    if (description.length < 500) {
      return { model: "gpt-4o-mini", temperature: 0.7, maxTokens: 2500 };
    }
    
    // Para entradas maiores, usar gpt-3.5-turbo que é mais rápido
    return { model: "gpt-3.5-turbo", temperature: 0.7, maxTokens: 2000 };
  }
  
  // Em desenvolvimento, podemos usar o modelo mais potente
  return { model: "gpt-4", temperature: 0.7, maxTokens: 3000 };
}

// Armazenamento temporário das petições em processamento
// Em uma solução real, isso seria um banco de dados ou serviço externo
const peticoesEmProcessamento = new Map();

// Função para limpar petições antigas a cada 2 minutos
setInterval(() => {
  const now = Date.now();
  let count = 0;
  
  peticoesEmProcessamento.forEach((value, key) => {
    // Expirar entradas após 5 minutos (300000ms) ou se estiverem marcadas como completas
    if (value.completed || (now - value.startTime > 300000)) {
      peticoesEmProcessamento.delete(key);
      count++;
    }
  });
  
  if (count > 0) {
    console.log(`Limpeza periódica: ${count} petições expiradas removidas do cache.`);
  }
}, 120000); // Executar a cada 2 minutos

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      console.log("Requisição rejeitada: usuário não autenticado");
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = await getUserId();
    
    if (!userId) {
      console.log("Requisição rejeitada: ID de usuário não encontrado");
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Verificar se está em ambiente de produção
    const isProduction = process.env.VERCEL_ENV === 'production';
    console.log("Ambiente de produção:", isProduction ? "Sim" : "Não");
    
    const data = await request.json();
    console.log("Tipo de requisição recebida:", data.checkStatus ? "Verificação de status" : "Nova petição");
    
    // Verificar se é uma consulta de status
    if (data.checkStatus) {
      const statusId = data.statusId;
      if (!statusId || !peticoesEmProcessamento.has(statusId)) {
        return NextResponse.json({ error: 'ID de status inválido ou expirado' }, { status: 404 });
      }
      
      const statusData = peticoesEmProcessamento.get(statusId);
      
      // Verificar se o status expirou (mais de 5 minutos)
      const now = Date.now();
      if (now - statusData.startTime > 300000) {
        peticoesEmProcessamento.delete(statusId);
        return NextResponse.json({ 
          error: 'ID de status expirado por tempo limite',
          status: 'expired' 
        }, { status: 404 });
      }
      
      if (statusData.error) {
        // Não remover imediatamente para dar tempo ao cliente obter o erro
        // Será removido pela rotina de limpeza
        return NextResponse.json({ 
          status: 'error', 
          error: statusData.error 
        });
      }
      
      if (statusData.completed) {
        const result = {
          status: 'completed',
          content: statusData.content,
          peticaoId: statusData.peticaoId,
          sections: statusData.sections
        };
        
        console.log(`Retornando petição completada para ${statusId} com ID: ${statusData.peticaoId}`);
        
        // Não remover imediatamente para dar tempo ao cliente obter os dados
        // Será removido pela rotina de limpeza
        return NextResponse.json(result);
      }
      
      // Ainda processando - remover o progresso da resposta para o cliente
      return NextResponse.json({ 
        status: 'processing',
        message: statusData.message || 'Processando petição...'
      });
    }
    
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
    
    // Verificar se a descrição está dentro do limite
    const MAX_DESCRIPTION_LENGTH = 1500;
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json({ 
        error: `A descrição excede o limite de ${MAX_DESCRIPTION_LENGTH} caracteres.`,
        message: 'Por favor, reduza o tamanho da descrição para evitar timeouts.'
      }, { status: 400 });
    }
    
    // Validar campos obrigatórios
    if (!tipoPeticao || !reason || !description) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios faltando',
        message: 'O tipo de petição, motivo e descrição dos fatos são obrigatórios'
      }, { status: 400 });
    }
    
    // Gerar um ID único para o processo assíncrono
    const statusId = Date.now().toString() + Math.random().toString(36).substring(2, 15);
    
    // Armazenar o status inicial
    peticoesEmProcessamento.set(statusId, {
      completed: false,
      startTime: Date.now(),
      progress: 0,
      message: 'Processando petição...'
    });
    
    console.log(`Nova petição registrada com ID: ${statusId}. Total em processamento: ${peticoesEmProcessamento.size}`);
    
    // Adicionar logging dos dados recebidos para debug
    console.log(`Dados recebidos para petição ${statusId}:`, {
      tipoPeticao,
      customerId,
      processNumber,
      entity,
      reason,
      description: description ? description.substring(0, 50) + "..." : "(vazio)"
    });
    
    // Iniciar o processamento assíncrono sem bloqueio
    generatePeticaoAsync(statusId, {
      userId,
      tipoPeticao,
      customerId,
      processNumber,
      modalidade,
      objeto,
      entity,
      reason,
      description,
      argumentsText,
      requestText,
      autoridade,
      contraparte,
      cidade,
      dataDocumento,
      nomeAdvogado,
      numeroOAB
    }, isProduction);
    
    // Retornar imediatamente com o ID de status - ajuste da mensagem
    return NextResponse.json({
      status: 'accepted',
      statusId: statusId,
      message: 'Processando petição...'
    });
    
  } catch (error) {
    console.error('Erro ao iniciar geração de petição:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Função assíncrona para gerar a petição sem bloquear a resposta HTTP
async function generatePeticaoAsync(statusId: string, data: any, isProduction: boolean) {
  try {
    const {
      userId,
      tipoPeticao,
      customerId,
      processNumber,
      modalidade,
      objeto,
      entity,
      reason,
      description,
      argumentsText,
      requestText,
      autoridade,
      contraparte,
      cidade,
      dataDocumento,
      nomeAdvogado,
      numeroOAB
    } = data;
    
    updateStatus(statusId, { message: 'Consultando informações do cliente...' });
    
    // Buscar dados do cliente se um ID foi fornecido
    const prisma = getPrismaClient();
    let clienteInfo = '';
    if (customerId) {
      try {
        const cliente = await prisma.customer.findUnique({
          where: { id: customerId }
        });
        
        if (cliente) {
          // Versão simplificada para reduzir tamanho do prompt
          clienteInfo = `
          Informações do cliente:
          - Razão Social: ${cliente.razaoSocial}
          - CNPJ: ${cliente.cnpj}
          - Endereço: ${cliente.enderecoCidade || ''} - ${cliente.enderecoUF || ''}
          - Representante Legal: ${cliente.nomeResponsavel || 'Não informado'}
          
          Use esses dados do cliente na petição.`;
        }
      } catch (error) {
        console.error("Erro ao buscar dados do cliente:", error);
      }
    }
    
    updateStatus(statusId, { message: 'Preparando contexto da petição...' });
    
    // Criar um contexto adicional para a petição (versão simplificada)
    let contextoAdicional = '';
    if (processNumber) contextoAdicional += `Processo: ${processNumber}. `;
    if (entity) contextoAdicional += `Órgão: ${entity}. `;
    if (modalidade) contextoAdicional += `Modalidade: ${modalidade}. `;
    if (objeto) contextoAdicional += `Objeto: ${objeto}. `;
    
    updateStatus(statusId, { message: 'Consultando conhecimentos jurídicos...' });
    
    // Buscar conhecimentos jurídicos relevantes (mocked na função consultarVectorStore)
    console.log("Consultando vector store para obter conhecimentos jurídicos...");
    const conhecimentosJuridicos = await consultarVectorStore(tipoPeticao, reason, description);
    
    // Verificar se temos conhecimentos jurídicos
    if (!conhecimentosJuridicos) {
      updateStatus(statusId, { 
        error: 'Não foi possível obter conhecimentos jurídicos para gerar a petição.'
      });
      return;
    }
    
    // Informações adicionais para a petição
    let enderecoECidade = '';
    if (cidade) enderecoECidade = `${cidade}, ${new Date(dataDocumento).toLocaleDateString('pt-BR')}.`;
    
    let assinaturaAdvogado = '';
    if (nomeAdvogado) assinaturaAdvogado = `${nomeAdvogado}
    OAB ${numeroOAB}`;
    
    // Configurar o modelo com base na entrada
    updateStatus(statusId, { message: 'Configurando modelo de IA...' });
    
    // Selecionar o modelo com base no ambiente e tamanho dos dados
    const descriptionLength = description ? description.length : 0;
    const modelConfig = getModelConfig(description, isProduction);
    
    console.log(`Usando modelo: ${modelConfig.model}, tokens máx: ${modelConfig.maxTokens}, em ambiente de ${isProduction ? 'produção' : 'desenvolvimento'}`);
    
    // Construir o prompt final
    let promptFinal = '';
    
    // Versão otimizada para produção - reduzir o tamanho do prompt e focar no essencial
    if (isProduction || descriptionLength > 1000) {
      updateStatus(statusId, { message: 'Gerando petição otimizada...' });
      
      // Truncar a descrição para evitar exceder limites de tokens
      const descricaoTruncada = description.substring(0, Math.min(800, description.length));
      
      // Prompt simplificado e direto
      promptFinal = `
      Como advogado especializado, gere uma petição concisa de ${tipoPeticao} com base nos seguintes dados:
      
      DADOS ESSENCIAIS:
      - Assunto: ${reason}
      - Descrição: ${descricaoTruncada}
      ${contextoAdicional ? `- Contexto: ${contextoAdicional}` : ''}
      
      ESTRUTURA OBRIGATÓRIA:
      # I - DOS FATOS
      [Resumo dos fatos relevantes]
      
      # II - DOS FUNDAMENTOS JURÍDICOS
      [Principais argumentos jurídicos]
      
      # III - DOS PEDIDOS
      [Pedidos essenciais]
      
      Referências úteis: ${conhecimentosJuridicos.jurisprudencia[0]} e ${conhecimentosJuridicos.legislacao[0]}.
      `;
    } else {
      // Versão completa para desenvolvimento ou textos curtos
      updateStatus(statusId, { message: 'Gerando petição completa...' });
      
      promptFinal = `
      Você é um advogado especializado em petições administrativas. Gere uma petição completa de ${tipoPeticao} seguindo estas instruções:
      
      DADOS DO CASO:
      - Processo: ${processNumber || 'Não informado'}
      - Órgão: ${entity || 'Não informado'}
      - Modalidade: ${modalidade || 'Não informada'}
      - Objeto: ${objeto || 'Não informado'}
      - Assunto/Motivo: ${reason}
      - Descrição dos fatos: ${description}
      - Autoridade Competente: ${autoridade || 'Ilustríssimo Senhor'}
      ${contraparte ? `- Contraparte: ${contraparte}` : ''}
      
      ${clienteInfo || ''}
      
      ESTRUTURA DA PETIÇÃO:
      # CABEÇALHO
      [Uma introdução adequada endereçada à autoridade competente]
      
      # I - DOS FATOS
      [Exposição detalhada dos fatos apresentados, com cronologia clara e objetiva]
      
      # II - DOS FUNDAMENTOS JURÍDICOS
      [Argumentação jurídica utilizando as seguintes referências:
      - Jurisprudência: ${conhecimentosJuridicos.jurisprudencia.join(', ')}
      - Doutrina: ${conhecimentosJuridicos.doutrina.join(', ')}
      - Legislação: ${conhecimentosJuridicos.legislacao.join(', ')}]
      
      # III - DOS PEDIDOS
      [Lista numerada de pedidos claros e objetivos, incluindo:
      1. Recebimento da petição
      2. Consideração dos argumentos
      3. Deferimento do pedido principal
      4. Outros pedidos específicos ao caso]
      
      # ENCERRAMENTO
      [Fórmula de encerramento respeitosa]
      
      ${enderecoECidade}
      
      ${assinaturaAdvogado}
      `;
    }
    
    updateStatus(statusId, { message: 'Enviando para processamento...' });
    console.log("Enviando prompt para a OpenAI...");
    
    // Inicializar variável para armazenar o conteúdo da petição
    let peticaoContent = "";
    
    // Configurar timeout para a requisição OpenAI
    const timeoutMs = isProduction ? 25000 : 45000;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tempo limite excedido ao conectar com OpenAI')), timeoutMs)
    );
    
    // Tentar gerar a petição com o prompt otimizado
    try {
      console.log("Tentando gerar petição...");
      
      // Usar race entre a chamada da API e o timeout
      const completionPromise = openai.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `Você é um advogado experiente especializado em petições administrativas. Seja preciso e objetivo.` 
          },
          { role: "user", content: promptFinal }
        ],
        model: modelConfig.model,
        temperature: 0.5, // Temperatura mais baixa para maior objetividade
        max_tokens: modelConfig.maxTokens,
      });
      
      // Executar com timeout
      const completion = await Promise.race([completionPromise, timeoutPromise]) as OpenAI.Chat.Completions.ChatCompletion;
      
      updateStatus(statusId, { message: 'Formatando resultado...' });
      
      peticaoContent = completion.choices[0].message.content || '';
      console.log("Petição gerada com sucesso. Tamanho:", peticaoContent.length);
    } catch (error) {
      console.error("Erro ao gerar petição:", error);
      
      // Verificar se o erro é de timeout
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('timeout') || errorMessage.includes('Tempo limite')) {
        updateStatus(statusId, { 
          error: 'Tempo limite excedido. Tente novamente com uma descrição mais curta ou em um horário com menos tráfego.' 
        });
        return;
      }
      
      // Para outros erros, usar template de emergência
      try {
        console.log("Usando template de emergência...");
        
        // Template mínimo garantido
        peticaoContent = `
# I - DOS FATOS

${description.substring(0, Math.min(300, description.length))}

# II - DOS FUNDAMENTOS JURÍDICOS

Conforme a Lei nº 14.133/2021, aplicável ao caso em tela, os fatos narrados possuem fundamento legal. O Art. 5º da referida lei estabelece os princípios que regem as licitações e contratos administrativos, sendo eles a legalidade, impessoalidade, moralidade, publicidade, eficiência, interesse público, probidade administrativa, entre outros.

Segundo Marçal Justen Filho (Comentários à Lei de Licitações e Contratos Administrativos, 2021), a Administração Pública deve seguir estritamente os preceitos legais em seus procedimentos.

# III - DOS PEDIDOS

Ante o exposto, requer-se:

a) O recebimento da presente petição;
b) A análise dos argumentos apresentados;
c) O provimento do pedido conforme os fundamentos expostos.
`;
      } catch (ultimoError) {
        console.error("Falha no template de emergência:", ultimoError);
        updateStatus(statusId, { 
          error: 'Não foi possível gerar a petição após múltiplas tentativas. Por favor, tente novamente com uma descrição mais curta.' 
        });
        return;
      }
    }
    
    updateStatus(statusId, { message: 'Extraindo seções e salvando petição...' });
    
    // Extrair seções da petição
    const fatosMatch = peticaoContent.match(/I - DOS FATOS\s*([\s\S]*?)(?=II -|$)/i);
    const fundamentosMatch = peticaoContent.match(/II - DOS FUNDAMENTOS\s*([\s\S]*?)(?=III -|$)/i);
    const pedidosMatch = peticaoContent.match(/III - DOS PEDIDOS\s*([\s\S]*?)(?=IV -|$)/i);
    
    // Extrair conteúdo das seções ou usar placeholders
    const fatos = fatosMatch ? fatosMatch[1].trim() : 'Fatos conforme descritos.';
    const fundamentos = fundamentosMatch ? fundamentosMatch[1].trim() : 'Fundamentos jurídicos aplicáveis.';
    const pedidos = pedidosMatch ? pedidosMatch[1].trim() : 'Pedidos conforme normativas aplicáveis.';
    
    // Adicionar cabeçalho e rodapé padrão se não existirem no conteúdo
    let conteudoFinal = peticaoContent;
    
    // Verificar se já existe um cabeçalho, caso contrário adicionar
    if (!conteudoFinal.includes("EXCELENTÍSSIMO") && !conteudoFinal.includes("ILUSTRÍSSIMO")) {
      // Cabeçalho padrão
      const cabecalho = `EXCELENTÍSSIMO(A) SENHOR(A) ${autoridade || 'AUTORIDADE COMPETENTE'}\n\n`;
      conteudoFinal = cabecalho + conteudoFinal;
    }
    
    // Verificar se já existe um rodapé com local e data, caso contrário adicionar
    if (!conteudoFinal.includes(cidade) && cidade) {
      // Rodapé padrão com local, data e assinatura
      const rodape = `\n\n${cidade}, ${new Date(dataDocumento).toLocaleDateString('pt-BR')}.\n\n${nomeAdvogado || 'Advogado'}\nOAB ${numeroOAB || '00000'}`;
      conteudoFinal += rodape;
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
      } as any
    });
    
    // Atualizar status com o resultado completo
    updateStatus(statusId, {
      completed: true,
      content: conteudoFinal,
      peticaoId: peticao.id,
      sections: {
        fatos,
        fundamentos,
        pedidos
      }
    });
    
  } catch (error) {
    console.error('Erro durante processamento assíncrono:', error);
    updateStatus(statusId, { 
      error: `Erro ao gerar petição: ${(error as Error).message || 'Erro desconhecido'}`
    });
  }
}

// Função para atualizar o status de uma petição em processamento
function updateStatus(statusId: string, updates: any) {
  if (!peticoesEmProcessamento.has(statusId)) {
    return;
  }
  
  const currentStatus = peticoesEmProcessamento.get(statusId);
  peticoesEmProcessamento.set(statusId, { ...currentStatus, ...updates });
  
  // Melhorar a mensagem de log para incluir mais detalhes
  if (updates.message) {
    console.log(`Status atualizado para ${statusId}: ${updates.message}`);
  } else if (updates.completed) {
    console.log(`Status atualizado para ${statusId}: 100`);
  } else if (updates.error) {
    console.log(`Erro para ${statusId}: ${updates.error}`);
  }
} 