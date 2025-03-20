#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para gerar templates padrão de petições
"""

import os
import sys
from templates_manager import TemplateManager

def main():
    """Função principal"""
    print("="*80)
    print("Gerando templates padrão de petições...")
    print("="*80)
    
    # Criar templates padrão
    TemplateManager.criar_templates_padrao()
    
    print("="*80)
    print("Templates padrão gerados com sucesso!")
    print("="*80)
    
    # Listar templates gerados
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates_docx')
    print(f"Templates disponíveis em: {templates_dir}")
    print("Templates:")
    for filename in os.listdir(templates_dir):
        if filename.endswith('.docx'):
            print(f"- {filename}")
    
    print("="*80)
    print("Para adicionar novos tipos de petição, edite o dicionário TIPOS_PETICAO")
    print("no arquivo templates_manager.py e execute este script novamente.")
    print("="*80)

if __name__ == "__main__":
    main() 