# Sistema de Templates para Petições

Este sistema permite a criação de petições jurídicas utilizando templates personalizados para cada tipo de documento, com suporte para diferentes clientes e seus papéis específicos em cada tipo de petição.

## Estrutura de Diretórios

- `templates_docx/`: Contém os templates de documentos Word para cada tipo de petição
- `clientes/`: Contém informações sobre os clientes
  - `clientes.json`: Arquivo JSON com dados dos clientes
  - `logos/`: Diretório para armazenar os logos dos clientes

## Tipos de Petição Suportados

O sistema suporta os seguintes tipos de petição:

1. **Recurso Administrativo**
   - Papel do cliente: RECORRENTE
   - Papel da contraparte: RECORRIDA

2. **Contrarrazões ao Recurso Administrativo**
   - Papel do cliente: RECORRIDA
   - Papel da contraparte: RECORRENTE

3. **Mandado de Segurança**
   - Papel do cliente: IMPETRANTE
   - Papel da contraparte: IMPETRADA

4. **Impugnação ao Edital**
   - Papel do cliente: IMPUGNANTE
   - Papel da contraparte: IMPUGNADA

## Gerenciamento de Clientes

Para gerenciar clientes, utilize o script `gerenciar_clientes.py`:

```bash
# Listar clientes
python gerenciar_clientes.py listar

# Adicionar cliente
python gerenciar_clientes.py adicionar --id "cliente3" --nome "Empresa XYZ Ltda." --cnpj "12.345.678/0001-90" --endereco "Av. Paulista, 1000, São Paulo/SP" --logo "clientes/logos/cliente3.png"

# Adicionar advogado a um cliente
python gerenciar_clientes.py advogado --cliente "cliente3" --nome "JOSÉ SILVA" --oab "OAB/SP 12345"

# Remover cliente
python gerenciar_clientes.py remover --id "cliente3"
```

## Gerenciamento de Templates

Para gerenciar templates, utilize o script `gerenciar_templates.py`:

```bash
# Listar templates
python gerenciar_templates.py listar

# Adicionar novo tipo de petição (apenas cria o template, não adiciona ao sistema)
python gerenciar_templates.py adicionar --id "novo_tipo" --titulo "NOVO TIPO DE PETIÇÃO" --papel-cliente "REQUERENTE" --papel-contraparte "REQUERIDA"

# Regenerar template existente
python gerenciar_templates.py regenerar --id "recurso_administrativo"

# Regenerar todos os templates
python gerenciar_templates.py regenerar-todos
```

Para adicionar permanentemente um novo tipo de petição ao sistema, edite o dicionário `TIPOS_PETICAO` no arquivo `templates_manager.py`.

## Geração de Petições

Para gerar uma petição, utilize a interface web ou a API:

### API

```
POST /api/gerar-peticao
{
    "tipo": "recurso_administrativo",
    "motivo": "Motivo da petição",
    "fatos": "Descrição dos fatos",
    "cliente_id": "cliente1",
    "contraparte": "Nome da contraparte",
    "autoridade": "Nome da autoridade",
    "referencia_processo": "Número do processo",
    "cidade": "São Paulo"
}
```

## Personalização de Templates

Os templates são documentos Word (.docx) que contêm placeholders que serão substituídos pelos dados da petição. Os placeholders disponíveis são:

- `[LOGO_CLIENTE]`: Logo do cliente
- `[AUTORIDADE]`: Nome da autoridade destinatária
- `[REFERENCIA_PROCESSO]`: Número do processo
- `[NOME_CLIENTE]`: Nome do cliente
- `[QUALIFICACAO_CLIENTE]`: Qualificação completa do cliente (CNPJ, endereço, papel)
- `[CONTRAPARTE]`: Nome da contraparte
- `[FATOS]`: Descrição dos fatos
- `[FUNDAMENTOS]`: Argumentos jurídicos
- `[PEDIDOS]`: Pedidos da petição
- `[CIDADE]`: Cidade
- `[DATA]`: Data atual
- `[ADVOGADO]`: Nome do advogado
- `[NUMERO_OAB]`: Número da OAB do advogado

## Adicionando Novos Tipos de Petição

Para adicionar um novo tipo de petição permanentemente ao sistema:

1. Edite o arquivo `templates_manager.py` e adicione o novo tipo ao dicionário `TIPOS_PETICAO`:

```python
TIPOS_PETICAO = {
    # ... tipos existentes ...
    'novo_tipo': {
        'titulo': 'NOVO TIPO DE PETIÇÃO',
        'papel_cliente': 'REQUERENTE',
        'papel_contraparte': 'REQUERIDA'
    }
}
```

2. Gere o template para o novo tipo:

```bash
python gerenciar_templates.py regenerar --id "novo_tipo"
```

3. Reinicie o servidor para que as alterações tenham efeito. 