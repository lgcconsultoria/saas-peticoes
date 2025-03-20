# Logos de Clientes

Este diretório contém as logos dos clientes utilizadas nos documentos gerados pelo sistema.

## Nomenclatura das Logos

As logos devem ser nomeadas seguindo o padrão do nome do cliente, com espaços substituídos por underscores e em minúsculas:

- Para o cliente "Empresa ABC" → `empresa_abc.png`
- Para o cliente "XYZ Consultoria" → `xyz_consultoria.png`

## Formatos Suportados

O sistema suporta os seguintes formatos de imagem:

- PNG (`.png`) - Recomendado para melhor qualidade
- JPEG (`.jpg`, `.jpeg`)
- GIF (`.gif`)

## Tamanho Recomendado

Para melhor visualização nos documentos, recomenda-se que as logos tenham:

- Largura: entre 300 e 500 pixels
- Altura: entre 100 e 200 pixels
- Resolução: 300 DPI

## Como Adicionar uma Nova Logo

1. Obtenha a logo do cliente em um dos formatos suportados
2. Renomeie o arquivo seguindo o padrão `nome_do_cliente.png` (ou extensão correspondente)
3. Coloque o arquivo neste diretório
4. O sistema buscará automaticamente a logo pelo nome do cliente quando um documento for gerado

## Geração Automática de Logos para Testes

O script `testar_template_logo.py` pode gerar logos de exemplo para testes. Para usar esta funcionalidade:

```python
from testar_template_logo import criar_logo_exemplo

# Criar uma logo para o cliente "Empresa ABC"
criar_logo_exemplo("Empresa ABC")
```

## Associação com Clientes

As logos são associadas aos clientes pelo nome. Certifique-se de que o nome do cliente no arquivo `clientes.json` corresponda ao nome usado no arquivo da logo.

Por exemplo, se no arquivo `clientes.json` o cliente está cadastrado como:

```json
{
    "id": "abc",
    "nome": "Empresa ABC",
    "cnpj": "12.345.678/0001-90",
    ...
}
```

Então a logo deve ser nomeada como `empresa_abc.png`. 