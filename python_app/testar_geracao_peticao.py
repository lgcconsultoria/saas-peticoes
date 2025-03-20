#!/usr/bin/env python
import requests
import json
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# URL da API
API_URL = "http://localhost:5000/api"

def testar_geracao_peticao():
    """Testa a geração de uma petição"""
    print("="*80)
    print("Testando geração de petição")
    print("="*80)
    
    # Dados da petição
    dados = {
        "tipo": "Recurso Administrativo",
        "motivo": "Desclassificação indevida em licitação",
        "fatos": "A empresa ABC Ltda. participou da licitação nº 123/2024 para fornecimento de equipamentos de informática. Apesar de ter apresentado a proposta mais vantajosa e todos os documentos exigidos no edital, foi desclassificada sob alegação de não atendimento ao item 5.3 do edital, que trata da qualificação técnica. Ocorre que a empresa apresentou atestados de capacidade técnica que comprovam a execução de serviços similares, conforme exigido no edital."
    }
    
    # Enviar requisição para a API
    print(f"Enviando requisição para {API_URL}/gerar-peticao")
    print(f"Dados: {json.dumps(dados, indent=2)}")
    
    try:
        response = requests.post(
            f"{API_URL}/gerar-peticao",
            json=dados,
            headers={"Content-Type": "application/json"}
        )
        
        # Verificar se a requisição foi bem-sucedida
        response.raise_for_status()
        
        # Obter a resposta
        resultado = response.json()
        
        print("\nResposta da API:")
        print(f"Status: {response.status_code}")
        print(json.dumps(resultado, indent=2))
        
        # Verificar se a petição foi gerada com sucesso
        if resultado.get("success", False):
            print("\nPetição gerada com sucesso!")
            print(f"Arquivo: {resultado.get('filename')}")
            print(f"Download URL: {resultado.get('download_url')}")
            
            # Mostrar um trecho dos argumentos e pedidos
            print("\nTrecho dos argumentos:")
            argumentos = resultado.get("argumentos", "")
            print(argumentos[:200] + "..." if len(argumentos) > 200 else argumentos)
            
            print("\nTrecho dos pedidos:")
            pedido = resultado.get("pedido", "")
            print(pedido[:200] + "..." if len(pedido) > 200 else pedido)
        else:
            print("\nErro ao gerar petição:")
            print(resultado.get("message", "Erro desconhecido"))
        
        return resultado
    
    except requests.exceptions.RequestException as e:
        print(f"\nErro na requisição: {e}")
        if hasattr(e, "response") and e.response is not None:
            print(f"Resposta do servidor: {e.response.text}")
        return None

if __name__ == "__main__":
    testar_geracao_peticao() 