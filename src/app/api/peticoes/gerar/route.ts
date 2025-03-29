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

async function consultarVectorStore(tipo: string, motivo: string, descricao: string): Promise<{ jurisprudencia: string[], doutrina: string[], legislacao: string[] }> {
  try {
    // Verificar se temos o ASSISTANT_ID configurado
    if (!process.env.ASSISTANT_ID) {
      console.error("ASSISTANT_ID não configurado no ambiente");
      return await getFallbackKnowledge(tipo, motivo, descricao);
    }

    console.log(`Consultando OpenAI Assistant ID: ${process.env.ASSISTANT_ID.substring(0, 5)}...`);

    // Criar uma thread para a consulta
    const thread = await openai.beta.threads.create();
    console.log(`Thread criada com ID: ${thread.id}`);

    // Montar uma mensagem estruturada para o Assistant
    const mensagem = `Por favor, forneça conhecimentos jurídicos relevantes e específicos para uma petição do tipo "${tipo}" sobre o motivo "${motivo}". 
    
    CONTEXTO DO CASO:
    ${descricao.substring(0, 800)}${descricao.length > 800 ? '... [texto truncado]' : ''}
    
    FORMATO DA RESPOSTA:
    Por favor, estruture sua resposta nos seguintes tópicos obrigatórios:
    
    JURISPRUDÊNCIA:
    - Liste acórdãos, decisões e precedentes específicos e diretamente relevantes para este caso do TCU, STF, STJ e outros tribunais
    - Inclua o número completo do acórdão/decisão e a data
    - Selecione jurisprudência que realmente traga valor à fundamentação da petição
    
    DOUTRINA:
    - Cite autores e obras específicas para o tema
    - Priorize publicações recentes de autores reconhecidos como Marçal Justen Filho, Di Pietro, etc.
    
    LEGISLAÇÃO:
    - Liste artigos específicos de leis, decretos e normas diretamente aplicáveis a este caso
    - Priorize a Lei 14.133/2021 (Nova Lei de Licitações)
    - NÃO cite a Lei 8.666/93 (revogada)
    - Certifique-se de que os artigos realmente se aplicam ao caso concreto descrito`;

    // Enviar a mensagem para o Assistant
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: mensagem
    });

    console.log("Mensagem enviada ao Assistant, executando...");

    // Executar o Assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.ASSISTANT_ID,
    });

    // Aguardar conclusão com timeout
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let contador = 0;
    const maxTentativas = 45; // 45 segundos de timeout
    
    console.log("Aguardando resposta do Assistant...");
    
    while (runStatus.status !== "completed" && contador < maxTentativas) {
      // Aguardar 1 segundo entre verificações
      await new Promise(resolve => setTimeout(resolve, 1000));
      contador++;
      
      // Verificar status a cada segundo
      try {
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        
        // Se falhou ou foi cancelado, interromper
        if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
          console.error(`Assistant falhou com status: ${runStatus.status}`);
          return await getFallbackKnowledge(tipo, motivo, descricao);
        }
      } catch (error) {
        console.error("Erro ao verificar status do Assistant:", error);
      }
    }

    // Se atingiu o timeout
    if (contador >= maxTentativas) {
      console.error("Timeout ao aguardar resposta do Assistant");
      return await getFallbackKnowledge(tipo, motivo, descricao);
    }

    console.log("Assistant completou execução, obtendo mensagens...");

    // Obter a resposta
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Verificar se há mensagens e conteúdo
    if (!messages.data || messages.data.length === 0) {
      console.error("Nenhuma mensagem recebida do Assistant");
      return await getFallbackKnowledge(tipo, motivo, descricao);
    }
    
    // Obter o conteúdo da primeira mensagem (resposta mais recente)
    const messageContent = messages.data[0].content;
    
    if (!messageContent || messageContent.length === 0) {
      console.error("Mensagem do Assistant sem conteúdo");
      return await getFallbackKnowledge(tipo, motivo, descricao);
    }
    
    // Extrair texto da resposta
    let responseText = "";
    
    // Iterar sobre cada bloco de conteúdo e extrair texto
    for (const content of messageContent) {
      if (content.type === 'text') {
        responseText += content.text.value + "\n";
      }
    }
    
    if (!responseText.trim()) {
      console.error("Resposta do Assistant não contém texto");
      return await getFallbackKnowledge(tipo, motivo, descricao);
    }
    
    console.log("Resposta do Assistant recebida com sucesso");
    console.log("Tamanho da resposta:", responseText.length, "caracteres");
    
    // Processar a resposta para extrair conhecimentos jurídicos
    const conhecimentosJuridicos = processarRespostaAssistant(responseText);
    
    return conhecimentosJuridicos;

  } catch (error) {
    console.error("Erro ao consultar Assistant:", error);
    return await getFallbackKnowledge(tipo, motivo, descricao);
  }
}

