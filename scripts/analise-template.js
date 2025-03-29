// Script para analisar o conteúdo do template preenchido e verificar o que está sendo substituído
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const { DOMParser } = require('@xmldom/xmldom');

// Caminho para o arquivo a ser analisado
const filePath = path.join(__dirname, '../', 'templates/teste_recurso_preenchido.docx');

function analisarDocumento() {
  try {
    console.log('Analisando documento DOCX...');
    
    // Ler o conteúdo do arquivo
    const content = fs.readFileSync(filePath, 'binary');
    const zip = new PizZip(content);
    
    // Extrair o conteúdo XML do documento
    const xmlFile = zip.file("word/document.xml");
    if (!xmlFile) {
      console.error('Arquivo XML não encontrado no documento');
      return;
    }
    
    const text = xmlFile.asText();
    console.log("\n=== CONTEÚDO XML DO DOCUMENTO ===\n");
    
    // Analisar o XML para uma visualização mais estruturada
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    
    // Extrair textos dos parágrafos
    console.log("\n=== PARÁGRAFOS DO DOCUMENTO ===\n");
    const paragraphs = xmlDoc.getElementsByTagName('w:p');
    for (let i = 0; i < paragraphs.length; i++) {
      const textsElements = paragraphs[i].getElementsByTagName('w:t');
      let paragraphText = '';
      
      for (let j = 0; j < textsElements.length; j++) {
        paragraphText += textsElements[j].textContent;
      }
      
      if (paragraphText.trim()) {
        console.log(`Parágrafo ${i+1}: ${paragraphText}`);
      }
    }
    
    // Verificar se há placeholders não substituídos
    console.log("\n=== PROCURANDO PLACEHOLDERS NÃO SUBSTITUÍDOS ===\n");
    const placeholdersPattern = /\[\[(.*?)\]\]/g;
    let match;
    let placeholdersEncontrados = false;
    
    while ((match = placeholdersPattern.exec(text)) !== null) {
      console.log(`Placeholder não substituído: ${match[0]}`);
      placeholdersEncontrados = true;
    }
    
    if (!placeholdersEncontrados) {
      console.log('Nenhum placeholder encontrado no documento.');
    }
    
    // Verificar valores específicos
    console.log("\n=== VERIFICANDO VALORES ESPECÍFICOS ===\n");
    const valores = [
      'Empresa XYZ Ltda.',
      'RECURSO ADMINISTRATIVO',
      'Prefeitura Municipal de São Paulo',
      'Processo Administrativo nº 123/2023'
    ];
    
    valores.forEach(valor => {
      if (text.includes(valor)) {
        console.log(`✅ Valor encontrado: "${valor}"`);
      } else {
        console.log(`❌ Valor NÃO encontrado: "${valor}"`);
      }
    });
    
    // Verificar valores "undefined"
    console.log("\n=== VERIFICANDO SE EXISTEM VALORES 'UNDEFINED' ===\n");
    if (text.includes('undefined')) {
      console.log('⚠️ O documento contém valores "undefined".');
      
      // Tentar encontrar contexto dos indefinidos
      const undefinedPattern = /([^>]{0,30}undefined[^<]{0,30})/g;
      let undefinedMatch;
      while ((undefinedMatch = undefinedPattern.exec(text)) !== null) {
        console.log(`Contexto de undefined: ...${undefinedMatch[1]}...`);
      }
    } else {
      console.log('✅ Não há valores "undefined" no documento.');
    }
    
  } catch (error) {
    console.error('Erro ao analisar o documento:', error);
  }
}

analisarDocumento(); 