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
      return { model: "gpt-4", temperature: 0.7, maxTokens: 2500 };
    }
    return { model: "gpt-3.5-turbo", temperature: 0.7, maxTokens: 2000 };
  }
  
  // Em desenvolvimento, podemos usar o modelo mais potente
  return { model: "gpt-4", temperature: 0.7, maxTokens: 3000 };
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
    
    // Verificar se está em ambiente de produção
    const isProduction = process.env.VERCEL_ENV === 'production';
    console.log("Ambiente de produção:", isProduction ? "Sim" : "Não");
    
    // Log das variáveis de ambiente quando a rota é chamada
    console.log("API chamada - OPENAI_API_KEY disponível:", process.env.OPENAI_API_KEY ? "Sim" : "Não");
    
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
    
    // Verificar se a descrição está dentro do limite
    const MAX_DESCRIPTION_LENGTH = 1500;
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json({ 
        error: `A descrição excede o limite de ${MAX_DESCRIPTION_LENGTH} caracteres.`,
        message: 'Por favor, reduza o tamanho da descrição para evitar timeouts.'
      }, { status: 400 });
    }
    
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
    
    // Criar um contexto adicional para a petição (versão simplificada)
    let contextoAdicional = '';
    if (processNumber) contextoAdicional += `Processo: ${processNumber}. `;
    if (entity) contextoAdicional += `Órgão: ${entity}. `;
    if (modalidade) contextoAdicional += `Modalidade: ${modalidade}. `;
    if (objeto) contextoAdicional += `Objeto: ${objeto}. `;
    if (autoridade) contextoAdicional += `Autoridade: ${autoridade}. `;
    if (contraparte) contextoAdicional += `Contraparte: ${contraparte}. `;
    
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
    
    // Obter a configuração do modelo com base no tamanho da entrada e ambiente
    const modelConfig = getModelConfig(description, isProduction);
    console.log(`Usando modelo: ${modelConfig.model}, tokens máx: ${modelConfig.maxTokens}, em ambiente ${isProduction ? 'de produção' : 'de desenvolvimento'}`);
    
    // Criar o prompt completo com referências da vector store
    const promptCompleto = `
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
    
    // Versão simplificada do prompt para fallback
    const promptSimplificado = `
    Como advogado especializado em direito administrativo, gere uma petição de ${tipoPeticao} sobre "${reason}".
    Fatos: "${description.substring(0, Math.min(500, description.length))}"
    
    Formato obrigatório:
    # I - DOS FATOS
    [Fatos resumidos]
    
    # II - DOS FUNDAMENTOS JURÍDICOS
    [Argumentos jurídicos com base na Lei 14.133/2021]
    
    # III - DOS PEDIDOS
    [Pedidos em tópicos a, b, c]
    
    Seja conciso e direto.
    ${contextoAdicional}
    `;
    
    console.log("Enviando prompt para a OpenAI...");
    
    // Inicializar variável para armazenar o conteúdo da petição
    let peticaoContent = "";
    
    // Tentar gerar a petição com o prompt completo
    try {
      console.log("Tentando gerar com prompt completo...");
      
      // Definir timeout mais curto
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      const completion = await openai.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `Você é um advogado experiente especializado em petições administrativas. Seja preciso.` 
          },
          { role: "user", content: promptCompleto }
        ],
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
      }, { signal: controller.signal });
      
      clearTimeout(timeoutId);
      
      peticaoContent = completion.choices[0].message.content || '';
      console.log("Petição gerada com prompt completo. Tamanho:", peticaoContent.length);
    } catch (error) {
      console.error("Erro ao gerar com prompt completo:", error);
      
      // Primeiro fallback - tentar com o prompt simplificado
      try {
        console.log("Tentando gerar com prompt simplificado...");
        const fallbackCompletion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: "Gere uma petição jurídica concisa." },
            { role: "user", content: promptSimplificado }
          ],
          model: "gpt-3.5-turbo",
          temperature: 0.5,
          max_tokens: 1500,
        });
        
        peticaoContent = fallbackCompletion.choices[0].message.content || '';
        console.log("Petição gerada com prompt simplificado. Tamanho:", peticaoContent.length);
      } catch (fallbackError) {
        console.error("Erro no primeiro fallback:", fallbackError);
        
        // Segundo fallback - gerar uma petição extremamente simplificada
        try {
          console.log("Tentando gerar com template básico...");
          
          // Template mínimo que sempre funciona - última tentativa
          const templateMinimo = `
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

          peticaoContent = templateMinimo;
          console.log("Petição gerada com template mínimo.");
        } catch (ultimoError) {
          console.error("Falha em todas as tentativas:", ultimoError);
          return NextResponse.json({ error: 'Não foi possível gerar a petição após múltiplas tentativas. Por favor, tente novamente com uma descrição mais curta.' }, { status: 408 });
        }
      }
    }

    console.log("Petição gerada com sucesso. Tamanho total:", peticaoContent.length);
    
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
      } as any // Type assertion para contornar limitações do TypeScript
    });
    
    return NextResponse.json({
      success: true,
      peticaoId: peticao.id,
      content: conteudoFinal,
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