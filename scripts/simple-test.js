const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Caminhos dos arquivos
const templatePath = path.join(__dirname, '../templates/recurso_administrativo.docx');
const outputPath = path.join(__dirname, '../templates/simple_test_output.docx');

// Dados para substituição com valores de teste
const dados = {
    COMPETENTE: 'TESTE_COMPETENTE_FUNCIONANDO',
    CIDADE: 'TESTE_CIDADE_FUNCIONANDO',
    MODALIDADE: 'TESTE_MODALIDADE_FUNCIONANDO',
    PROCESSO: 'TESTE_PROCESSO_FUNCIONANDO',
    OBJETO: 'TESTE_OBJETO_FUNCIONANDO',
    INTRODUCAO: 'TESTE_INTRODUCAO_FUNCIONANDO',
    TEMPESTIVIDADE: 'TESTE_TEMPESTIVIDADE_FUNCIONANDO',
    FATOS: 'TESTE_FATOS_FUNCIONANDO',
    ARGUMENTOS: 'TESTE_ARGUMENTOS_FUNCIONANDO',
    EXEQUIBILIDADE: 'TESTE_EXEQUIBILIDADE_FUNCIONANDO',
    CONCLUSAO: 'TESTE_CONCLUSAO_FUNCIONANDO',
    PEDIDO: 'TESTE_PEDIDO_FUNCIONANDO',
    DATA: 'TESTE_DATA_FUNCIONANDO',
    NOME_ADVOGADO: 'TESTE_NOME_ADVOGADO_FUNCIONANDO',
    NUMERO_OAB: 'TESTE_NUMERO_OAB_FUNCIONANDO',
    AUTORIDADE: 'TESTE_AUTORIDADE_FUNCIONANDO',
    ORGAO: 'TESTE_ORGAO_FUNCIONANDO',
    MOTIVO: 'TESTE_MOTIVO_FUNCIONANDO',
    CLIENTE: 'TESTE_CLIENTE_FUNCIONANDO'
};

console.log('Dados para substituição (primeiros 5 itens):');
Object.entries(dados).slice(0, 5).forEach(([chave, valor]) => {
    console.log(`  ${chave}: ${valor}`);
});

try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Arquivo de template não encontrado: ${templatePath}`);
    }
    console.log(`Template encontrado: ${templatePath}`);
    
    // Ler o arquivo template
    const content = fs.readFileSync(templatePath, 'binary');
    console.log(`Tamanho do template: ${content.length} bytes`);
    
    // Criar o zip
    const zip = new PizZip(content);
    
    // Verificar se o documento.xml existe no arquivo
    if (!zip.files['word/document.xml']) {
        throw new Error('Arquivo word/document.xml não encontrado no template DOCX');
    }
    console.log('Arquivo word/document.xml encontrado no template');
    
    // Criar o docxtemplater
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
            start: '[[',
            end: ']]'
        }
    });
    
    // Configurar logger para verificar erros
    console.log('Configurações do docxtemplater:');
    console.log(`  Delimitadores: [[ e ]]`);
    console.log(`  paragraphLoop: true`);
    console.log(`  linebreaks: true`);
    
    // Renderizar com os dados
    console.log('Iniciando renderização do template...');
    doc.render(dados);
    console.log('Renderização concluída');
    
    // Gerar o documento de saída
    const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
    });
    
    // Obter o conteúdo do documento após a renderização
    const xmlContent = zip.files['word/document.xml'].asText();
    
    // Verificar se ainda há placeholders não substituídos
    const placeholderRegex = /\[\[(.*?)\]\]/g;
    const placeholdersRestantes = xmlContent.match(placeholderRegex);
    
    if (placeholdersRestantes && placeholdersRestantes.length > 0) {
        console.warn(`AVISO: ${placeholdersRestantes.length} placeholders não foram substituídos:`);
        const uniquePlaceholders = [...new Set(placeholdersRestantes)];
        uniquePlaceholders.forEach(p => console.warn(`  - ${p}`));
    } else {
        console.log('Sucesso: Todos os placeholders foram substituídos corretamente');
    }
    
    // Verificar se há "undefined" no texto
    if (xmlContent.includes('undefined')) {
        console.warn('AVISO: O documento contém a palavra "undefined"');
    }
    
    // Salvar o arquivo
    fs.writeFileSync(outputPath, buf);
    console.log(`Arquivo gerado com sucesso: ${outputPath}`);
    
    // Exibir amostra do conteúdo após substituição
    console.log('\nAmostra do texto após substituição:');
    console.log(xmlContent.substring(0, 300) + '...');
    
} catch (error) {
    console.error('Erro:', error);
    
    if (error.properties && error.properties.errors) {
        console.error('Erros detalhados:');
        console.error(JSON.stringify(error.properties.errors, null, 2));
    }
} 