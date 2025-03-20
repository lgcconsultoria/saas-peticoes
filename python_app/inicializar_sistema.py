#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para inicializar o sistema, criando diretórios e arquivos necessários
"""

import os
import json
import shutil
from datetime import datetime

# Diretórios base
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates_docx')
PETICOES_DIR = os.path.join(BASE_DIR, 'peticoes')
CLIENTES_DIR = os.path.join(BASE_DIR, 'clientes')
DATA_DIR = os.path.join(BASE_DIR, 'data')
LOGS_DIR = os.path.join(BASE_DIR, 'logs')
UTILS_DIR = os.path.join(BASE_DIR, 'utils')

# Subdiretórios
LOGOS_DIR = os.path.join(CLIENTES_DIR, 'logos')
BACKUPS_DIR = os.path.join(DATA_DIR, 'backups')

def criar_diretorios():
    """Cria os diretórios necessários para o sistema"""
    diretorios = [
        TEMPLATES_DIR,
        PETICOES_DIR,
        CLIENTES_DIR,
        DATA_DIR,
        LOGS_DIR,
        UTILS_DIR,
        LOGOS_DIR,
        BACKUPS_DIR
    ]
    
    for diretorio in diretorios:
        os.makedirs(diretorio, exist_ok=True)
        print(f"Diretório criado: {diretorio}")

def criar_arquivo_clientes():
    """Cria o arquivo de clientes com dados de exemplo"""
    clientes_json_path = os.path.join(CLIENTES_DIR, 'clientes.json')
    
    # Verificar se o arquivo já existe
    if os.path.exists(clientes_json_path):
        # Fazer backup do arquivo existente
        backup_path = os.path.join(BACKUPS_DIR, f"clientes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        shutil.copy2(clientes_json_path, backup_path)
        print(f"Backup do arquivo de clientes criado: {backup_path}")
        return
    
    # Dados de exemplo
    clientes = [
        {
            "id": "rally",
            "nome": "AUTO LOCADORA RALLY",
            "cnpj": "08.714.430/0001-87",
            "endereco": "Rua Exemplo, 123, Centro, São Paulo/SP",
            "email": "contato@rally.com.br",
            "telefone": "(67) 3333-4444",
            "advogados": [
                {
                    "nome": "DOUGLAS SENTURIÃO",
                    "oab": "OAB/SC 73764",
                    "email": "douglas@exemplo.com.br",
                    "telefone": "(48) 99999-8888"
                }
            ]
        },
        {
            "id": "exemplo",
            "nome": "EMPRESA EXEMPLO LTDA",
            "cnpj": "12.345.678/0001-90",
            "endereco": "Avenida Principal, 456, Jardim América, São Paulo/SP",
            "email": "contato@exemplo.com.br",
            "telefone": "(11) 5555-6666",
            "advogados": [
                {
                    "nome": "MARIA SILVA",
                    "oab": "OAB/SP 98765",
                    "email": "maria@exemplo.com.br",
                    "telefone": "(11) 99999-7777"
                }
            ]
        }
    ]
    
    # Salvar arquivo
    with open(clientes_json_path, 'w', encoding='utf-8') as f:
        json.dump(clientes, f, indent=4, ensure_ascii=False)
    
    print(f"Arquivo de clientes criado: {clientes_json_path}")

def criar_arquivo_tipos_peticao():
    """Cria o arquivo de tipos de petição"""
    tipos_json_path = os.path.join(DATA_DIR, 'tipos_peticao.json')
    
    # Verificar se o arquivo já existe
    if os.path.exists(tipos_json_path):
        # Fazer backup do arquivo existente
        backup_path = os.path.join(BACKUPS_DIR, f"tipos_peticao_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        shutil.copy2(tipos_json_path, backup_path)
        print(f"Backup do arquivo de tipos de petição criado: {backup_path}")
        return
    
    # Dados de exemplo
    tipos_peticao = [
        {
            "id": "recurso_administrativo",
            "nome": "Recurso Administrativo",
            "descricao": "Recurso contra decisão administrativa",
            "base_legal": "Art. 56 da Lei nº 9.784/99",
            "prazo": "10 dias"
        },
        {
            "id": "impugnacao_edital",
            "nome": "Impugnação ao Edital",
            "descricao": "Impugnação a edital de licitação",
            "base_legal": "Art. 41 da Lei nº 8.666/93",
            "prazo": "Até 2 dias úteis antes da abertura"
        },
        {
            "id": "mandado_seguranca",
            "nome": "Mandado de Segurança",
            "descricao": "Mandado de segurança contra ato ilegal",
            "base_legal": "Lei nº 12.016/2009",
            "prazo": "120 dias"
        },
        {
            "id": "contrarrazoes_recurso",
            "nome": "Contrarrazões de Recurso",
            "descricao": "Contrarrazões a recurso administrativo",
            "base_legal": "Art. 109 da Lei nº 8.666/93",
            "prazo": "5 dias úteis"
        }
    ]
    
    # Salvar arquivo
    with open(tipos_json_path, 'w', encoding='utf-8') as f:
        json.dump(tipos_peticao, f, indent=4, ensure_ascii=False)
    
    print(f"Arquivo de tipos de petição criado: {tipos_json_path}")

def criar_arquivo_regras_validacao():
    """Cria o arquivo de regras de validação"""
    regras_json_path = os.path.join(DATA_DIR, 'regras_validacao.json')
    
    # Verificar se o arquivo já existe
    if os.path.exists(regras_json_path):
        # Fazer backup do arquivo existente
        backup_path = os.path.join(BACKUPS_DIR, f"regras_validacao_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        shutil.copy2(regras_json_path, backup_path)
        print(f"Backup do arquivo de regras de validação criado: {backup_path}")
        return
    
    # Dados de exemplo
    regras_validacao = {
        "termos_proibidos": [
            "palavrão",
            "ofensivo",
            "inadequado"
        ],
        "termos_obrigatorios": {
            "recurso_administrativo": [
                "prazo",
                "recurso",
                "reconsideração"
            ],
            "impugnacao_edital": [
                "edital",
                "impugnação",
                "ilegalidade"
            ],
            "mandado_seguranca": [
                "direito líquido e certo",
                "autoridade coatora",
                "ato ilegal"
            ],
            "contrarrazoes_recurso": [
                "recurso",
                "contrarrazões",
                "manutenção da decisão"
            ]
        },
        "padroes_citacao": [
            r"(?i)art(?:igo)?\.?\s*\d+",
            r"(?i)lei\s*(?:n[°º]?)?\s*\d+[\.\d]*/\d{4}",
            r"(?i)súmula\s*\d+"
        ],
        "comprimento_minimo": {
            "fatos": 200,
            "argumentos": 500,
            "pedidos": 100
        }
    }
    
    # Salvar arquivo
    with open(regras_json_path, 'w', encoding='utf-8') as f:
        json.dump(regras_validacao, f, indent=4, ensure_ascii=False)
    
    print(f"Arquivo de regras de validação criado: {regras_json_path}")

def criar_arquivo_env():
    """Cria o arquivo .env com configurações padrão"""
    env_path = os.path.join(BASE_DIR, '.env')
    
    # Verificar se o arquivo já existe
    if os.path.exists(env_path):
        print(f"Arquivo .env já existe: {env_path}")
        return
    
    # Conteúdo do arquivo
    conteudo = """# Configurações do sistema
