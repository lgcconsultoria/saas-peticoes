#!/usr/bin/env python
import os
import sys
import requests
import json
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Obter a chave da API do ambiente
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("Erro: OPENAI_API_KEY não encontrada no arquivo .env")
    exit(1)

def excluir_assistente(assistant_id):
    """Exclui um assistente usando seu ID"""
    # URL da API para excluir o assistente
    url = f"https://api.openai.com/v1/assistants/{assistant_id}"
    
    # Cabeçalhos da requisição
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "OpenAI-Beta": "assistants=v2"
    }
    
    try:
        # Fazer a requisição DELETE
        response = requests.delete(url, headers=headers)
        
        # Verificar se a requisição foi bem-sucedida
        response.raise_for_status()
        
        # Converter a resposta para JSON
        data = response.json()
        
        # Verificar se o assistente foi excluído
        if data.get("deleted", False):
            print(f"\nAssistente com ID '{assistant_id}' foi excluído com sucesso!")
            
            # Atualizar o arquivo .env removendo a linha com o ID do assistente
            try:
                with open(".env", "r") as env_file:
                    lines = env_file.readlines()
                
                with open(".env", "w") as env_file:
                    for line in lines:
                        if assistant_id not in line:
                            env_file.write(line)
                
                print("Arquivo .env atualizado.")
            except Exception as e:
                print(f"Aviso: Não foi possível atualizar o arquivo .env: {e}")
            
            return True
        else:
            print(f"Erro: Não foi possível excluir o assistente com ID '{assistant_id}'")
            return False
    
    except requests.exceptions.HTTPError as e:
        print(f"Erro na requisição HTTP: {e}")
        print(f"Resposta do servidor: {response.text}")
        return False
    except Exception as e:
        print(f"Erro ao excluir assistente: {e}")
        return False

def main():
    # Verificar se o ID do assistente foi fornecido como argumento
    if len(sys.argv) < 2:
        print("Uso: python excluir_assistente.py <ID_DO_ASSISTENTE>")
        print("Exemplo: python excluir_assistente.py asst_abc123")
        return
    
    # Obter o ID do assistente do argumento da linha de comando
    assistant_id = sys.argv[1]
    
    # Confirmar a exclusão
    confirmacao = input(f"Tem certeza que deseja excluir o assistente com ID '{assistant_id}'? (s/n): ")
    if confirmacao.lower() != 's':
        print("Operação cancelada.")
        return
    
    # Excluir o assistente
    excluir_assistente(assistant_id)

if __name__ == "__main__":
    main() 