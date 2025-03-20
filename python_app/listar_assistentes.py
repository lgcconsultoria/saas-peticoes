#!/usr/bin/env python
import os
import requests
import json
from dotenv import load_dotenv
from datetime import datetime

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Obter a chave da API do ambiente
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("Erro: OPENAI_API_KEY não encontrada no arquivo .env")
    exit(1)

# URL da API para listar assistentes
url = "https://api.openai.com/v1/assistants"

# Parâmetros da consulta
params = {
    "order": "desc",
    "limit": 20
}

# Cabeçalhos da requisição
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}",
    "OpenAI-Beta": "assistants=v2"
}

def formatar_timestamp(timestamp):
    """Converte um timestamp Unix para uma data legível"""
    if not timestamp:
        return "Desconhecido"
    return datetime.fromtimestamp(timestamp).strftime("%d/%m/%Y %H:%M:%S")

def formatar_ferramentas(tools):
    """Formata a lista de ferramentas do assistente"""
    if not tools:
        return "Nenhuma"
    
    nomes_ferramentas = []
    for tool in tools:
        if isinstance(tool, dict) and "type" in tool:
            nomes_ferramentas.append(tool["type"])
    
    return ", ".join(nomes_ferramentas) if nomes_ferramentas else "Nenhuma"

try:
    # Fazer a requisição GET
    response = requests.get(url, params=params, headers=headers)
    
    # Verificar se a requisição foi bem-sucedida
    response.raise_for_status()
    
    # Converter a resposta para JSON
    data = response.json()
    
    # Imprimir os assistentes de forma formatada
    print("\n" + "="*50)
    print("           LISTA DE ASSISTENTES OPENAI           ")
    print("="*50 + "\n")
    
    if "data" in data and len(data["data"]) > 0:
        print(f"Total de assistentes encontrados: {len(data['data'])}\n")
        
        for i, assistant in enumerate(data["data"], 1):
            print(f"Assistente {i}: {assistant.get('name', 'Sem nome')}")
            print(f"  ID: {assistant.get('id')}")
            print(f"  Modelo: {assistant.get('model')}")
            print(f"  Descrição: {assistant.get('description', 'Sem descrição')}")
            print(f"  Ferramentas: {formatar_ferramentas(assistant.get('tools', []))}")
            print(f"  Criado em: {formatar_timestamp(assistant.get('created_at'))}")
            print(f"  Modificado em: {formatar_timestamp(assistant.get('modified_at'))}")
            
            # Verificar se há instruções
            if "instructions" in assistant and assistant["instructions"]:
                print(f"  Instruções: {assistant['instructions'][:100]}..." if len(assistant["instructions"]) > 100 else f"  Instruções: {assistant['instructions']}")
            
            print("-"*50)
    else:
        print("Nenhum assistente encontrado.")
    
except requests.exceptions.HTTPError as e:
    print(f"Erro na requisição HTTP: {e}")
    print(f"Resposta do servidor: {response.text}")
except Exception as e:
    print(f"Erro ao listar assistentes: {e}") 