// Função para processar a resposta do Assistant e extrair conhecimentos jurídicos
function processarRespostaAssistant(responseText: string): { jurisprudencia: string[], doutrina: string[], legislacao: string[] } {
  console.log("Processando resposta do Assistant...");
  
  // Objeto para armazenar os conhecimentos jurídicos extraídos
  const conhecimentos = {
    jurisprudencia: [] as string[],
    doutrina: [] as string[],
    legislacao: [] as string[]
  };
  
  try {
    // Extrair seções pelo índice usando find de string em vez de regex
    const text = responseText.toUpperCase();
    let jurisprudencia: string[] = [];
    let doutrina: string[] = [];
    let legislacao: string[] = [];
    
    // Encontrar índices de cada seção
    const jurisprudenciaIndex = text.indexOf("JURISPRUDÊNCIA");
    const doutrinaIndex = text.indexOf("DOUTRINA");
    const legislacaoIndex = text.indexOf("LEGISLAÇÃO");
    
    // Extrair jurisprudência
    if (jurisprudenciaIndex !== -1 && doutrinaIndex !== -1 && jurisprudenciaIndex < doutrinaIndex) {
      const content = responseText.substring(jurisprudenciaIndex + 13, doutrinaIndex).trim();
      jurisprudencia = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.includes("JURISPRUDÊNCIA"));
    }
    
    // Extrair doutrina
    if (doutrinaIndex !== -1 && legislacaoIndex !== -1 && doutrinaIndex < legislacaoIndex) {
      const content = responseText.substring(doutrinaIndex + 9, legislacaoIndex).trim();
      doutrina = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.includes("DOUTRINA"));
    }
    
    // Extrair legislação
    if (legislacaoIndex !== -1) {
      const content = responseText.substring(legislacaoIndex + 11).trim();
      legislacao = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.includes("LEGISLAÇÃO"));
    }
    
    // Atribuir os resultados encontrados
    conhecimentos.jurisprudencia = jurisprudencia;
    conhecimentos.doutrina = doutrina;
    conhecimentos.legislacao = legislacao;
    
    // Validar que temos pelo menos alguns itens em cada categoria
    if (conhecimentos.jurisprudencia.length === 0 && 
        conhecimentos.doutrina.length === 0 && 
        conhecimentos.legislacao.length === 0) {
      
      console.warn("Não foi possível extrair conhecimentos jurídicos estruturados. Usando texto completo para análise manual.");
      
      // Verificar se há citações de acórdãos TCU
      const acordaosTCU = responseText.match(/Acórdão\s+\d+\/\d+/g);
      if (acordaosTCU) {
        conhecimentos.jurisprudencia = Array.from(new Set(acordaosTCU)).map(a => a.trim());
      }
      
      // Verificar se há referências a artigos de lei
      const artigos = responseText.match(/Art\.\s+\d+\s+da\s+Lei\s+(?:nº\s+)?\d+\.?\d*\/\d+/g);
      if (artigos) {
        conhecimentos.legislacao = Array.from(new Set(artigos)).map(a => a.trim());
      }
      
      // Verificar por menções a autores comuns em doutrina jurídica
      const autores = ["JUSTEN FILHO", "BANDEIRA DE MELLO", "DI PIETRO", "CARVALHO FILHO"].filter(
        autor => responseText.includes(autor)
      );
      
      if (autores.length > 0) {
        conhecimentos.doutrina = autores.map(autor => `${autor} - Mencionado no contexto jurídico`);
      }
    }
    
    // Garantir que temos pelo menos um item em cada categoria
    if (conhecimentos.jurisprudencia.length === 0) {
      conhecimentos.jurisprudencia = ["Acórdão 2622/2013-TCU-Plenário - Estabelece faixas referenciais para BDI"];
    }
    
    if (conhecimentos.doutrina.length === 0) {
      conhecimentos.doutrina = ["JUSTEN FILHO, Marçal. Comentários à Lei de Licitações e Contratos Administrativos, 2021"];
    }
    
    if (conhecimentos.legislacao.length === 0) {
      conhecimentos.legislacao = ["Art. 18 da Lei nº 14.133/2021 - Fase preparatória da licitação"];
    }
    
    console.log("Conhecimentos jurídicos extraídos com sucesso:", {
      jurisprudenciaCount: conhecimentos.jurisprudencia.length,
      doutrinaCount: conhecimentos.doutrina.length,
      legislacaoCount: conhecimentos.legislacao.length
    });
    
    return conhecimentos;
  } catch (error) {
    console.error("Erro ao processar resposta do Assistant:", error);
    
    // Retornar dados default em caso de erro no processamento
    return {
      jurisprudencia: [
        "Acórdão 2622/2013-TCU-Plenário - Referencial para contratações públicas"
      ],
      doutrina: [
        "JUSTEN FILHO, Marçal. Comentários à Lei de Licitações e Contratos Administrativos, 2021"
      ],
      legislacao: [
        "Art. 6º da Lei nº 14.133/2021 - Definições para fins desta Lei"
      ]
    };
  }
}