PORT=5000
DEBUG=True

# Configurações da OpenAI
OPENAI_API_KEY=sua_chave_api_aqui
ASSISTANT_ID=seu_assistant_id_aqui

# Configurações do banco de dados
DATABASE_URL=sqlite:///peticoes.db
"""
    
    # Salvar arquivo
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write(conteudo)
    
    print(f"Arquivo .env criado: {env_path}")

def criar_arquivo_readme():
    """Cria o arquivo README.md com instruções"""
    readme_path = os.path.join(BASE_DIR, 'README.md')
    
    # Verificar se o arquivo já existe
    if os.path.exists(readme_path):
        print(f"Arquivo README.md já existe: {readme_path}")
        return
    
    # Conteúdo do arquivo
    conteudo = """# Sistema de Geração de Petições

## Descrição
Sistema para geração automatizada de petições jurídicas utilizando IA.

## Requisitos
- Python 3.8+
- OpenAI API Key
- Dependências listadas em requirements.txt

## Instalação
1. Clone o repositório
2. Instale as dependências: `pip install -r requirements.txt`
3. Configure o arquivo .env com suas credenciais
4. Execute o script de inicialização: `python inicializar_sistema.py`
5. Inicie o servidor: `python app.py`

## Estrutura de Diretórios
- `templates_docx/`: Templates de documentos DOCX
- `peticoes/`: Petições geradas
- `clientes/`: Dados dos clientes
- `data/`: Dados do sistema
- `logs/`: Logs do sistema
- `utils/`: Módulos utilitários

## Endpoints da API
- `POST /api/gerar-peticao`: Gera uma nova petição
- `GET /api/peticoes`: Lista petições geradas
- `GET /api/clientes`: Lista clientes cadastrados
- `GET /api/tipos-peticao`: Lista tipos de petição disponíveis
- `POST /api/validar-peticao`: Valida uma petição

## Configuração
Edite o arquivo .env para configurar:
- Porta do servidor
- Chave da API da OpenAI
- ID do Assistente da OpenAI
- URL do banco de dados
"""
    
    # Salvar arquivo
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(conteudo)
    
    print(f"Arquivo README.md criado: {readme_path}")

def criar_arquivo_requirements():
    """Cria o arquivo requirements.txt com dependências"""
    requirements_path = os.path.join(BASE_DIR, 'requirements.txt')
    
    # Verificar se o arquivo já existe
    if os.path.exists(requirements_path):
        print(f"Arquivo requirements.txt já existe: {requirements_path}")
        return
    
    # Conteúdo do arquivo
    conteudo = """flask==2.0.1
python-dotenv==0.19.1
openai==1.3.0
python-docx==0.8.11
requests==2.26.0
Werkzeug==2.0.1
gunicorn==20.1.0
"""
    
    # Salvar arquivo
    with open(requirements_path, 'w', encoding='utf-8') as f:
        f.write(conteudo)
    
    print(f"Arquivo requirements.txt criado: {requirements_path}")

def main():
    """Função principal"""
    print("="*80)
    print("Inicializando sistema de geração de petições...")
    print("="*80)
    
    # Criar diretórios
    criar_diretorios()
    
    # Criar arquivos
    criar_arquivo_clientes()
    criar_arquivo_tipos_peticao()
    criar_arquivo_regras_validacao()
    criar_arquivo_env()
    criar_arquivo_readme()
    criar_arquivo_requirements()
    
    print("="*80)
    print("Sistema inicializado com sucesso!")
    print("="*80)
    print("Para iniciar o servidor, execute: python app.py")
    print("="*80)

if __name__ == "__main__":
    main() 