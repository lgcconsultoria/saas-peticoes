import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

// Configurar o timeout da Edge Function (pode ser até 60 segundos em produção)
export const config = {
  runtime: 'edge',
  maxDuration: 60, // 60 segundos para a Vercel
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
  return conhecimentosJuridicos[tipo as keyof typeof conhecimentosJuridicos] || {
    jurisprudencia: ["Acórdão 1234/2023-TCU-Plenário"],
    doutrina: ["JUSTEN FILHO, Marçal. Comentários à Lei de Licitações e Contratos Administrativos, 2021"],
    legislacao: ["Art. 5º da Lei nº 14.133/2021"]
  };
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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Verificar se está em ambiente de produção
    const isProduction = process.env.VERCEL_ENV === 'production';
    console.log("Ambiente de produção:", isProduction ? "Sim" : "Não");
    
    const data = await request.json();
    
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
        
        // Não remover imediatamente para dar tempo ao cliente obter os dados
        // Será removido pela rotina de limpeza
        return NextResponse.json(result);
      }
      
      // Ainda processando
      return NextResponse.json({ 
        status: 'processing',
        progress: statusData.progress || 0,
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
      message: 'Iniciando processamento...'
    });
    
    console.log(`Nova petição registrada com ID: ${statusId}. Total em processamento: ${peticoesEmProcessamento.size}`);
    
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
    
    // Retornar imediatamente com o ID de status
    return NextResponse.json({
      status: 'accepted',
      statusId: statusId,
      message: 'Petição está sendo processada.'
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
    
    updateStatus(statusId, { progress: 10, message: 'Consultando informações do cliente...' });
    
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
    
    updateStatus(statusId, { progress: 20, message: 'Preparando contexto da petição...' });
    
    // Criar um contexto adicional para a petição (versão simplificada)
    let contextoAdicional = '';
    if (processNumber) contextoAdicional += `Processo: ${processNumber}. `;
    if (entity) contextoAdicional += `Órgão: ${entity}. `;
    if (modalidade) contextoAdicional += `Modalidade: ${modalidade}. `;
    if (objeto) contextoAdicional += `Objeto: ${objeto}. `;
    if (autoridade) contextoAdicional += `Autoridade: ${autoridade}. `;
    if (contraparte) contextoAdicional += `Contraparte: ${contraparte}. `;
    
    updateStatus(statusId, { progress: 30, message: 'Consultando conhecimentos jurídicos...' });
    
    // Consultar a vector store para obter conhecimentos jurídicos relevantes
    console.log("Consultando vector store para obter conhecimentos jurídicos...");
    const conhecimentosJuridicos = await consultarVectorStore(tipoPeticao, reason, description);
    
    console.log("Conhecimentos jurídicos obtidos:", {
      jurisprudencia: conhecimentosJuridicos.jurisprudencia.length,
      doutrina: conhecimentosJuridicos.doutrina.length,
      legislacao: conhecimentosJuridicos.legislacao.length
    });
    
    // Criar um sistema de referência para o prompt
    const referenciasJuridicas = `
    Referências jurídicas extraídas da vector store para incluir na geração da petição (não cite estas fontes diretamente):
    
    JURISPRUDÊNCIA:
    ${conhecimentosJuridicos.jurisprudencia.join('\n')}
    
    DOUTRINA:
    ${conhecimentosJuridicos.doutrina.join('\n')}
    
    LEGISLAÇÃO:
    ${conhecimentosJuridicos.legislacao.join('\n')}
    `;
    
    updateStatus(statusId, { progress: 40, message: 'Configurando modelo de IA...' });
    
    // Obter a configuração do modelo com base no tamanho da entrada e ambiente
    const modelConfig = getModelConfig(description, isProduction);
    console.log(`Usando modelo: ${modelConfig.model}, tokens máx: ${modelConfig.maxTokens}, em ambiente ${isProduction ? 'de produção' : 'de desenvolvimento'}`);
    
    // Reduzir significativamente o tamanho do prompt para ambiente de produção
    let promptFinal = '';
    
    if (isProduction) {
      updateStatus(statusId, { progress: 50, message: 'Gerando petição com modelo otimizado para produção...' });
      
      // Versão ultra-simplificada para produção
      promptFinal = `
      Como advogado especializado, gere uma petição de ${tipoPeticao} completa mas concisa.
      
      DADOS:
      - Assunto: ${reason}
      - Descrição: ${description.substring(0, Math.min(500, description.length))}
      ${contextoAdicional ? `- Contexto: ${contextoAdicional}` : ''}
      
      FORMATO OBRIGATÓRIO:
      # I - DOS FATOS
      [Fatos relevantes]
      
      # II - DOS FUNDAMENTOS JURÍDICOS
      [Argumentos com base na Lei 14.133/2021]
      
      # III - DOS PEDIDOS
      [Lista de pedidos]
      
      Use referências a ${conhecimentosJuridicos.jurisprudencia[0]} e ${conhecimentosJuridicos.legislacao[0]}.
      `;
    } else {
      updateStatus(statusId, { progress: 50, message: 'Gerando petição completa...' });
      
      // Versão completa para desenvolvimento
      promptFinal = `
      Você é um advogado especializado em direito administrativo. Sua tarefa é gerar uma petição jurídica completa com base no tipo, motivo e fatos fornecidos.
      
      INSTRUÇÕES:
      Analise cuidadosamente o TIPO de petição solicitada: ${tipoPeticao}
      O MOTIVO apresentado: "${reason}"
      Os FATOS descritos: "${description}"
      
      ${clienteInfo}
      ${contextoAdicional ? `Contexto adicional: ${contextoAdicional}` : ''}
      
      ${referenciasJuridicas}
      
      Elabore uma petição completa contendo:
      
      a) FATOS APRIMORADOS:
      Reescreva os fatos apresentados dando-lhes um contexto jurídico específico para o tipo de petição solicitada
      Organize cronologicamente e destaque os elementos juridicamente relevantes
      Adapte a linguagem para o contexto específico do tipo de petição escolhido
      Os fatos devem ter pelo menos 200 caracteres
      
      b) ARGUMENTOS JURÍDICOS:
      Fundamente com base na legislação pertinente, especialmente a Lei nº 14.133/2021 para licitações
      Inclua referências a jurisprudência relevante (TCU, STJ, STF)
      Incorpore citações doutrinárias (como Marçal Justen Filho, Celso Antônio Bandeira de Mello)
      Desenvolva argumentação sólida com pelo menos 2 parágrafos bem fundamentados
      Explique claramente por que a situação descrita nos fatos merece atenção jurídica
      Cite artigos específicos da legislação aplicável ao caso
      Os argumentos devem ter pelo menos 500 caracteres
      
      c) PEDIDO:
      Estruture pedidos claros, objetivos e específicos
      Inclua todos os requerimentos necessários para atender à pretensão
      Organize em formato de tópicos (a, b, c, etc.)
      Garanta que os pedidos sejam coerentes com os argumentos apresentados e adequados ao tipo de petição
      Os pedidos devem ter pelo menos 100 caracteres
      
      Formate sua resposta EXATAMENTE neste formato:
      
      # I - DOS FATOS
      [Sua versão melhorada dos fatos aqui]
      
      # II - DOS FUNDAMENTOS JURÍDICOS
      [Seus argumentos jurídicos aqui, incluindo fundamentação legal e doutrinária]
      
      # III - DOS PEDIDOS
      [Seus pedidos aqui, estruturados em tópicos]
      
      REGRAS ADICIONAIS:
      - Não cite a Lei 8.666/93 como fundamento, pois foi revogada
      - Ao citar acórdãos do TCU, inclua o número no formato "Acórdão XXXX/AAAA-TCU-Plenário"
      - Ao citar legislação, use o formato "Art. X da Lei nº Y/ZZZZ"
      - Ao citar jurisprudência, use o formato "Tribunal, Número do Processo, Relator, Data"
      - Ao citar doutrina, use o formato "AUTOR, Nome da Obra, Ano"
      - Verifique a precisão de todas as citações legais
      - Mantenha linguagem formal e técnica apropriada para peças jurídicas
      
      IMPORTANTE: Use as referências jurídicas fornecidas, mas não mencione que elas foram extraídas de uma vector store.
      `;
    }
    
    updateStatus(statusId, { progress: 60, message: 'Enviando para processamento...' });
    console.log("Enviando prompt para a OpenAI...");
    
    // Inicializar variável para armazenar o conteúdo da petição
    let peticaoContent = "";
    
    // Tentar gerar a petição com o prompt otimizado
    try {
      console.log("Tentando gerar petição...");
      
      const completion = await openai.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `Você é um advogado experiente especializado em petições administrativas. Seja preciso.` 
          },
          { role: "user", content: promptFinal }
        ],
        model: isProduction ? "gpt-3.5-turbo" : modelConfig.model, // Forçar modelo mais rápido em produção
        temperature: 0.5, // Temperatura mais baixa para maior objetividade
        max_tokens: isProduction ? 1500 : modelConfig.maxTokens, // Limitar saída em produção
      });
      
      updateStatus(statusId, { progress: 80, message: 'Formatando resultado...' });
      
      peticaoContent = completion.choices[0].message.content || '';
      console.log("Petição gerada com sucesso. Tamanho:", peticaoContent.length);
    } catch (error) {
      console.error("Erro ao gerar petição:", error);
      
      // Último recurso - gerar um template mínimo que sempre funciona
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
    
    updateStatus(statusId, { progress: 90, message: 'Extraindo seções e salvando petição...' });
    
    // Extrair seções da petição
    const fatosMatch = peticaoContent.match(/I - DOS FATOS\s*([\s\S]*?)(?=II -|$)/i);
    const fundamentosMatch = peticaoContent.match(/II - DOS FUNDAMENTOS\s*([\s\S]*?)(?=III -|$)/i);
    const pedidosMatch = peticaoContent.match(/III - DOS PEDIDOS\s*([\s\S]*?)(?=IV -|$)/i);
    
    const fatos = fatosMatch ? fatosMatch[1].trim() : '';
    const fundamentos = fundamentosMatch ? fundamentosMatch[1].trim() : '';
    const pedidos = pedidosMatch ? pedidosMatch[1].trim() : '';
    
    // Validar o conteúdo e adicionar conteúdo padrão se necessário
    let conteudoFinal = peticaoContent;
    if (!fatosMatch || fatos.length < 50) {
      conteudoFinal = conteudoFinal.replace(/# I - DOS FATOS(\s*)([\s\S]*?)(?=# II|$)/i, 
        `# I - DOS FATOS\n\n${description}\n\n`);
    }
    
    if (!fundamentosMatch || fundamentos.length < 100) {
      conteudoFinal = conteudoFinal.replace(/# II - DOS FUNDAMENTOS JURÍDICOS(\s*)([\s\S]*?)(?=# III|$)/i,
        `# II - DOS FUNDAMENTOS JURÍDICOS\n\nConforme a Lei nº 14.133/2021, aplicável ao caso em tela, os fatos narrados possuem fundamento legal. O Art. 5º da referida lei estabelece os princípios que regem as licitações e contratos administrativos, sendo eles a legalidade, impessoalidade, moralidade, publicidade, eficiência, interesse público, probidade administrativa, entre outros.\n\nSegundo Marçal Justen Filho (Comentários à Lei de Licitações e Contratos Administrativos, 2021), a Administração Pública deve seguir estritamente os preceitos legais em seus procedimentos.\n\n`);
    }
    
    if (!pedidosMatch || pedidos.length < 30) {
      conteudoFinal = conteudoFinal.replace(/# III - DOS PEDIDOS(\s*)([\s\S]*?)(?=# IV|$)/i,
        `# III - DOS PEDIDOS\n\nAnte o exposto, requer-se:\n\na) O recebimento da presente petição;\nb) A análise dos argumentos apresentados;\nc) O provimento do pedido conforme os fundamentos expostos.\n\n`);
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
      progress: 100,
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
  console.log(`Status atualizado para ${statusId}: ${updates.message || updates.progress || (updates.completed ? 'Completo' : 'Sem mensagem')}`);
} 