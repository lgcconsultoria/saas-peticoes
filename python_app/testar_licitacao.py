#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para simular dados de uma licitação e testar a geração de petição
"""

import os
import sys
import json
import requests
from datetime import datetime

# Adicionar o diretório atual ao path para importar módulos locais
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importar funções necessárias
from app import gerar_peticao_com_assistente, gerar_docx
from testar_template_logo import criar_logo_exemplo

def simular_licitacao():
    """Simula dados de uma licitação e testa a geração de petição"""
    print("="*80)
    print("Simulando dados de licitação e testando geração de petição")
    print("="*80)
    
    # Dados da licitação
    licitacao = {
        "numero": "Pregão Eletrônico nº 123/2025",
        "orgao": "Secretaria de Educação do Estado de MS",
        "objeto": "Contratação de empresa especializada para fornecimento de equipamentos de informática",
        "data_abertura": "01/03/2025",
        "data_resultado": "05/03/2025",
        "valor_estimado": "R$ 1.500.000,00"
    }
    
    # Dados da empresa
    empresa = {
        "id": "rally",  # ID de um cliente existente no clientes.json
        "nome": "AUTO LOCADORA RALLY",
        "cnpj": "08.714.430/0001-87",
        "representante": "João Silva",
        "email": "contato@rally.com.br",
        "telefone": "(67) 3333-4444"
    }
    
    # Motivo da petição
    motivo = f"Fomos inabilitados no {licitacao['numero']} por não atendimento aos requisitos de qualificação técnica, porém os atestados apresentados atendem ao exigido no edital."
    
    # Fatos detalhados
    fatos = f"""
    Nossa empresa, {empresa['nome']}, participou do {licitacao['numero']} promovido pela {licitacao['orgao']}, 
    cujo objeto é a {licitacao['objeto']}.
    
    Na sessão de abertura realizada em {licitacao['data_abertura']}, apresentamos nossa proposta e documentação 
    de habilitação conforme exigido no edital. No entanto, na sessão de julgamento realizada em {licitacao['data_resultado']}, 
    fomos surpreendidos com nossa inabilitação sob a alegação de que os atestados de capacidade técnica apresentados 
    não comprovavam a execução de serviços compatíveis com o objeto licitado.
    
    O edital exigia a comprovação de fornecimento anterior de equipamentos de informática para órgãos públicos, 
    e apresentamos atestados de fornecimento de equipamentos similares para empresas privadas de grande porte, 
    com complexidade técnica equivalente ou superior ao objeto licitado.
    
    A decisão da Comissão de Licitação foi baseada em interpretação restritiva das exigências do edital, 
    contrariando o princípio da competitividade e da razoabilidade que devem nortear os procedimentos licitatórios.
    """
    
    print("\nDados da Licitação:")
    for key, value in licitacao.items():
        print(f"  {key}: {value}")
    
    print("\nDados da Empresa:")
    for key, value in empresa.items():
        print(f"  {key}: {value}")
    
    print("\nMotivo da Petição:")
    print(f"  {motivo}")
    
    print("\nFatos (resumo):")
    print(f"  {' '.join(fatos.split())[:150]}...")
    
    # Criar logo de exemplo para a empresa
    criar_logo_exemplo(empresa['nome'])
    
    # Método 1: Testar diretamente as funções internas
    print("\nMétodo 1: Testando funções internas...")
    try:
        # Gerar petição com o assistente
        resultado = gerar_peticao_com_assistente("Recurso Administrativo", motivo, fatos)
        
        # Extrair as partes da petição
        fatos_texto = resultado.get("fatos", fatos)
        argumentos_texto = resultado.get("argumentos", "Nenhum argumento gerado.")
        pedido_texto = resultado.get("pedido", "Nenhum pedido gerado.")
        
        # Montar o texto para o documento
        texto_documento = f"""
        <h1>Petição: Recurso Administrativo</h1>
        <h2>Motivo: {motivo}</h2>
        <h3>I - DOS FATOS</h3>
        <p>{fatos_texto}</p>
        <h3>II - DOS FUNDAMENTOS</h3>
        <p>{argumentos_texto}</p>
        <h3>III - DOS PEDIDOS</h3>
        <p>Ante o exposto, requer:</p>
        <p>{pedido_texto}</p>
        """
        
        # Gerar documento DOCX
        filepath = gerar_docx(
            tipo="Recurso Administrativo",
            texto=texto_documento,
            cliente_id=empresa['id'],
            contraparte=licitacao['orgao'],
            autoridade="Pregoeiro",
            referencia_processo=licitacao['numero'],
            cidade="Campo Grande"
        )
        
        print(f"Documento gerado: {filepath}")
    except Exception as e:
        print(f"Erro ao testar funções internas: {e}")
    
    # Método 2: Testar via API
    print("\nMétodo 2: Testando via API...")
    try:
        # Preparar dados para a requisição
        api_data = {
            "tipo": "Recurso Administrativo",
            "motivo": motivo,
            "fatos": fatos,
            "cliente_id": empresa['id'],
            "contraparte": licitacao['orgao'],
            "autoridade": "Pregoeiro",
            "referencia_processo": licitacao['numero'],
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
            else:
                print(f"API respondeu com erro: {response.status_code}")
                print(response.text)
        except requests.exceptions.ConnectionError:
            print("API não está rodando localmente. Pulando teste via API.")
    except Exception as e:
        print(f"Erro ao testar via API: {e}")
    
    print("="*80)

if __name__ == "__main__":
    simular_licitacao() 