const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Diretório raiz do projeto
const rootDir = path.resolve(__dirname, '..');

// Caminho para o template DOCX
const templatePath = path.join(rootDir, 'templates', 'recurso_administrativo.docx');

// Caminho para salvar o arquivo gerado
const outputPath = path.join(rootDir, 'templates', 'teste_recurso_preenchido.docx');

// Dados de exemplo para substituir os placeholders
let dadosTeste = {
  '[[COMPETENTE]]': 'EXCELENTÍSSIMO(A) SENHOR(A) PRESIDENTE DA COMISSÃO DE LICITAÇÃO',
  '[[CIDADE]]': 'São Paulo',
  '[[MODALIDADE]]': 'Pregão Eletrônico',
  '[[PROCESSO]]': '123/2023',
  '[[OBJETO]]': 'Contratação de serviços de TI',
  '[[INTRODUCAO]]': 'Empresa XYZ Ltda., pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 12.345.678/0001-90, com sede em Rua Teste, nº 123, Centro, São Paulo/SP, CEP: 01234-567, neste ato representada por seu sócio-diretor João da Silva, vem, respeitosamente, apresentar RECURSO ADMINISTRATIVO contra a decisão que desclassificou sua proposta no certame em referência, pelos motivos de fato e de direito a seguir expostos.',
  '[[TEMPESTIVIDADE]]': 'O presente recurso é tempestivo, tendo em vista que a decisão ora recorrida foi publicada no dia 15/03/2023, e o prazo para apresentação de recurso, conforme item 14.1 do Edital, é de 3 (três) dias úteis, findando-se, portanto, em 20/03/2023.',
  '[[FATOS]]': 'A empresa recorrente participou do Pregão Eletrônico nº 123/2023, cujo objeto é a contratação de serviços de TI. No dia 15/03/2023, foi indevidamente desclassificada sob a alegação de que não atendeu aos requisitos técnicos previstos no edital. Contudo, conforme será demonstrado a seguir, a empresa cumpriu integralmente todas as exigências do instrumento convocatório.',
  '[[ARGUMENTOS]]': 'Conforme estabelece o Art. 17 da Lei nº 14.133/2021, a fase preparatória é caracterizada pelo planejamento e deve compatibilizar-se com o plano de contratações anual, sempre que elaborado, e com as leis orçamentárias.\n\nO Acórdão 2622/2013-TCU-Plenário estabelece claramente os parâmetros que devem ser observados pela Administração Pública nas contratações, determinando que os critérios de julgamento sejam objetivos e vinculados ao instrumento convocatório.\n\nSegundo JUSTEN FILHO, Marçal (Comentários à Lei de Licitações e Contratos Administrativos, 2021), os princípios da vinculação ao instrumento convocatório e do julgamento objetivo impedem que a Administração desclassifique um licitante com base em critérios não previstos no edital.',
  '[[EXEQUIBILIDADE]]': 'A proposta apresentada pela recorrente é plenamente exequível, conforme demonstrado na planilha de custos apresentada na fase de aceitação. Todos os custos foram devidamente detalhados, incluindo salários, encargos sociais, despesas administrativas e lucro.',
  '[[CONCLUSAO]]': 'Diante do exposto, conclui-se que a decisão que desclassificou a proposta da recorrente deve ser reformada, por contrariar as disposições do edital e da legislação aplicável.',
  '[[PEDIDO]]': '1. O recebimento e processamento do presente recurso, com efeito suspensivo, nos termos do Art. 165 da Lei nº 14.133/2021;\n\n2. A reconsideração da decisão que desclassificou a empresa recorrente;\n\n3. Caso não seja reconsiderada a decisão, o encaminhamento do recurso à autoridade superior, para apreciação e julgamento;\n\n4. Ao final, o provimento do recurso para declarar a empresa recorrente vencedora do certame, por ter apresentado a proposta mais vantajosa para a Administração.',
  '[[DATA]]': '20 de março de 2023',
  '[[NOME_ADVOGADO]]': 'Dr. José Santos',
  '[[NUMERO_OAB]]': 'OAB/SP 123.456',
  '[[AUTORIDADE]]': 'EXCELENTÍSSIMO(A) SENHOR(A) PRESIDENTE DA COMISSÃO DE LICITAÇÃO',
  '[[ORGAO]]': 'Prefeitura Municipal de São Paulo',
  '[[MOTIVO]]': 'Desclassificação indevida em processo licitatório',
  '[[CLIENTE]]': 'Empresa XYZ Ltda.'
};

// Verificar valores undefined ou null e substituir por espaço em branco
console.log("=== VALORES ORIGINAIS PARA SUBSTITUIÇÃO ===");
Object.entries(dadosTeste).forEach(([key, value]) => {
  console.log(`  ${key} => [${typeof value}] ${value === '' ? '(vazio)' : value.substring(0, 50) + (value.length > 50 ? '...' : '')}`);
});