// Função para gerar conhecimentos jurídicos contextualizados caso o Assistant falhe
async function getFallbackKnowledge(tipo: string, motivo?: string, descricao?: string): Promise<{ jurisprudencia: string[], doutrina: string[], legislacao: string[] }> {
  console.log(`Gerando conhecimentos jurídicos contextualizados para tipo: ${tipo}`);
  
  try {
    // Obter um modelo apropriado
    const modelConfig = getModelConfig(descricao || "", process.env.VERCEL_ENV === 'production');
    
    // Criar um prompt contextualizado para obter informações jurídicas relevantes
    const prompt = `Você é um advogado especializado em direito administrativo com profundo conhecimento da Nova Lei de Licitações (Lei 14.133/2021) e outras legislações relevantes.

Preciso de conhecimentos jurídicos específicos para uma petição do tipo "${tipo}" ${motivo ? `relacionada a "${motivo}"` : ''}.
${descricao ? `Contexto dos fatos: ${descricao.substring(0, 400)}...` : ''}

Por favor, forneça:

1. JURISPRUDÊNCIA: 
   - Cite acórdãos específicos do TCU, STJ, STF ou outros tribunais relevantes para este caso específico.
   - Inclua o número completo do acórdão/decisão e uma breve descrição da relevância.
   - Priorize decisões recentes que estabeleçam precedentes importantes.

2. DOUTRINA: 
   - Indique autores e obras específicas que tratam diretamente do tema.
   - Priorize autores renomados como Marçal Justen Filho, Maria Sylvia Di Pietro, José dos Santos Carvalho Filho.
   - Mencione páginas ou capítulos específicos, se aplicável.

3. LEGISLAÇÃO: 
   - ANALISE DETALHADAMENTE a Lei 14.133/2021 (Nova Lei de Licitações) e identifique os artigos MAIS RELEVANTES para o caso concreto.
   - Não se limite apenas aos artigos mais conhecidos - faça uma análise completa da lei.
   - Inclua artigos de outras leis/decretos aplicáveis que sejam fundamentais para o caso.
   - NÃO cite a Lei 8.666/93 (revogada).
   - Para cada artigo citado, explique brevemente sua relevância para o caso.

IMPORTANTE:
- Seja específico e preciso. Não forneça conhecimentos jurídicos genéricos.
- A qualidade e especificidade dos artigos legais citados é CRUCIAL para o sucesso da petição.
- Estruture sua resposta com os cabeçalhos "JURISPRUDÊNCIA:", "DOUTRINA:" e "LEGISLAÇÃO:" claramente definidos.`;

    // Chamar a API para obter conhecimentos jurídicos contextualizados
    const response = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: "system", content: "Você é um assistente jurídico especializado em direito administrativo e licitações." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1500
    });

    // Processar a resposta
    const responseText = response.choices[0]?.message?.content || "";
    if (!responseText) {
      throw new Error("Resposta vazia da API");
    }

    // Usar a mesma função de processamento do Assistant
    return processarRespostaAssistant(responseText);
    
  } catch (error) {
    console.error("Erro ao gerar conhecimentos jurídicos contextualizados:", error);
    
    // Em caso de falha fatal, retornar um mínimo de informações genéricas
    // para que a aplicação não quebre completamente
    return {
      jurisprudencia: [
        "Acórdão 2622/2013-TCU-Plenário - Referencial para contratações públicas"
      ],
      doutrina: [
        "JUSTEN FILHO, Marçal. Comentários à Lei de Licitações e Contratos Administrativos, 2021"
      ],
      legislacao: [
        "Art. 6º da Lei nº 14.133/2021 - Definições para fins desta Lei"
      ]
    };
  }
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
    console.log("Consultando OpenAI Assistant para obter conhecimentos jurídicos sobre:", {
      tipo: tipoPeticao,
      motivo: reason.substring(0, 50) + (reason.length > 50 ? "..." : ""),
      descricaoLength: description ? description.length : 0
    });
    
    const conhecimentosJuridicos = await consultarVectorStore(tipoPeticao, reason, description);
    
    // Verificar se temos conhecimentos jurídicos
    if (!conhecimentosJuridicos) {
      updateStatus(statusId, { 
        error: 'Não foi possível obter conhecimentos jurídicos para gerar a petição.'
      });
      return;
    }
    
    console.log("Conhecimentos jurídicos obtidos do Assistant:", {
      jurisprudencia: conhecimentosJuridicos.jurisprudencia.length,
      doutrina: conhecimentosJuridicos.doutrina.length,
      legislacao: conhecimentosJuridicos.legislacao.length,
      total: conhecimentosJuridicos.jurisprudencia.length + conhecimentosJuridicos.doutrina.length + conhecimentosJuridicos.legislacao.length
    });
    
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
    
    // Usar o novo formato de prompt específico solicitado pelo usuário
    promptFinal = `Você é um advogado especializado em direito administrativo. Sua tarefa é gerar uma petição jurídica completa com base no tipo, motivo e fatos fornecidos.

INFORMAÇÃO IMPORTANTE SOBRE TEMPLATE:
Um template DOCX será usado para gerar a petição final. Seu texto será inserido automaticamente nos seguintes campos do template:
- [FATOS] - O conteúdo que você fornecer na seção "FATOS:" será inserido aqui
- [ARGUMENTOS] - O conteúdo que você fornecer na seção "ARGUMENTOS:" será inserido aqui
- [PEDIDOS] - O conteúdo que você fornecer na seção "PEDIDO:" será inserido aqui

NÃO INCLUA OS CABEÇALHOS "I - DOS FATOS", "II - DOS FUNDAMENTOS", "III - DOS PEDIDOS" em sua resposta, pois estes já existem no template. Forneça apenas o conteúdo que deve ir sob esses cabeçalhos.

INSTRUÇÕES:
Analise cuidadosamente o TIPO de petição solicitada, o MOTIVO apresentado e os FATOS descritos.
OBRIGATORIAMENTE utilize os conhecimentos jurídicos (jurisprudência, doutrina e legislação) fornecidos neste prompt para fundamentar sua resposta.
Você também deve pesquisar e utilizar OUTROS artigos específicos da legislação que sejam mais relevantes para o caso concreto, não se limitando apenas àqueles fornecidos neste prompt.
Elabore uma petição com os seguintes componentes:

   a) FATOS:
Reescreva os fatos apresentados dando-lhes um contexto jurídico específico para o tipo de petição solicitada
Organize cronologicamente e destaque os elementos juridicamente relevantes
Adapte a linguagem para o contexto específico do tipo de petição escolhido pelo usuário
Os fatos devem ter pelo menos 200 caracteres

   b) ARGUMENTOS:
Fundamente com base na legislação fornecida, especialmente a Lei nº 14.133/2021 para licitações
Inclua OBRIGATORIAMENTE referências à jurisprudência relevante (TCU, STJ, STF) fornecida nos conhecimentos jurídicos deste prompt
Incorpore citações doutrinárias fornecidas nos conhecimentos jurídicos
Desenvolva argumentação sólida com pelo menos 2 parágrafos bem fundamentados
Explique claramente por que a situação descrita nos fatos merece atenção jurídica
Cite artigos específicos da legislação fornecida nos conhecimentos jurídicos
Os argumentos devem ter pelo menos 500 caracteres

   c) PEDIDO:
Estruture pedidos claros, objetivos e específicos
Inclua todos os requerimentos necessários para atender à pretensão
Organize em formato de tópicos (1., 2., 3., etc.)
Garanta que os pedidos sejam coerentes com os argumentos apresentados e adequados ao tipo de petição
Os pedidos devem ter pelo menos 100 caracteres

Formate sua resposta EXATAMENTE neste formato:

FATOS:
[Sua versão melhorada dos fatos aqui]

ARGUMENTOS:
[Seus argumentos jurídicos aqui, incluindo fundamentação legal e doutrinária dos conhecimentos fornecidos]

PEDIDO:
[Seus pedidos aqui, estruturados em tópicos numerados]

É EXTREMAMENTE IMPORTANTE que você use exatamente os cabeçalhos "FATOS:", "ARGUMENTOS:" e "PEDIDO:" para que o sistema possa substituir os placeholders no template DOCX corretamente.

REGRAS ADICIONAIS:
NÃO SE LIMITE aos conhecimentos jurídicos fornecidos no prompt - busque e utilize artigos específicos da legislação mais adequados ao caso concreto
Não cite a Lei 8.666/93 como fundamento, pois foi revogada
Ao citar acórdãos do TCU, inclua o número no formato "Acórdão XXXX/AAAA-TCU-Plenário"
Ao citar legislação, use o formato "Art. X da Lei nº Y/ZZZZ"
Ao citar jurisprudência, use o formato "Tribunal, Número do Processo, Relator, Data"
Ao citar doutrina, use o formato "AUTOR, Nome da Obra, Ano"
Verifique a precisão de todas as citações legais
Mantenha linguagem formal e técnica apropriada para peças jurídicas
Adapte o conteúdo ao tipo específico de petição solicitada pelo usuário
NÃO inclua texto adicional antes dos cabeçalhos ou após o conteúdo do PEDIDO
NÃO inclua conclusão, saudação ou assinatura - o template já possui essas informações

DADOS DO CASO:
- Tipo de Petição: ${tipoPeticao}
- Processo: ${processNumber || 'Não informado'}
- Órgão: ${entity || 'Não informado'}
- Modalidade: ${modalidade || 'Não informada'}
- Objeto: ${objeto || 'Não informado'}
- Motivo: ${reason}
- Fatos: ${description}
- Autoridade Competente: ${autoridade || 'Ilustríssimo Senhor'}
${contraparte ? `- Contraparte: ${contraparte}` : ''}

${clienteInfo || ''}

CONHECIMENTOS JURÍDICOS DISPONÍVEIS:
- Jurisprudência: ${conhecimentosJuridicos.jurisprudencia.join(', ')}
- Doutrina: ${conhecimentosJuridicos.doutrina.join(', ')}
- Legislação: ${conhecimentosJuridicos.legislacao.join(', ')}
`;

    updateStatus(statusId, { message: 'Enviando para processamento...' });
    console.log("Enviando prompt para a OpenAI...");
    
    // Inicializar variável para armazenar o conteúdo da petição
    let peticaoContent = "";
    
    // Configurar timeout para a requisição OpenAI
    const timeoutMs = isProduction ? 55000 : 45000;
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
            content: `Você é um advogado experiente especializado em petições administrativas. Utilize APENAS os conhecimentos jurídicos fornecidos no prompt do usuário. Não invente legislação, jurisprudência ou doutrina. Seja técnico, objetivo e formal.` 
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
    
    // Extrair seções da petição usando o novo formato de cabeçalhos
    const fatosMatch = peticaoContent.match(/FATOS:\s*([\s\S]*?)(?=ARGUMENTOS:|$)/i);
    const fundamentosMatch = peticaoContent.match(/ARGUMENTOS:\s*([\s\S]*?)(?=PEDIDO:|$)/i);
    const pedidosMatch = peticaoContent.match(/PEDIDO:\s*([\s\S]*?)(?=$)/i);
    
    // Extrair conteúdo das seções ou usar placeholders
    const fatos = fatosMatch ? fatosMatch[1].trim() : 'Fatos conforme descritos.';
    const fundamentos = fundamentosMatch ? fundamentosMatch[1].trim() : 'Fundamentos jurídicos aplicáveis.';
    const pedidos = pedidosMatch ? pedidosMatch[1].trim() : 'Pedidos conforme normativas aplicáveis.';
    
    // Formatando o conteúdo final com os novos cabeçalhos
    let conteudoFinal = `AO ${autoridade || 'EXCELENTÍSSIMO(A) SENHOR(A) AUTORIDADE COMPETENTE'}\n\n`;
    conteudoFinal += `FATOS:\n${fatos}\n\n`;
    conteudoFinal += `ARGUMENTOS:\n${fundamentos}\n\n`;
    conteudoFinal += `PEDIDO:\n${pedidos}\n\n`;
    
    // Adicionar local/data e assinatura
    if (cidade && dataDocumento) {
      conteudoFinal += `\n\n${cidade}, ${new Date(dataDocumento).toLocaleDateString('pt-BR')}.\n\n`;
    }
    
    if (nomeAdvogado) {
      conteudoFinal += `${nomeAdvogado}\n`;
      if (numeroOAB) {
        conteudoFinal += `OAB ${numeroOAB}`;
      }
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