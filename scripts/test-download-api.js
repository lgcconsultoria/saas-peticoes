// Script para testar a API de download com dados simulados
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

async function testarDownloadAPI() {
  console.log('Iniciando teste da API de download...');
  
  // Dados simulados para o teste
  const dadosTeste = {
    peticaoId: 1,  // ID fictício
    teste: true,   // Ativar modo de teste
    content: `
FATOS:
A empresa recorrente participou do procedimento licitatório na modalidade Pregão Eletrônico nº 123/2023, que tinha como objeto a contratação de serviços de TI. Após a fase de lances, a empresa foi desclassificada sob a alegação de não atendimento ao item 7.3 do edital, referente à qualificação técnica.

ARGUMENTOS:
Conforme estabelece o Art. 17 do Decreto Federal nº 10.024/2019, que regulamenta a modalidade de licitação pregão na forma eletrônica, a desclassificação da proposta somente pode ocorrer quando há descumprimento dos requisitos estabelecidos no edital. No caso em tela, a empresa atendeu plenamente às exigências do instrumento convocatório, tendo apresentado todos os atestados de capacidade técnica solicitados, conforme comprova a documentação anexa.

PEDIDO:
1. O recebimento e processamento do presente recurso, com efeito suspensivo, nos termos do Art. 109, §2º da Lei 8.666/93;
2. No mérito, que seja dado provimento ao recurso, reformando-se a decisão que desclassificou a proposta da Recorrente;
3. Que seja determinado o retorno do procedimento à fase de aceitação de propostas, com a consequente classificação da proposta da Recorrente.`
  };

  try {
    console.log('Chamando a API de download...');
    // Simular a chamada à API
    const response = await fetch('http://localhost:3000/api/peticoes/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosTeste),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na API:', errorData);
      return;
    }

    const data = await response.json();
    console.log('Resposta recebida da API');

    if (data.success && data.content) {
      // Decodificar o conteúdo base64
      const binaryString = Buffer.from(data.content, 'base64');
      
      // Salvar o arquivo
      const outputPath = path.join(__dirname, '../', 'teste_download_api.docx');
      fs.writeFileSync(outputPath, binaryString);
      
      console.log(`Arquivo salvo com sucesso em: ${outputPath}`);
      
      // Validar o documento gerado
      validarDocumentoGerado(outputPath);
    } else {
      console.log('Não foi possível salvar o arquivo, verifique a resposta da API');
    }
  } catch (error) {
    console.error('Erro ao testar a API:', error);
  }
}

function validarDocumentoGerado(filePath) {
  try {
    console.log('Validando documento gerado...');
    
    // Ler o documento gerado
    const content = fs.readFileSync(filePath, 'binary');
    const zip = new PizZip(content);
    
    // Extrair o conteúdo XML do documento
    const xmlFile = zip.file("word/document.xml");
    if (!xmlFile) {
      console.error('Arquivo XML não encontrado no documento');
      return;
    }
    
    const text = xmlFile.asText();
    
    // Verificar se ainda existem placeholders não substituídos
    const placeholdersNaoSubstituidos = text.match(/\[\[(.*?)\]\]/g);
    if (placeholdersNaoSubstituidos && placeholdersNaoSubstituidos.length > 0) {
      console.error('ERRO: Existem placeholders não substituídos:');
      placeholdersNaoSubstituidos.forEach(placeholder => {
        console.error(`  - ${placeholder}`);
      });
    } else {
      console.log('SUCESSO: Todos os placeholders foram substituídos corretamente');
    }
    
    // Verificar se os valores esperados foram incluídos no documento
    const valoresEsperados = [
      'Empresa XYZ Ltda.',
      'RECURSO',
      'Prefeitura Municipal de São Paulo',
      'Processo Administrativo nº 123/2023'
    ];
    
    const valoresFaltantes = valoresEsperados.filter(valor => !text.includes(valor));
    
    if (valoresFaltantes.length > 0) {
      console.error('ERRO: Os seguintes valores esperados não foram encontrados no documento:');
      valoresFaltantes.forEach(valor => {
        console.error(`  - ${valor}`);
      });
    } else {
      console.log('SUCESSO: Todos os valores esperados foram encontrados no documento');
    }
    
    console.log('Validação do documento concluída');
  } catch (error) {
    console.error('Erro ao validar o documento:', error);
  }
}

testarDownloadAPI(); 