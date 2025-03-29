# Documentação da Implementação do Sistema de Templates DOCX

Este documento descreve a implementação do sistema de geração de petições em formato DOCX utilizando templates predefinidos. O sistema é capaz de substituir variáveis no template por conteúdo dinâmico gerado pela IA ou fornecido pelo usuário.

## Visão Geral

O sistema de templates DOCX foi implementado para permitir a geração de petições com formatação profissional e padronizada. O processo envolve:

1. A IA gera o conteúdo textual da petição com base nos inputs do usuário
2. O sistema extrai as seções relevantes do conteúdo (fatos, argumentos, pedidos)
3. Essas seções e outros dados são inseridos em um template DOCX pré-formatado
4. O documento final é disponibilizado para download pelo usuário

## Arquivos Principais

Os principais arquivos envolvidos nesta implementação são:

- `src/app/api/peticoes/download/route.ts`: API que processa a requisição de download, substitui as variáveis no template e retorna o documento gerado
- `templates/recurso_administrativo.docx`: Template DOCX com placeholders para substituição
- `scripts/test-template.js`: Script para testar a substituição de variáveis no template
- `scripts/test-download-api.js`: Script para testar a API de download

## Dependências Utilizadas

- `docxtemplater`: Biblioteca para manipulação de documentos DOCX e substituição de variáveis
- `pizzip`: Biblioteca para manipulação de arquivos ZIP (os arquivos DOCX são internamente arquivos ZIP)

## Formato dos Placeholders

Os placeholders no template devem seguir o formato `[[NOME_VARIAVEL]]`. Por exemplo:

- `[[AUTORIDADE]]`
- `[[PROCESSO]]`
- `[[CLIENTE]]`
- etc.

## Lista de Placeholders Suportados

O sistema atualmente suporta os seguintes placeholders:

| Placeholder | Descrição |
|-------------|-----------|
| `[[AUTORIDADE]]` | Autoridade a quem a petição é dirigida |
| `[[PROCESSO]]` | Número do processo administrativo |
| `[[CLIENTE]]` | Nome do cliente |
| `[[CLIENTE_QUALIFICACAO]]` | Qualificação completa do cliente (razão social, CNPJ, endereço) |
| `[[TIPO_PETICAO]]` | Tipo da petição (ex: RECURSO ADMINISTRATIVO) |
| `[[CONTRAPARTE]]` | Nome da contraparte |
| `[[FATOS]]` | Seção de descrição dos fatos |
| `[[ARGUMENTOS]]` | Seção de argumentação jurídica |
| `[[PEDIDOS]]` | Seção de pedidos |
| `[[CIDADE_DATA]]` | Cidade e data formatadas |
| `[[ADVOGADO]]` | Nome do advogado |
| `[[OAB]]` | Número da OAB |
| `[[ORGAO]]` | Órgão relacionado |
| `[[MOTIVO]]` | Motivo do recurso |
| `[[OBJETO]]` | Objeto da licitação |
| `[[MODALIDADE]]` | Modalidade da licitação |

## Como Funciona a Substituição

O processo de substituição de variáveis no template funciona da seguinte forma:

1. O template DOCX é carregado usando a biblioteca `PizZip`
2. Um objeto `Docxtemplater` é criado com configurações específicas para os delimitadores `[[` e `]]`
3. Os dados para substituição são definidos através do método `setData()`
4. O método `render()` é chamado para realizar a substituição das variáveis
5. O documento resultante é convertido para um buffer e disponibilizado para download

## Configurações Importantes

As configurações principais para o `Docxtemplater` são:

```javascript
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,  // Permite que parágrafos sejam repetidos em loops
  linebreaks: true,     // Preserva quebras de linha no texto
  delimiters: {         // Define os delimitadores para os placeholders
    start: '[[',
    end: ']]'
  }
});
```

## Como Criar Novos Templates

Para criar um novo template:

1. Crie um documento DOCX com a formatação desejada
2. Insira os placeholders no formato `[[NOME_VARIAVEL]]` nos locais onde o conteúdo dinâmico deve ser inserido
3. Salve o arquivo na pasta `templates/` do projeto
4. Atualize a lógica na API de download para suportar o novo template

## Tratamento de Erros

O sistema inclui tratamento de erros para:

- Verificar se todos os placeholders foram substituídos
- Capturar erros específicos do `docxtemplater` (sintaxe, tags não fechadas, etc.)
- Validar a existência e acesso ao arquivo de template

## Testes

Dois scripts de teste foram implementados:

1. `scripts/test-template.js`: Testa diretamente a substituição de variáveis no template
2. `scripts/test-download-api.js`: Testa a API de download completa

Para executar os testes:

```bash
node scripts/test-template.js
node scripts/test-download-api.js
```

## Modo de Teste

A API inclui um modo de teste que pode ser ativado passando `teste: true` no corpo da requisição. Isso permite testar a API sem a necessidade de autenticação e usa dados simulados.

## Considerações Futuras

Para futuras melhorias do sistema, considere:

1. Adicionar mais templates para diferentes tipos de petições
2. Implementar um sistema de versionamento de templates
3. Permitir que o usuário escolha entre diferentes templates para o mesmo tipo de petição
4. Resolver o aviso de método depreciado `.setData()` atualizando para a nova API recomendada

## Solução de Problemas

Se o documento gerado estiver com placeholders não substituídos:

1. Verifique se os placeholders no template estão no formato correto `[[NOME_VARIAVEL]]`
2. Confira se todos os dados necessários estão sendo passados no objeto `replacements`
3. Verifique os logs do servidor para mensagens de erro detalhadas
4. Execute o script de teste para validar a substituição de variáveis isoladamente 