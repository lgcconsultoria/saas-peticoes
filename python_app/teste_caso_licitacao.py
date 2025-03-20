import requests
import json
import os
from dotenv import load_dotenv
import time

# Carregar variáveis de ambiente
load_dotenv()

# Desativar configurações de proxy que podem estar causando problemas
os.environ.pop('HTTP_PROXY', None)
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('http_proxy', None)
os.environ.pop('https_proxy', None)

# URL base da API
PORT = os.getenv("PORT", 5000)
BASE_URL = f"http://localhost:{PORT}"

def testar_caso_licitacao():
    """Testa a geração de petição para um caso específico de licitação"""
    print("="*80)
    print("TESTE DE CASO ESPECÍFICO DE LICITAÇÃO")
    print("="*80)
    
    # Dados para a petição
    dados = {
        "tipo": "Recurso Administrativo",
        "motivo": "Desclassificação indevida por suposta inexequibilidade de preços",
        "fatos": """
        Nossa empresa, Construções Inovadoras Ltda., participou do Pregão Eletrônico nº 045/2025, 
        promovido pela Secretaria de Infraestrutura do Estado, cujo objeto é a contratação de empresa 
        especializada para prestação de serviços de manutenção predial preventiva e corretiva.
        
        Após a fase de lances, nossa empresa foi classificada em primeiro lugar com o valor global de 
        R$ 1.250.000,00, representando um desconto de 35% em relação ao valor estimado pela Administração, 
        que era de R$ 1.923.076,92.
        
        Contudo, fomos surpreendidos com nossa desclassificação, sob a alegação de que nossa proposta seria 
        inexequível, com base no art. 48, II, da Lei 8.666/93, sem que nos fosse oportunizada a chance de 
        comprovar a exequibilidade de nossa proposta.
        
        Importante ressaltar que possuímos contratos similares em execução com outros órgãos públicos, 
        com valores proporcionalmente semelhantes, e que nossa empresa possui estrutura operacional otimizada, 
        o que nos permite praticar preços mais competitivos sem comprometer a qualidade dos serviços.
        
        Além disso, o edital não estabeleceu critérios objetivos para aferição da exequibilidade das propostas, 
        limitando-se a reproduzir o texto legal, o que torna a decisão de desclassificação arbitrária e subjetiva.
        """
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
        
        # Mostrar argumentos e pedidos completos
        argumentos = result.get('argumentos', '')
        pedido = result.get('pedido', '')
        
        print("\nARGUMENTOS JURÍDICOS:")
        print("-"*80)
        print(argumentos)
        print("-"*80)
        
        print("\nPEDIDO:")
        print("-"*80)
        print(pedido)
        print("-"*80)
    else:
        print(f"❌ Erro ao gerar petição: {response.status_code}")
        print(response.text)
    
    print("="*80)
    print("Teste concluído!")
    print("="*80)

if __name__ == "__main__":
    testar_caso_licitacao() 