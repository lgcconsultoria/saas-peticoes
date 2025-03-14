from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import json
import uuid
from datetime import datetime
import requests
from docx import Document
import re
from dotenv import load_dotenv
import time
import logging
from openai import OpenAI

# Desativar configurações de proxy que podem estar causando problemas
os.environ.pop('HTTP_PROXY', None)
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('http_proxy', None)
os.environ.pop('https_proxy', None)

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)

# Configurar CORS para permitir requisições de qualquer origem
CORS(app)

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuração adicional para CORS
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Configuração
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ASSISTANT_ID = os.getenv("ASSISTANT_ID")

# Log de inicialização com informações do assistente
print("="*80)
print(f"Inicializando aplicação com API OpenAI")
print(f"ID do Assistente: {ASSISTANT_ID}")

# Diretórios
PETICOES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'peticoes')
TEMPLATES_DOCX_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates_docx')
CLIENTES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clientes')
os.makedirs(PETICOES_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DOCX_DIR, exist_ok=True)
os.makedirs(CLIENTES_DIR, exist_ok=True)

# Rotas da API
@app.route('/')
def index():
    return jsonify({"status": "online", "message": "API de Geração de Petições"})

@app.route('/api/clientes', methods=['GET'])
def listar_clientes():
    print("="*80)
    print("Recebida solicitação para listar clientes")
    
    clientes = []
    try:
        # Verificar se o diretório de clientes existe
        if os.path.exists(CLIENTES_DIR):
            # Listar arquivos JSON no diretório de clientes
            arquivos_clientes = [f for f in os.listdir(CLIENTES_DIR) if f.endswith('.json')]
            print(f"Clientes carregados: {len(arquivos_clientes)}")
            
            # Carregar dados de cada cliente
            for arquivo in arquivos_clientes:
                try:
                    with open(os.path.join(CLIENTES_DIR, arquivo), 'r', encoding='utf-8') as f:
                        cliente = json.load(f)
                        clientes.append(cliente)
                        print(f"Cliente adicionado: {cliente.get('nome', 'Nome não encontrado')}")
                except Exception as e:
                    print(f"Erro ao carregar cliente {arquivo}: {str(e)}")
        
        print(f"Total de clientes retornados: {len(clientes)}")
        return jsonify(clientes)
    except Exception as e:
        print(f"Erro ao listar clientes: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/templates', methods=['GET'])
def listar_templates():
    try:
        templates = [f for f in os.listdir(TEMPLATES_DOCX_DIR) 
                    if f.endswith('.docx') and not f.startswith('~$')]
        return jsonify(templates)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@app.route('/api/gerar_peticao', methods=['POST'])
def gerar_peticao():
    try:
        # Obter dados do corpo da requisição
        dados = request.json
        if not dados:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        # Extrair informações necessárias
        cliente_id = dados.get('cliente_id')
        template_id = dados.get('template_id')
        dados_peticao = dados.get('dados_peticao', {})
        
        if not cliente_id or not template_id:
            return jsonify({"error": "cliente_id e template_id são obrigatórios"}), 400
        
        # Carregar dados do cliente
        cliente_path = os.path.join(CLIENTES_DIR, f"{cliente_id}.json")
        if not os.path.exists(cliente_path):
            return jsonify({"error": f"Cliente com ID {cliente_id} não encontrado"}), 404
        
        with open(cliente_path, 'r', encoding='utf-8') as f:
            cliente = json.load(f)
        
        # Carregar template
        template_path = os.path.join(TEMPLATES_DOCX_DIR, template_id)
        if not os.path.exists(template_path):
            return jsonify({"error": f"Template {template_id} não encontrado"}), 404
        
        # Gerar nome único para a petição
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        peticao_id = str(uuid.uuid4())
        nome_arquivo = f"{peticao_id}_{timestamp}.docx"
        caminho_peticao = os.path.join(PETICOES_DIR, nome_arquivo)
        
        # Carregar o template e substituir as variáveis
        doc = Document(template_path)
        
        # Combinar dados do cliente com dados específicos da petição
        dados_completos = {**cliente, **dados_peticao}
        
        # Substituir variáveis no documento
        for paragrafo in doc.paragraphs:
            for chave, valor in dados_completos.items():
                if f"{{{{{chave}}}}}" in paragrafo.text:
                    paragrafo.text = paragrafo.text.replace(f"{{{{{chave}}}}}", str(valor))
        
        # Salvar o documento gerado
        doc.save(caminho_peticao)
        
        # Criar registro da petição (para ser salvo no banco de dados)
        registro_peticao = {
            "id": peticao_id,
            "cliente_id": cliente_id,
            "template_id": template_id,
            "nome_arquivo": nome_arquivo,
            "data_criacao": datetime.now().isoformat(),
            "dados_peticao": dados_peticao
        }
        
        # Salvar registro em JSON (temporário, depois será no PostgreSQL)
        registro_path = os.path.join(PETICOES_DIR, f"{peticao_id}.json")
        with open(registro_path, 'w', encoding='utf-8') as f:
            json.dump(registro_peticao, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            "success": True,
            "peticao_id": peticao_id,
            "nome_arquivo": nome_arquivo,
            "download_url": f"/api/peticoes/{peticao_id}/download"
        })
        
    except Exception as e:
        logger.error(f"Erro ao gerar petição: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/peticoes/<peticao_id>/download')
def download_peticao(peticao_id):
    try:
        # Buscar informações da petição
        registro_path = os.path.join(PETICOES_DIR, f"{peticao_id}.json")
        if not os.path.exists(registro_path):
            return jsonify({"error": "Petição não encontrada"}), 404
        
        with open(registro_path, 'r', encoding='utf-8') as f:
            registro = json.load(f)
        
        nome_arquivo = registro.get('nome_arquivo')
        caminho_peticao = os.path.join(PETICOES_DIR, nome_arquivo)
        
        if not os.path.exists(caminho_peticao):
            return jsonify({"error": "Arquivo da petição não encontrado"}), 404
        
        return send_from_directory(
            PETICOES_DIR, 
            nome_arquivo, 
            as_attachment=True, 
            download_name=nome_arquivo
        )
        
    except Exception as e:
        logger.error(f"Erro ao baixar petição: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/peticoes', methods=['GET'])
def listar_peticoes():
    try:
        # Listar todas as petições geradas
        peticoes = []
        for arquivo in os.listdir(PETICOES_DIR):
            if arquivo.endswith('.json'):
                with open(os.path.join(PETICOES_DIR, arquivo), 'r', encoding='utf-8') as f:
                    peticao = json.load(f)
                    peticoes.append(peticao)
        
        return jsonify(peticoes)
        
    except Exception as e:
        logger.error(f"Erro ao listar petições: {str(e)}")
        return jsonify({"error": str(e)}), 500
        
        
# Iniciar o servidor
if __name__ == '__main__':
    print("="*80)
    print("Iniciando servidor Flask na porta 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)