// Verificar e substituir valores problemáticos
for (const key of Object.keys(dadosTeste)) {
  // Verificar se o valor é undefined, null ou string vazia - apenas nesses casos substituir por espaço
  if (dadosTeste[key] === undefined || dadosTeste[key] === null || dadosTeste[key] === '') {
    console.warn(`Aviso: Valor ausente encontrado para ${key}, substituindo por espaço em branco`);
    dadosTeste[key] = ' ';
    continue;
  }
  
  // Se não for uma string, tentar converter para string
  if (typeof dadosTeste[key] !== 'string') {
    try {
      console.warn(`Aviso: Valor não-string encontrado para ${key}, convertendo para string`);
      dadosTeste[key] = String(dadosTeste[key]);
    } catch (e) {
      console.error(`Erro ao converter valor para ${key}, substituindo por espaço em branco`, e);
      dadosTeste[key] = ' ';
    }
    continue;
  }
  
  // Se for literalmente a string 'undefined' ou 'null', substituir
  if (dadosTeste[key] === 'undefined' || dadosTeste[key] === 'null') {
    console.warn(`Aviso: String literal "${dadosTeste[key]}" encontrada para ${key}, substituindo por espaço em branco`);
    dadosTeste[key] = ' ';
    continue;
  }

  // Se for uma string normal, verifica se contém palavras problemáticas sozinhas
  if (dadosTeste[key].includes('undefined') || dadosTeste[key].includes('null')) {
    console.warn(`Aviso: String contendo "undefined" ou "null" encontrada para ${key}, limpando apenas essas palavras`);
    // Substituir apenas as palavras problemáticas mantendo o resto do texto
    dadosTeste[key] = dadosTeste[key]
      .replace(/\bundefined\b/g, ' ')
      .replace(/\bnull\b/g, ' ');
  }
}

// Para debug - imprimir valores finais
console.log("=== VALORES PARA SUBSTITUIÇÃO (FINAL) ===");
Object.entries(dadosTeste).forEach(([key, value]) => {
  console.log(`  ${key} => [${typeof value}] ${value === '' ? '(vazio)' : value.substring(0, 50) + (value.length > 50 ? '...' : '')}`);
});

// Função principal para testar o template
async function testarTemplate() {
  console.log('Iniciando teste do template DOCX...');
  
  try {
    // Verificar se o template existe
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template não encontrado: ${templatePath}`);
    }
    
    console.log(`Template encontrado: ${templatePath}`);
    
    // Carregar o conteúdo do template
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    
    // Verificar se o arquivo XML principal existe no template
    if (!zip.file("word/document.xml")) {
      throw new Error("Arquivo word/document.xml não encontrado no template DOCX");
    }
    
    // Abordagem mais simples com a API mais atual
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '[[',
        end: ']]'
      }
    });
    
    // Log para verificar os dados antes da substituição
    console.log("\n=== DADOS PARA SUBSTITUIÇÃO (RESUMO) ===");
    Object.entries(dadosTeste).slice(0, 5).forEach(([key, value]) => {
      console.log(`${key} => "${value !== undefined && value !== null ? value : '(vazio)'}"`);
    });
    
    // Executar a substituição
    try {
      console.log("Iniciando renderização do template...");
      
      // Renderizar o template com os dados de teste
      doc.render(dadosTeste);
      
      console.log("Renderização do template concluída com sucesso");

      // Verificar se ainda há placeholders não substituídos
      const xmlFile = doc.getZip().file("word/document.xml");
      if (!xmlFile) {
        throw new Error("Arquivo XML não encontrado após renderização");
      }
      
      const text = xmlFile.asText();
      const naoSubstituidos = text.match(/\[\[(.*?)\]\]/g);
      
      if (naoSubstituidos && naoSubstituidos.length > 0) {
        console.warn(`AVISO: Encontrados ${naoSubstituidos.length} placeholders não substituídos:`);
        naoSubstituidos.forEach(placeholder => {
          console.warn(`  - ${placeholder}`);
        });
      } else {
        console.log("Todos os placeholders foram substituídos com sucesso");
      }
      
      // Limpeza de possíveis "undefined" no documento
      if (text.includes('undefined')) {
        console.warn("Encontrada a palavra 'undefined' no documento. Limpando...");
        const cleanedText = text.replace(/\bundefined\b/g, ' ');
        doc.getZip().file("word/document.xml", cleanedText);
        console.log("Limpeza de 'undefined' concluída com sucesso");
      }
      
      // Mostrar amostra do texto após substituição
      console.log("\n=== AMOSTRA DO TEXTO APÓS SUBSTITUIÇÃO ===");
      const textSample = text.substring(0, 300).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(textSample);
    } catch (error) {
      console.error('Erro ao renderizar template:', error);
      
      // Extrair informações mais detalhadas do erro do docxtemplater
      if (error.properties && error.properties.errors) {
        console.error('Erros detalhados:');
        console.error(JSON.stringify(error.properties.errors, null, 2));
      }
      
      throw error;
    }
    
    // Gerar o arquivo de saída de teste
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });
    
    // Salvar o arquivo gerado
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Arquivo gerado com sucesso: ${outputPath}`);
    
    // Opcional: Gerar uma cópia do template com nome fixo para uso em produção
    const prodOutputPath = path.join(rootDir, 'templates', 'recurso_administrativo_preenchido.docx');
    fs.writeFileSync(prodOutputPath, buffer);
    console.log(`Arquivo de produção gerado: ${prodOutputPath}`);
    
    console.log('Placeholders substituídos:');
    Object.keys(dadosTeste).forEach(key => {
      console.log(`  ${key} => ${dadosTeste[key].substring(0, 30)}${dadosTeste[key].length > 30 ? '...' : ''}`);
    });
    
    console.log('\nTeste concluído com sucesso!');
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar o teste
testarTemplate(); 