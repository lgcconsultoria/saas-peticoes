#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para testar a funcionalidade de geração de petição com template e logo
"""

import os
import sys
import json
from datetime import datetime
from docx import Document
from docx.shared import Cm

# Adicionar o diretório atual ao path para importar módulos locais
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importar a função gerar_docx do app.py
from app import gerar_docx

def criar_logo_exemplo(cliente_nome):
    """Cria uma logo de exemplo para o cliente especificado"""
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    # Verificar se a pasta logos existe
    logos_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clientes', 'logos')
    os.makedirs(logos_dir, exist_ok=True)
    
    # Nome do arquivo da logo
    logo_filename = f"{cliente_nome.lower().replace(' ', '_')}.png"
    logo_path = os.path.join(logos_dir, logo_filename)
    
    # Criar uma imagem simples com o nome do cliente
    img = Image.new('RGB', (300, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    
    # Tentar usar uma fonte padrão
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    # Desenhar o texto
    d.text((10, 40), f"Logo {cliente_nome}", fill=(0, 0, 0), font=font)
    
    # Salvar a imagem
    img.save(logo_path)
    print(f"Logo criada: {logo_path}")
    
    return logo_path

def testar_geracao_peticao():
    """Testa a geração de petição com template e logo"""
    print("="*80)
    print("Testando geração de petição com template e logo")
    print("="*80)
    
    # Dados de exemplo
    tipo = "Recurso Administrativo"  # Nome completo do tipo de petição
    cliente_id = "rally"  # ID de um cliente existente no clientes.json
    
    # Texto de exemplo
    texto = """
    <h1>Petição: Recurso Administrativo</h1>
    <h2>Motivo: Desclassificação indevida</h2>
    <h3>I - DOS FATOS</h3>
    <p>A empresa participou da licitação e foi indevidamente desclassificada.</p>
    <h3>II - DOS FUNDAMENTOS</h3>
    <p>A desclassificação foi baseada em critérios não previstos no edital.</p>
    <h3>III - DOS PEDIDOS</h3>
    <p>Ante o exposto, requer:</p>
    <p>A reconsideração da decisão e a classificação da empresa.</p>
    """
    
    # Verificar se o cliente existe
    clientes_json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clientes', 'clientes.json')
    cliente_nome = None
    
    if os.path.exists(clientes_json_path):
        with open(clientes_json_path, 'r', encoding='utf-8') as f:
            clientes = json.load(f)
            cliente = next((c for c in clientes if str(c.get('id')) == str(cliente_id)), None)
            if cliente:
                cliente_nome = cliente.get('nome', '')
    
    # Criar logo de exemplo se o cliente existir
    if cliente_nome:
        criar_logo_exemplo(cliente_nome)
    
    # Gerar documento
    filepath = gerar_docx(
        tipo=tipo,
        texto=texto,
        cliente_id=cliente_id,
        contraparte="Empresa XYZ",
        autoridade="Pregoeiro",
        referencia_processo="Processo nº 123/2023",
        cidade="Campo Grande"
    )
    
    print(f"Documento gerado: {filepath}")
    print("="*80)

if __name__ == "__main__":
    testar_geracao_peticao() 