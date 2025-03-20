# Templates DOCX para Petições

Este diretório contém os templates DOCX utilizados para gerar petições personalizadas. Cada tipo de petição deve ter seu próprio template.

## Nomenclatura dos Templates

Os templates devem ser nomeados de acordo com o tipo de petição, com espaços substituídos por underscores e em minúsculas:

- `recurso_administrativo.docx`
- `impugnacao_edital.docx`
- `mandado_seguranca.docx`
- `contrarrazoes_recurso.docx`

## Placeholders

Os templates podem conter os seguintes placeholders que serão substituídos automaticamente pelo sistema:

| Placeholder | Descrição |
|-------------|-----------|
| `[FATOS]` | Fatos da petição |
| `[FUNDAMENTOS]` | Argumentos jurídicos |
| `[PEDIDOS]` | Pedidos da petição |
| `[DATA]` | Data atual (formato DD/MM/AAAA) |
| `[CIDADE]` | Cidade especificada (padrão: São Paulo) |
| `[CONTRAPARTE]` | Nome da contraparte |
| `[AUTORIDADE]` | Nome da autoridade |
| `[REFERENCIA_PROCESSO]` | Referência do processo |
| `[LOGO_CLIENTE]` | Logo do cliente (será substituída pela imagem) |
| `[NOME_CLIENTE]` | Nome do cliente |
| `[QUALIFICACAO_CLIENTE]` | Qualificação completa do cliente (CNPJ, endereço, etc.) |
| `[ADVOGADO]` | Nome do advogado |
| `[NUMERO_OAB]` | Número da OAB do advogado |

## Exemplo de Uso

Um template típico deve conter uma estrutura semelhante a esta:

```
EXCELENTÍSSIMO(A) SENHOR(A) [AUTORIDADE]

[REFERENCIA_PROCESSO]

[LOGO_CLIENTE]

[NOME_CLIENTE], [QUALIFICACAO_CLIENTE], vem, respeitosamente, à presença de Vossa Excelência, por intermédio de seu(sua) advogado(a) que esta subscreve, apresentar

RECURSO ADMINISTRATIVO

em face de [CONTRAPARTE], pelos fatos e fundamentos a seguir expostos.

I - DOS FATOS

[FATOS]

II - DOS FUNDAMENTOS

[FUNDAMENTOS]

III - DOS PEDIDOS

Ante o exposto, requer:

[PEDIDOS]

Nestes termos,
Pede deferimento.

[CIDADE], [DATA].

[ADVOGADO]
[NUMERO_OAB]
```

## Dicas para Criação de Templates

1. Use estilos consistentes para facilitar a formatação
2. Coloque o placeholder `[LOGO_CLIENTE]` em um parágrafo separado
3. Mantenha os placeholders exatamente como mostrado acima, incluindo os colchetes
4. Teste o template com o script `testar_template_logo.py` para verificar se todos os placeholders estão sendo substituídos corretamente

## Adicionando Novos Templates

Para adicionar um novo tipo de petição:

1. Crie um novo arquivo DOCX com o nome correspondente ao tipo de petição
2. Adicione os placeholders necessários
3. Salve o arquivo neste diretório
4. O sistema reconhecerá automaticamente o novo template quando uma petição desse tipo for solicitada 