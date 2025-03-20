#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para testar as melhorias implementadas
"""

import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis de ambiente
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, '.env')
load_dotenv(env_path)

# Adicionar o diretório atual ao path para importar módulos locais
sys.path.append(BASE_DIR)

# Importar funções e classes necessárias
from utils.ai_generator import AIGenerator
from utils.docx_generator import DocxGenerator
from utils.validacao_juridica import ValidacaoJuridica

# Diretórios
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates_docx')
PETICOES_DIR = os.path.join(BASE_DIR, 'peticoes')
CLIENTES_DIR = os.path.join(BASE_DIR, 'clientes')
DATA_DIR = os.path.join(BASE_DIR, 'data')

# Verificar se as variáveis de ambiente foram carregadas
print(f"OPENAI_API_KEY: {'Configurada' if os.getenv('OPENAI_API_KEY') else 'Não configurada'}")
print(f"ASSISTANT_ID: {os.getenv('ASSISTANT_ID')}")

# Inicializar geradores
ai_generator = AIGenerator(api_key=os.getenv("OPENAI_API_KEY"), assistant_id=os.getenv("ASSISTANT_ID"))
docx_generator = DocxGenerator(TEMPLATES_DIR, PETICOES_DIR, CLIENTES_DIR)
validador_juridico = ValidacaoJuridica()

def testar_geracao_peticao():
    """Testa a geração de uma petição"""
    print("="*80)
    print("Testando geração de petição...")
    print("="*80)
    
    # Dados da petição
    tipo = "recurso administrativo"
    motivo = "Fomos inabilitados na licitação por não atendimento aos requisitos de qualificação técnica, porém os atestados apresentados atendem ao exigido no edital."
    fatos = """
    Nossa empresa participou do Pregão Eletrônico nº 123/2023 da Secretaria de Educação do Estado de MS.
    Apresentamos toda a documentação exigida no edital, incluindo atestados de capacidade técnica.
    Fomos inabilitados sob a alegação de que os atestados não comprovam a execução de serviços similares.
    Contudo, os atestados apresentados demonstram claramente a execução de serviços compatíveis com o objeto licitado.
    """
    
    # Gerar petição
    print("Gerando petição...")
    resultado = ai_generator.gerar_peticao(tipo, motivo, fatos, usar_assistente=True)
    
    # Exibir resultado
    print("\nFatos gerados:")
    print("-"*40)
    print(resultado.get("fatos", "Não foi possível gerar fatos"))
    
    print("\nArgumentos gerados:")
    print("-"*40)
    print(resultado.get("argumentos", "Não foi possível gerar argumentos"))
    
    print("\nPedidos gerados:")
    print("-"*40)
    print(resultado.get("pedido", "Não foi possível gerar pedidos"))
    
    # Preparar dados para geração do documento
    dados_peticao = {
        "tipo": tipo,
        "fatos_texto": resultado.get("fatos", ""),
        "argumentos_texto": resultado.get("argumentos", ""),
        "pedidos_texto": resultado.get("pedido", ""),
        "cliente_id": "rally",  # ID de um cliente existente
        "contraparte": "Secretaria de Educação do Estado de MS",
        "autoridade": "Sr. Pregoeiro",
        "referencia_processo": "Pregão Eletrônico nº 123/2023",
        "cidade": "Campo Grande"
    }
    
    # Gerar documento
    print("\nGerando documento DOCX...")
    filepath = docx_generator.gerar_documento(tipo, dados_peticao)
    print(f"Documento gerado: {filepath}")
    
    # Preparar dados para validação
    dados_validacao = {
        "tipo": tipo,
        "fatos": resultado.get("fatos", ""),
        "argumentos": resultado.get("argumentos", ""),
        "pedidos": resultado.get("pedido", "")
    }
    
    # Validar petição
    print("\nValidando petição...")
    relatorio = validador_juridico.gerar_relatorio_validacao(dados_validacao)
    
    print("\nRelatório de validação:")
    print("-"*40)
    print(f"Válido: {relatorio['valido']}")
    
    if not relatorio['valido']:
        print("\nErros encontrados:")
        for erro in relatorio['erros']:
            print(f"- {erro}")
    
    print("\nEstatísticas:")
    print(f"- Caracteres: {relatorio['estatisticas']['caracteres']['total']}")
    print(f"- Palavras: {relatorio['estatisticas']['palavras']['total']}")
    print(f"- Citações legais: {relatorio['estatisticas']['citacoes_legais']}")
    
    print("\nCitações encontradas:")
    for citacao in relatorio['citacoes_encontradas']:
        print(f"- {citacao}")
    
    print("="*80)
    print("Teste concluído!")
    print("="*80)
    
    return filepath

if __name__ == "__main__":
    filepath = testar_geracao_peticao()
    print(f"Documento gerado disponível em: {filepath}") 