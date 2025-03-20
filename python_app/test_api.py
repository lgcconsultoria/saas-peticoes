import requests
import json
import time
import os

# Desativar configurações de proxy que podem estar causando problemas
os.environ.pop('HTTP_PROXY', None)
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('http_proxy', None)
os.environ.pop('https_proxy', None)

# URL base da API (ajuste conforme necessário)
# Usar a mesma porta definida no arquivo .env ou o padrão 5000
PORT = os.getenv("PORT", 5000)
BASE_URL = f"http://localhost:{PORT}"
print(f"Testando API em: {BASE_URL}")

def testar_status_api():
    """Testa o endpoint de status da API"""
    print("Testando o status da API...")
    response = requests.get(f"{BASE_URL}/api/status")
    
    if response.status_code == 200:
        print("✅ API está online!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Erro ao verificar status da API: {response.status_code}")
        print(response.text)
    
    print("-" * 80)

def testar_geracao_peticao():
    """Testa a geração de petição usando o assistente da OpenAI"""
    print("Testando a geração de petição...")
    
    # Dados para a petição
    dados = {
        "tipo": "Recurso Administrativo",
        "motivo": "Desclassificação indevida em licitação",
        "fatos": "Nossa empresa participou da licitação nº 123/2023 e foi desclassificada por supostamente não atender ao item 3.2 do edital, que trata da qualificação técnica. Contudo, apresentamos todos os atestados necessários conforme exigido."
    }
    
    # Enviar requisição
    print("Enviando requisição para gerar petição...")
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/api/gerar-peticao", json=dados)
    elapsed_time = time.time() - start_time
    
    print(f"Tempo de resposta: {elapsed_time:.2f} segundos")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Petição gerada com sucesso!")
        print(f"Arquivo gerado: {result.get('filename')}")
        print(f"URL para download: {result.get('download_url')}")
        
        # Mostrar parte dos argumentos e pedidos
        argumentos = result.get('argumentos', '')
        pedido = result.get('pedido', '')
        
        print("\nTrecho dos argumentos:")
        print(argumentos[:200] + "..." if len(argumentos) > 200 else argumentos)
        
        print("\nTrecho do pedido:")
        print(pedido[:200] + "..." if len(pedido) > 200 else pedido)
    else:
        print(f"❌ Erro ao gerar petição: {response.status_code}")
        print(response.text)
    
    print("-" * 80)

def testar_listar_peticoes():
    """Testa a listagem de petições"""
    print("Testando a listagem de petições...")
    response = requests.get(f"{BASE_URL}/api/peticoes")
    
    if response.status_code == 200:
        result = response.json()
        peticoes = result.get('peticoes', [])
        print(f"✅ {len(peticoes)} petições encontradas!")
        
        for i, peticao in enumerate(peticoes[:5], 1):  # Mostrar até 5 petições
            print(f"{i}. {peticao.get('nome')}")
        
        if len(peticoes) > 5:
            print(f"... e mais {len(peticoes) - 5} petições")
    else:
        print(f"❌ Erro ao listar petições: {response.status_code}")
        print(response.text)
    
    print("-" * 80)

if __name__ == "__main__":
    print("=" * 80)
    print("TESTE DA API DE GERAÇÃO DE PETIÇÕES")
    print("=" * 80)
    
    # Testar status da API
    testar_status_api()
    
    # Testar geração de petição
    testar_geracao_peticao()
    
    # Testar listagem de petições
    testar_listar_peticoes()
    
    print("Testes concluídos!") 