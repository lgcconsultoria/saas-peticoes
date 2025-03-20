# Gerenciamento de Assistentes OpenAI

Este conjunto de scripts permite gerenciar assistentes da OpenAI através da API v2 de Assistentes.

## Requisitos

- Python 3.6+
- Pacotes: `requests`, `python-dotenv`
- Arquivo `.env` com a chave da API OpenAI (`OPENAI_API_KEY`)

## Scripts Disponíveis

### 1. Listar Assistentes

Lista todos os assistentes disponíveis na sua conta OpenAI.

```bash
python listar_assistentes.py
```

### 2. Obter Detalhes de um Assistente

Obtém informações detalhadas sobre um assistente específico.

```bash
python detalhes_assistente.py <ID_DO_ASSISTENTE>
```

Exemplo:
```bash
python detalhes_assistente.py asst_LukZB8EwB5RRmSBvKNd5j0ee
```

### 3. Criar um Novo Assistente

Cria um novo assistente com os parâmetros especificados.

```bash
python criar_assistente.py --nome "Nome do Assistente" --modelo "gpt-4o" [--descricao "Descrição"] [--instrucoes "Instruções"] [--ferramentas "code_interpreter,file_search"]
```

Exemplo:
```bash
python criar_assistente.py --nome "Assistente Jurídico" --modelo "gpt-4o" --descricao "Assistente especializado em direito" --ferramentas "code_interpreter,file_search" --instrucoes "Você é um assistente jurídico especializado em direito administrativo."
```

Ferramentas disponíveis:
- `code_interpreter`: Permite que o assistente execute código
- `retrieval`: Permite que o assistente recupere informações de arquivos
- `file_search`: Permite que o assistente pesquise em arquivos
- `function`: Permite que o assistente chame funções

### 4. Excluir um Assistente

Exclui um assistente existente.

```bash
python excluir_assistente.py <ID_DO_ASSISTENTE>
```

Exemplo:
```bash
python excluir_assistente.py asst_z7PTvZH6PvJhuT7IqvKqSt1y
```

## Observações

- O ID do assistente criado é automaticamente salvo no arquivo `.env` com o formato `ASSISTANT_ID_NOME_DO_ASSISTENTE=asst_xyz123`.
- Ao excluir um assistente, a referência ao seu ID também é removida do arquivo `.env`.
- Todos os scripts utilizam a API v2 de Assistentes da OpenAI.

## Exemplos de Uso

### Fluxo Completo

1. Listar assistentes existentes:
   ```bash
   python listar_assistentes.py
   ```

2. Criar um novo assistente:
   ```bash
   python criar_assistente.py --nome "Assistente Jurídico" --modelo "gpt-4o" --ferramentas "code_interpreter,file_search"
   ```

3. Verificar detalhes do assistente criado:
   ```bash
   python detalhes_assistente.py <ID_DO_ASSISTENTE_CRIADO>
   ```

4. Excluir o assistente quando não for mais necessário:
   ```bash
   python excluir_assistente.py <ID_DO_ASSISTENTE_CRIADO>
   ``` 