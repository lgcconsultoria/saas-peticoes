# Gerador de Petições com IA

Esta aplicação utiliza o assistente da OpenAI para gerar petições jurídicas com base em informações fornecidas pelo usuário.

## Funcionalidades

- Geração de diferentes tipos de petições (Recurso Administrativo, Impugnação ao Edital, Contrarrazões, Representação)
- Extração automática de argumentos jurídicos e pedidos
- Geração de documentos DOCX usando templates personalizados
- Inclusão automática de logos de clientes nos documentos
- Interface web amigável

## Requisitos

- Python 3.8+
- Conta na OpenAI com acesso à API de Assistentes
- ID de um assistente da OpenAI configurado para gerar petições jurídicas

## Instalação

1. Clone o repositório:
```
git clone <url-do-repositorio>
cd python_app
```

2. Instale as dependências:
```
pip install -r requirements.txt
```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```
   OPENAI_API_KEY=sua_chave_api_aqui
   ASSISTANT_ID=id_do_seu_assistente_aqui
   FLASK_ENV=development
   PORT=5000
   ```

## Uso

1. Inicie a aplicação:
```
python app.py
```

2. Acesse a aplicação no navegador:
```
http://localhost:5000
```

3. Selecione o tipo de petição, preencha os campos necessários e clique em "Gerar Petição".

## Estrutura do Projeto

- `app.py`: Arquivo principal da aplicação
- `templates/`: Diretório contendo os templates HTML
- `static/`: Diretório para arquivos estáticos (CSS, JS, imagens)
- `peticoes/`: Diretório onde os documentos gerados são armazenados
- `templates_docx/`: Diretório contendo os templates DOCX para cada tipo de petição
- `clientes/`: Diretório contendo informações dos clientes
  - `clientes.json`: Arquivo com dados dos clientes
  - `logos/`: Diretório para armazenar logos dos clientes

## Templates DOCX

A aplicação utiliza templates DOCX para gerar documentos personalizados. Os templates devem ser nomeados de acordo com o tipo de petição (ex: `recurso_administrativo.docx`, `impugnacao_edital.docx`) e colocados na pasta `templates_docx/`.

Os templates podem conter os seguintes placeholders que serão substituídos automaticamente:

- `[FATOS]`: Fatos da petição
- `[FUNDAMENTOS]`: Argumentos jurídicos
- `[PEDIDOS]`: Pedidos da petição
- `[DATA]`: Data atual
- `[CIDADE]`: Cidade especificada
- `[CONTRAPARTE]`: Nome da contraparte
- `[AUTORIDADE]`: Nome da autoridade
- `[REFERENCIA_PROCESSO]`: Referência do processo
- `[LOGO_CLIENTE]`: Logo do cliente (será substituída pela imagem)

## Logos de Clientes

A aplicação busca automaticamente a logo do cliente pelo nome na pasta `clientes/logos/`. As logos devem ser nomeadas seguindo o padrão `nome_do_cliente.png` (com espaços substituídos por underscores e em minúsculas).

Por exemplo, para um cliente chamado "Empresa ABC", a logo deve ser salva como `empresa_abc.png`.

## Testando a Geração de Documentos

Para testar a geração de documentos com templates e logos, você pode usar o script `testar_template_logo.py`:

```
python testar_template_logo.py
```

Este script cria uma logo de exemplo para um cliente e gera um documento usando o template correspondente ao tipo de petição especificado.

## Configuração do Assistente da OpenAI

Para utilizar esta aplicação, você precisa criar um assistente na OpenAI com as seguintes configurações:

1. Acesse o [OpenAI Platform](https://platform.openai.com/assistants)
2. Crie um novo assistente
3. Configure o assistente com conhecimento em direito e capacidade de gerar petições jurídicas
4. Copie o ID do assistente e adicione ao arquivo `.env`

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto está licenciado sob a licença MIT. 