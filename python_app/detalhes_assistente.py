#!/usr/bin/env python
import os
import sys
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

def obter_detalhes_assistente(assistant_id):
    """Obtém detalhes completos de um assistente específico"""
    # URL da API para obter detalhes do assistente
    url = f"https://api.openai.com/v1/assistants/{assistant_id}"
    
    # Cabeçalhos da requisição
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "OpenAI-Beta": "assistants=v2"
    }
    
    try:
        # Fazer a requisição GET
        response = requests.get(url, headers=headers)
        
        # Verificar se a requisição foi bem-sucedida
        response.raise_for_status()
        
        # Converter a resposta para JSON
        assistant = response.json()
        
        # Imprimir os detalhes do assistente
        print("\n" + "="*60)
        print(f"DETALHES DO ASSISTENTE: {assistant.get('name', 'Sem nome')}")
        print("="*60 + "\n")
        
        print(f"ID: {assistant.get('id')}")
        print(f"Modelo: {assistant.get('model')}")
        print(f"Descrição: {assistant.get('description', 'Sem descrição')}")
        print(f"Ferramentas: {formatar_ferramentas(assistant.get('tools', []))}")
        print(f"Criado em: {formatar_timestamp(assistant.get('created_at'))}")
        print(f"Modificado em: {formatar_timestamp(assistant.get('modified_at'))}")
        
        # Verificar se há instruções
        if "instructions" in assistant and assistant["instructions"]:
            print("\nInstruções:")
            print("-"*60)
            print(assistant["instructions"])
            print("-"*60)
        
        # Verificar se há arquivos associados
        if "file_ids" in assistant and assistant["file_ids"]:
            print("\nArquivos associados:")
            for file_id in assistant["file_ids"]:
                print(f"  - {file_id}")
        
        # Verificar se há metadados
        if "metadata" in assistant and assistant["metadata"]:
            print("\nMetadados:")
            for key, value in assistant["metadata"].items():
                print(f"  {key}: {value}")
        
        return True
    
    except requests.exceptions.HTTPError as e:
        print(f"Erro na requisição HTTP: {e}")
        print(f"Resposta do servidor: {response.text}")
        return False
    except Exception as e:
        print(f"Erro ao obter detalhes do assistente: {e}")
        return False

def main():
    # Verificar se o ID do assistente foi fornecido como argumento
    if len(sys.argv) < 2:
        print("Uso: python detalhes_assistente.py <ID_DO_ASSISTENTE>")
        print("Exemplo: python detalhes_assistente.py asst_abc123")
        return
    
    # Obter o ID do assistente do argumento da linha de comando
    assistant_id = sys.argv[1]
    
    # Obter detalhes do assistente
    obter_detalhes_assistente(assistant_id)

if __name__ == "__main__":
    main() 