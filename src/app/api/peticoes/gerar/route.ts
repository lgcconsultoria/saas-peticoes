import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Log environment variables (partially redacted for security)
console.log("OPENAI_API_KEY disponível:", process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 5)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}` : "Não definida");
console.log("ASSISTANT_ID disponível:", process.env.ASSISTANT_ID ? `${process.env.ASSISTANT_ID.substring(0, 5)}...` : "Não definida");

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
    
    // Criar o prompt aprimorado para a OpenAI
    const prompt = `
    Por favor, gere uma petição completa do tipo ${tipoPeticao} com o seguinte motivo: "${reason}". 
    Os fatos básicos são: "${description}".
    
    É EXTREMAMENTE IMPORTANTE que você ELABORE E EXPANDA os fatos fornecidos, criando uma narrativa jurídica completa e detalhada. NÃO apenas repita os fatos básicos, mas desenvolva-os de forma profissional e juridicamente adequada.
    
    Preciso que você gere:
    1. Uma versão COMPLETA, DETALHADA e juridicamente adequada dos fatos apresentados, expandindo-os significativamente
    2. Argumentos jurídicos sólidos e DETALHADOS baseados nos fatos, com citações de leis e jurisprudências relevantes
    3. Pedidos claros e objetivos
    
    ${clienteInfo ? `
    IMPORTANTE: Esta petição está sendo feita em nome do cliente cuja qualificação foi informada. Inclua seus dados na petição, especialmente na introdução, mencionando a razão social, CNPJ e demais informações relevantes.
    ` : ''}
    
    Formate sua resposta EXATAMENTE neste formato:
    
    # I - DOS FATOS
    [Sua versão completa e expandida dos fatos aqui - seja detalhado e abrangente]
    
    # II - DOS FUNDAMENTOS JURÍDICOS
    [Seus argumentos jurídicos detalhados aqui - inclua citações de leis, doutrinas e jurisprudências]
    
    # III - DOS PEDIDOS
    [Seus pedidos aqui - seja específico e abrangente]
    
    É EXTREMAMENTE IMPORTANTE que você seja MUITO detalhado e específico nos fatos, argumentos e pedidos, baseando-se nos fatos apresentados, mas expandindo-os significativamente.
    
    Lembre-se que estou gerando uma petição do tipo ${tipoPeticao}, então adapte os argumentos e pedidos de acordo com esse tipo específico.
    
    ${contextoAdicional ? `Contexto adicional para considerar: ${contextoAdicional}` : ''}
    
    ${clienteInfo ? clienteInfo : ''}
    
    Utilize seu conhecimento jurídico especializado para criar uma petição de alta qualidade.
    `;
    
    console.log("Enviando prompt para a OpenAI...");
    
    // Verificar se o ID do assistente está configurado
    const assistantId = process.env.ASSISTANT_ID;
    console.log("Usando ASSISTANT_ID:", assistantId ? `${assistantId.substring(0, 5)}...` : "Não configurado");
    
    // Inicializar variável para armazenar o conteúdo da petição
    let peticaoContent = "";
    
    // Se tiver o ID do assistente, usar o método de assistentes
    if (assistantId) {
      try {
        console.log("Tentando usar a API de Assistentes da OpenAI...");
        
        // Criar um thread
        const thread = await openai.beta.threads.create();
        console.log("Thread criado com ID:", thread.id);
        
        // Adicionar uma mensagem ao thread
        await openai.beta.threads.messages.create(
          thread.id,
          {
            role: "user",
            content: prompt
          }
        );
        
        // Executar o assistente
        console.log("Executando o assistente...");
        const run = await openai.beta.threads.runs.create(
          thread.id,
          {
            assistant_id: assistantId
          }
        );
        
        // Aguardar a conclusão (com timeout)
        let runStatus;
        let attempts = 0;
        const maxAttempts = 30; // 60 segundos (30 * 2)
        
        do {
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
          }
          
          runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
          );
          
          console.log(`Status atual: ${runStatus.status}`);
          attempts++;
          
        } while (runStatus.status !== "completed" && 
                runStatus.status !== "failed" && 
                runStatus.status !== "cancelled" && 
                runStatus.status !== "expired" && 
                attempts < maxAttempts);
        
        // Verificar se o run foi bem-sucedido
        if (runStatus.status === "completed") {
          // Obter mensagens
          const messages = await openai.beta.threads.messages.list(thread.id);
          
          // Obter a última mensagem do assistente
          const assistantMessages = messages.data.filter(msg => msg.role === "assistant");
          
          if (assistantMessages.length > 0) {
            const lastMessage = assistantMessages[0];
            
            // Verificar o tipo de conteúdo e extrair o texto
            if (lastMessage.content[0].type === 'text') {
              const contentValue = lastMessage.content[0].text.value;
              
              peticaoContent = contentValue;
              console.log("Petição gerada com sucesso usando o Assistente. Tamanho:", peticaoContent.length);
            } else {
              console.log("O formato da resposta do assistente não é texto. Usando método alternativo...");
            }
          } else {
            console.log("Nenhuma mensagem do assistente encontrada. Usando método alternativo...");
          }
        } else {
          console.log(`Execução do assistente não foi concluída com sucesso. Status: ${runStatus.status}`);
        }
      } catch (assistantError) {
        console.error("Erro ao usar o Assistente:", assistantError);
        console.log("Usando método alternativo (chat completions)...");
      }
    }
    
    // Se não conseguiu gerar usando o assistente, usar o método de chat completions
    if (!peticaoContent || peticaoContent.length < 500) {
      console.log("Usando método de chat completions...");
      
      // Chamar a API da OpenAI para gerar o conteúdo da petição
      const completion = await openai.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `Você é um advogado especializado em direito administrativo e licitações, com vasta experiência na redação de petições jurídicas. 
            Você deve criar peças jurídicas completas, bem fundamentadas, com citações precisas de leis, jurisprudências e doutrinas.
            Nos argumentos jurídicos, SEMPRE cite artigos específicos de leis, decisões de tribunais, e posicionamentos doutrinários que sejam pertinentes.
            Nos pedidos, seja específico, claro e abrangente, considerando todas as possibilidades jurídicas cabíveis.` 
          },
          { role: "user", content: prompt }
        ],
        model: "gpt-4",
        temperature: 0.7,
        max_tokens: 4000,
      });
      
      peticaoContent = completion.choices[0].message.content || '';
      console.log("Petição gerada com método de chat completions. Tamanho:", peticaoContent.length);
      
      // Verificar se o conteúdo foi gerado corretamente
      if (!peticaoContent || peticaoContent.length < 500) {
        console.log("Conteúdo gerado é muito curto, tentando novamente...");
        
        // Tentar novamente com um modelo diferente
        const secondAttempt = await openai.chat.completions.create({
          messages: [
            { 
              role: "system", 
              content: `Você é um advogado especializado em direito administrativo e licitações, com vasta experiência na redação de petições jurídicas.
              É EXTREMAMENTE IMPORTANTE que você gere um conteúdo completo, detalhado e bem fundamentado.` 
            },
            { role: "user", content: prompt }
          ],
          model: "gpt-4-turbo",
          temperature: 0.8,
          max_tokens: 4000,
        });
        
        peticaoContent = secondAttempt.choices[0].message.content || peticaoContent;
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
    if (fatos.length < 100 || fundamentos.length < 200 || pedidos.length < 50) {
      console.log("Seções da petição incompletas, ajustando conteúdo...");
      
      // Se alguma seção está faltando ou é muito curta, ainda podemos prosseguir com o que foi gerado,
      // mas fazemos um log para monitoramento
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