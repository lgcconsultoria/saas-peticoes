// Script simples para verificar o conteúdo do documento gerado
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

// Diretório raiz do projeto
const rootDir = path.resolve(__dirname, '..');

// Caminho para o arquivo a ser analisado
const filePath = path.join(rootDir, 'templates', 'recurso_administrativo_preenchido.docx');

// Caminho para salvar o XML extraído
const xmlOutputPath = path.join(rootDir, 'temp', 'document_content.xml');

console.log(`Iniciando verificação do arquivo: ${filePath}`);

try {
  // Verificar se o arquivo existe
  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }
  
  console.log('Arquivo encontrado, lendo conteúdo...');
  
  // Ler o arquivo DOCX
  const fileContent = fs.readFileSync(filePath);
  console.log(`Arquivo lido, tamanho: ${fileContent.length} bytes`);
  
  // Processar como ZIP
  const zip = new PizZip(fileContent);
  console.log('Arquivo ZIP processado');
  
  // Extrair o conteúdo XML
  const xmlFile = zip.file('word/document.xml');
  if (!xmlFile) {
    console.error('Não foi possível encontrar o arquivo XML no DOCX');
    process.exit(1);
  }
  
  const xmlContent = xmlFile.asText();
  console.log('Arquivo XML encontrado, extraindo texto...');
  console.log(`Texto extraído, tamanho: ${xmlContent.length} caracteres`);
  console.log(`Amostra do texto: "${xmlContent.substring(0, 50)}..."`);
  
  // Salvar o XML para análise
  // Certificar-se de que o diretório 'temp' existe
  const tempDir = path.join(rootDir, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  fs.writeFileSync(xmlOutputPath, xmlContent);
  console.log(`XML salvo para análise em: ${xmlOutputPath}`);
  
  // Extrair texto puro do documento para análise de conteúdo (sem XML)
  console.log('\n=== EXTRAINDO TEXTO PURO DO DOCUMENTO ===\n');
  
  // Função simplificada para extrair texto de um XML, removendo tags
  function extrairTextoPuro(xmlString) {
    return xmlString
      .replace(/<[^>]+>/g, ' ')  // Remove todas as tags XML
      .replace(/\s+/g, ' ')      // Normaliza espaços em branco
      .trim();                   // Remove espaços em branco no início e fim
  }
  
  const textoPuro = extrairTextoPuro(xmlContent);
  console.log(`Tamanho do texto puro: ${textoPuro.length} caracteres`);
  console.log(`Amostra: "${textoPuro.substring(0, 200)}..."`);
  
  // Verificar palavras-chave importantes que deveriam estar no documento
  console.log('\n=== VERIFICANDO PALAVRAS-CHAVE ESPECÍFICAS ===\n');
  const palavrasChave = [
    'EXCELENTÍSSIMO', 
    'São Paulo', 
    'Pregão Eletrônico', 
    'recurso', 
    'empresa recorrente',
    'José Santos',
    'OAB'
  ];
  
  palavrasChave.forEach(palavra => {
    if (textoPuro.includes(palavra)) {
      console.log(`✅ Encontrada: "${palavra}"`);
    } else {
      console.log(`❌ NÃO encontrada: "${palavra}"`);
    }
  });
  
  // Análise mais detalhada do conteúdo do documento, semelhante ao analise-documento-template.js
  console.log('\n=== CONTEÚDO DOS PARÁGRAFOS DO DOCUMENTO ===\n');
  
  try {
    // Usar a mesma técnica que usamos na análise do template
    const { DOMParser } = require('@xmldom/xmldom');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Extrair textos dos parágrafos
    const paragraphs = xmlDoc.getElementsByTagName('w:p');
    let paragraphCount = 0;
    
    for (let i = 0; i < paragraphs.length && paragraphCount < 20; i++) {
      const textsElements = paragraphs[i].getElementsByTagName('w:t');
      let paragraphText = '';
      
      for (let j = 0; j < textsElements.length; j++) {
        paragraphText += textsElements[j].textContent;
      }
      
      if (paragraphText.trim()) {
        paragraphCount++;
        console.log(`Parágrafo ${paragraphCount}: ${paragraphText}`);
      }
    }
    
    if (paragraphCount === 0) {
      console.log("ERRO: Nenhum parágrafo com texto encontrado no documento!");
    } else if (paragraphCount < 20) {
      console.log(`Total de parágrafos com texto: ${paragraphCount}`);
    } else {
      console.log("... mais parágrafos omitidos ...");
    }
  } catch (error) {
    console.error('Erro ao analisar o documento:', error);
  }
  
  // Verificar se há "undefined" no texto
  console.log('Verificando se há "undefined" no documento...');
  
  // Verificar se há a palavra "undefined"
  const containsUndefined = xmlContent.includes('undefined');
  
  if (containsUndefined) {
    console.error('ERRO: O documento contém a palavra "undefined"');
    
    // Encontrar todas as ocorrências e mostrar o contexto
    let undefinedCount = 0;
    let index = 0;
    const matches = [];
    
    while (true) {
      index = xmlContent.indexOf('undefined', index);
      if (index === -1) break;
      
      undefinedCount++;
      
      // Pegar contexto (30 caracteres antes e depois)
      const start = Math.max(0, index - 50);
      const end = Math.min(xmlContent.length, index + 50);
      const context = xmlContent.substring(start, end);
      
      matches.push(context);
      
      // Avançar para a próxima ocorrência
      index += 9; // 'undefined'.length
    }
    
    // Mostrar até 15 ocorrências com contexto
    const maxToShow = Math.min(matches.length, 15);
    for (let i = 0; i < maxToShow; i++) {
      console.error(`  Ocorrência ${i+1}: ${matches[i]}`);
    }
    
    console.error(`  Total de ocorrências: ${undefinedCount}`);
  } else {
    console.log('SUCESSO: O documento não contém a palavra "undefined"');
  }
  
  // Verificar se há "[UNDEFINED]" no texto
  console.log('Verificando se há "[UNDEFINED]" no documento...');
  
  const containsUndefinedTag = xmlContent.includes('[UNDEFINED]');
  
  if (containsUndefinedTag) {
    console.error('ERRO: O documento contém a tag "[UNDEFINED]"');
    
    // Encontrar todas as ocorrências e mostrar o contexto
    let undefinedCount = 0;
    let index = 0;
    const matches = [];
    
    while (true) {
      index = xmlContent.indexOf('[UNDEFINED]', index);
      if (index === -1) break;
      
      undefinedCount++;
      
      // Pegar contexto (30 caracteres antes e depois)
      const start = Math.max(0, index - 50);
      const end = Math.min(xmlContent.length, index + 50);
      const context = xmlContent.substring(start, end);
      
      matches.push(context);
      
      // Avançar para a próxima ocorrência
      index += 11; // '[UNDEFINED]'.length
    }
    
    // Mostrar até 15 ocorrências com contexto
    const maxToShow = Math.min(matches.length, 15);
    for (let i = 0; i < maxToShow; i++) {
      console.error(`  Ocorrência ${i+1}: ${matches[i]}`);
    }
    
    console.error(`  Total de ocorrências: ${undefinedCount}`);
  } else {
    console.log('SUCESSO: O documento não contém a tag "[UNDEFINED]"');
  }
  
  // Verificar se há placeholders não substituídos
  console.log('Verificando se há placeholders não substituídos...');
  
  const placeholderRegex = /\[\[(.*?)\]\]/g;
  const placeholders = xmlContent.match(placeholderRegex);
  
  if (placeholders && placeholders.length > 0) {
    console.error(`ERRO: Encontrados ${placeholders.length} placeholders não substituídos:`);
    const uniquePlaceholders = [...new Set(placeholders)];
    uniquePlaceholders.forEach(placeholder => {
      console.error(`  - ${placeholder}`);
    });
  } else {
    console.log('SUCESSO: Todos os placeholders foram substituídos corretamente');
  }
  
  console.log('Verificação concluída!');
  
} catch (error) {
  console.error('Erro durante a verificação:', error);
  process.exit(1);
} 