#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para testar a geração de petição com template e remoção de referências
"""

import os
import sys
import json
import requests
from datetime import datetime

# Adicionar o diretório atual ao path para importar módulos locais
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importar funções necessárias
from app import limpar_texto, gerar_peticao_com_assistente, gerar_docx
from testar_template_logo import criar_logo_exemplo

def testar_geracao_final():
    """Testa a geração de petição com template e remoção de referências"""
    print("="*80)
    print("Testando geração final de petição")
    print("="*80)
    
    # Dados de exemplo
    tipo = "Recurso Administrativo"
    cliente_id = "topxtopo"
    
    # Texto com referências
    texto_com_referencias = """
    FATOS:
    A empresa foi inabilitada no processo licitatório【4:6†source】 devido à interpretação restritiva do edital.
    
    ARGUMENTOS:
    A Lei nº 14.133/2021 permite a apresentação de atestados similares【4:13†source】 e a jurisprudência do TCU
    corrobora esse entendimento【4:6†source】【4:18†source】.
    
    PEDIDO:
    Requer a reconsideração da decisão【4:7†source】 e a habilitação da empresa no certame.
    """
    
    # Limpar o texto
    texto_limpo = limpar_texto(texto_com_referencias)
    print("\nTexto original:")
    print(texto_com_referencias)
    print("\nTexto limpo:")
    print(texto_limpo)
    
    # Criar logo de exemplo para o cliente
    criar_logo_exemplo("TOP X")
    
    # Testar a geração do documento
    print("\nTestando geração do documento...")
    
    # Extrair partes do texto
    fatos = "A empresa foi inabilitada no processo licitatório devido à interpretação restritiva do edital."
    argumentos = "A Lei nº 14.133/2021 permite a apresentação de atestados similares e a jurisprudência do TCU corrobora esse entendimento."
    pedidos = "Requer a reconsideração da decisão e a habilitação da empresa no certame."
    
    # Gerar documento
    filepath = gerar_docx(
        tipo=tipo,
        texto="",
        cliente_id=cliente_id,
        contraparte="Órgão Licitante",
        autoridade="Pregoeiro",
        referencia_processo="Processo nº 123/2023",
        cidade="Campo Grande",
        fatos_texto=fatos,
        argumentos_texto=argumentos,
        pedidos_texto=pedidos
    )
    
    print(f"Documento gerado: {filepath}")
    
    # Testar com a API
    print("\nTestando com a API...")
    try:
        # Preparar dados para a requisição
        api_data = {
            "tipo": "Recurso Administrativo",
            "motivo": "Teste final",
            "fatos": "A empresa foi inabilitada no processo licitatório【4:6†source】 devido à interpretação restritiva do edital.",
            "cliente_id": "topxtopo",
            "contraparte": "Órgão Licitante",
            "autoridade": "Pregoeiro",
            "referencia_processo": "Processo nº 123/2023",
            "cidade": "Campo Grande"
        }
        
        # Verificar se a API está rodando localmente
        try:
            response = requests.post(
                "http://localhost:5000/api/gerar-peticao",
                json=api_data,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"API respondeu com sucesso!")
                print(f"Arquivo gerado: {result.get('filename')}")
                print(f"Download URL: {result.get('download_url')}")
                
                # Verificar se há referências nos textos retornados
                fatos = result.get('fatos', '')
                argumentos = result.get('argumentos', '')
                pedido = result.get('pedido', '')
                
                referencias_encontradas = False
                for texto, nome in [(fatos, 'fatos'), (argumentos, 'argumentos'), (pedido, 'pedido')]:
                    if '【' in texto or '†source' in texto:
                        referencias_encontradas = True
                        print(f"ERRO: Referências encontradas no texto de {nome}!")
                    else:
                        print(f"OK: Nenhuma referência encontrada no texto de {nome}")
                
                if not referencias_encontradas:
                    print("SUCESSO: Nenhuma referência encontrada nos textos retornados pela API!")
            else:
                print(f"API respondeu com erro: {response.status_code}")
                print(response.text)
        except requests.exceptions.ConnectionError:
            print("API não está rodando localmente. Pulando teste via API.")
    except Exception as e:
        print(f"Erro ao testar via API: {e}")
    
    print("="*80)

if __name__ == "__main__":
    testar_geracao_final() 