import os
from dotenv import load_dotenv
from openai import OpenAI

# Carregar variáveis de ambiente
load_dotenv()

# Desativar configurações de proxy que podem estar causando problemas
os.environ.pop('HTTP_PROXY', None)
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('http_proxy', None)
os.environ.pop('https_proxy', None)

# Configuração
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def list_assistants():
    """Lista todos os assistentes disponíveis para a chave API atual"""
    try:
        print("="*80)
        print("Listando assistentes disponíveis...")
        
        # Inicializar o cliente OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Listar assistentes
        assistants = client.beta.assistants.list(
            limit=100
        )
        
        print(f"Total de assistentes encontrados: {len(assistants.data)}")
        print("="*80)
        
        # Exibir detalhes de cada assistente
        for i, assistant in enumerate(assistants.data, 1):
            print(f"Assistente {i}:")
            print(f"  ID: {assistant.id}")
            print(f"  Nome: {assistant.name}")
            print(f"  Modelo: {assistant.model}")
            print(f"  Criado em: {assistant.created_at}")
            print("-"*80)
        
        return assistants.data
    except Exception as e:
        print(f"Erro ao listar assistentes: {e}")
        import traceback
        traceback.print_exc()
        return []

if __name__ == "__main__":
    list_assistants() 