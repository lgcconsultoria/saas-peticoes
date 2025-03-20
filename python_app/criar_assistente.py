#!/usr/bin/env python
import os
import sys
import requests
import json
import argparse
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

def criar_assistente(nome, modelo, descricao=None, instrucoes=None, ferramentas=None):
    """Cria um novo assistente com os parâmetros especificados"""
    # URL da API para criar assistentes
    url = "https://api.openai.com/v1/assistants"
    
    # Cabeçalhos da requisição
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "OpenAI-Beta": "assistants=v2"
    }
    
    # Preparar as ferramentas
    tools_list = []
    if ferramentas:
        for ferramenta in ferramentas.split(','):
            ferramenta = ferramenta.strip()
            if ferramenta in ["code_interpreter", "retrieval", "file_search", "function"]:
                tools_list.append({"type": ferramenta})
    
    # Preparar o corpo da requisição
    payload = {
        "name": nome,
        "model": modelo
    }
    
    if descricao:
        payload["description"] = descricao
    
    if instrucoes:
        payload["instructions"] = instrucoes
    
    if tools_list:
        payload["tools"] = tools_list
    
    try:
        # Fazer a requisição POST
        response = requests.post(url, headers=headers, json=payload)
        
        # Verificar se a requisição foi bem-sucedida
        response.raise_for_status()
        
        # Converter a resposta para JSON
        assistant = response.json()
        
        # Imprimir os detalhes do assistente criado
        print("\n" + "="*60)
        print(f"ASSISTENTE CRIADO COM SUCESSO: {assistant.get('name')}")
        print("="*60 + "\n")
        
        print(f"ID: {assistant.get('id')}")
        print(f"Modelo: {assistant.get('model')}")
        print(f"Descrição: {assistant.get('description', 'Sem descrição')}")
        
        # Formatar ferramentas
        tools = assistant.get('tools', [])
        tools_str = ", ".join([tool["type"] for tool in tools]) if tools else "Nenhuma"
        print(f"Ferramentas: {tools_str}")
        
        print(f"Criado em: {formatar_timestamp(assistant.get('created_at'))}")
        
        # Verificar se há instruções
        if "instructions" in assistant and assistant["instructions"]:
            print("\nInstruções:")
            print("-"*60)
            print(assistant["instructions"])
            print("-"*60)
        
        # Salvar o ID do assistente no arquivo .env
        with open(".env", "a") as env_file:
            env_file.write(f"\nASSISTANT_ID_{nome.upper().replace(' ', '_')}={assistant.get('id')}\n")
            print(f"\nO ID do assistente foi salvo no arquivo .env como ASSISTANT_ID_{nome.upper().replace(' ', '_')}")
        
        return True
    
    except requests.exceptions.HTTPError as e:
        print(f"Erro na requisição HTTP: {e}")
        print(f"Resposta do servidor: {response.text}")
        return False
    except Exception as e:
        print(f"Erro ao criar assistente: {e}")
        return False

def main():
    # Configurar o parser de argumentos
    parser = argparse.ArgumentParser(description="Cria um novo assistente na API da OpenAI")
    parser.add_argument("--nome", required=True, help="Nome do assistente")
    parser.add_argument("--modelo", default="gpt-4o", help="Modelo a ser usado (padrão: gpt-4o)")
    parser.add_argument("--descricao", help="Descrição do assistente")
    parser.add_argument("--instrucoes", help="Instruções para o assistente")
    parser.add_argument("--ferramentas", help="Lista de ferramentas separadas por vírgula (code_interpreter, retrieval, file_search, function)")
    
    # Analisar os argumentos
    args = parser.parse_args()
    
    # Criar o assistente
    criar_assistente(
        nome=args.nome,
        modelo=args.modelo,
        descricao=args.descricao,
        instrucoes=args.instrucoes,
        ferramentas=args.ferramentas
    )

if __name__ == "__main__":
    main() 