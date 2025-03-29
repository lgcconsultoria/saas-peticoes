// Script para analisar o documento original do template e identificar todos os placeholders
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const { DOMParser } = require('@xmldom/xmldom');

// Caminho para o arquivo a ser analisado
const filePath = path.join(__dirname, '../', 'templates/recurso_administrativo.docx');

console.log(`Iniciando análise do arquivo template: ${filePath}`);

try {
  // Verificar se o arquivo existe
  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo template não encontrado: ${filePath}`);
    process.exit(1);
  }
  
  console.log('Arquivo template encontrado, lendo conteúdo...');
  
  // Ler o conteúdo do arquivo
  const content = fs.readFileSync(filePath, 'binary');
  console.log(`Arquivo template lido, tamanho: ${content.length} bytes`);
  
  const zip = new PizZip(content);
  console.log('Arquivo ZIP processado');
  
  // Extrair o conteúdo XML do documento
  const xmlFile = zip.file("word/document.xml");
  if (!xmlFile) {
    console.error('Arquivo XML não encontrado no documento');
    return;
  }
  
  const text = xmlFile.asText();
  
  // Analisar o XML para uma visualização mais estruturada
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');
  
  // Extrair textos dos parágrafos
  console.log("\n=== PARÁGRAFOS DO DOCUMENTO TEMPLATE ===\n");
  const paragraphs = xmlDoc.getElementsByTagName('w:p');
  
  let todoConteudo = '';
  for (let i = 0; i < paragraphs.length; i++) {
    const textsElements = paragraphs[i].getElementsByTagName('w:t');
    let paragraphText = '';
    
    for (let j = 0; j < textsElements.length; j++) {
      paragraphText += textsElements[j].textContent;
    }
    
    if (paragraphText.trim()) {
      console.log(`Parágrafo ${i+1}: ${paragraphText}`);
      todoConteudo += paragraphText + ' ';
    }
  }
  
  // Verificar e listar todos os placeholders no formato [[PALAVRA]]
  console.log("\n=== PLACEHOLDERS ENCONTRADOS NO TEMPLATE ===\n");
  const placeholdersPattern = /\[\[(.*?)\]\]/g;
  let match;
  let placeholders = [];
  
  while ((match = placeholdersPattern.exec(todoConteudo)) !== null) {
    if (!placeholders.includes(match[0])) {
      placeholders.push(match[0]);
      console.log(`${match[0]}`);
    }
  }
  
  console.log(`\nTotal de placeholders únicos encontrados: ${placeholders.length}`);
  
  // Verificar se existem outros padrões de variáveis
  console.log("\n=== VERIFICANDO OUTROS PADRÕES DE VARIÁVEIS ===\n");
  const outrosPatterns = [
    { pattern: /\{(.*?)\}/g, descricao: 'chaves { }' },
    { pattern: /#(.*?)#/g, descricao: 'hashtags # #' },
    { pattern: /<%(.*?)%>/g, descricao: 'tags EJS <% %>' },
    { pattern: /\$(.*?)\$/g, descricao: 'cifrões $ $' },
    { pattern: /@(.*?)@/g, descricao: 'arrobas @ @' },
  ];
  
  outrosPatterns.forEach(({ pattern, descricao }) => {
    let outrosMatch;
    let encontrados = [];
    
    while ((outrosMatch = pattern.exec(todoConteudo)) !== null) {
      if (!encontrados.includes(outrosMatch[0])) {
        encontrados.push(outrosMatch[0]);
      }
    }
    
    if (encontrados.length > 0) {
      console.log(`Variáveis com ${descricao} encontradas: ${encontrados.join(', ')} (total: ${encontrados.length})`);
    }
  });
} catch (error) {
  console.error('Erro ao analisar o documento template:', error);
} 