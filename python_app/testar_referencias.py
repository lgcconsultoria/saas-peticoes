#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para testar a remoção de referências do tipo 【4:6†source】
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

def testar_remocao_referencias():
    """Testa a remoção de referências do tipo 【4:6†source】"""
    print("="*80)
    print("Testando remoção de referências")
    print("="*80)
    
    # Textos de exemplo com referências
    textos = [
        "Este é um texto com referência 【4:6†source】 no meio.",
        "Múltiplas referências 【4:6†source】【5:7†source】【1:2†source】 no texto.",
        "Referência no final do texto 【4:6†source】",
        "【4:6†source】 Referência no início do texto",
        "Texto sem referências",
        "Texto com <tags>HTML</tags> e referências 【4:6†source】",
        None,
        ""
    ]
    
    # Testar a função limpar_texto
    for i, texto in enumerate(textos):
        print(f"\nTexto {i+1}:")
        print(f"Original: {texto}")
        limpo = limpar_texto(texto)
        print(f"Limpo: {limpo}")
    
    # Testar com a API
    print("\nTestando com a API...")
    try:
        # Preparar dados para a requisição
        api_data = {
            "tipo": "Recurso Administrativo",
            "motivo": "Teste de remoção de referências",
            "fatos": "Este é um teste para verificar se as referências do tipo 【4:6†source】 são removidas corretamente.",
            "cliente_id": "topxtopo",
            "contraparte": "Empresa de Teste",
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
    testar_remocao_referencias() 