#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para gerenciar templates de petições
"""

import os
import sys
import json
import argparse
from templates_manager import TemplateManager, TEMPLATES_DIR

def listar_templates():
    """Lista todos os templates disponíveis"""
    print("Templates disponíveis:")
    print("="*80)
    
    # Listar tipos de petição definidos no TemplateManager
    for tipo_id, info in TemplateManager.TIPOS_PETICAO.items():
        template_path = os.path.join(TEMPLATES_DIR, f"{tipo_id}.docx")
        status = "✓ Disponível" if os.path.exists(template_path) else "✗ Não disponível"
        
        print(f"ID: {tipo_id}")
        print(f"Título: {info['titulo']}")
        print(f"Papel do cliente: {info['papel_cliente']}")
        print(f"Papel da contraparte: {info['papel_contraparte']}")
        print(f"Status: {status}")
        print(f"Caminho: {template_path}")
        print("="*80)

def adicionar_tipo_peticao(tipo_id, titulo, papel_cliente, papel_contraparte, gerar_template=True):
    """Adiciona um novo tipo de petição"""
    # Verificar se o tipo já existe
    if tipo_id in TemplateManager.TIPOS_PETICAO:
        print(f"Erro: Tipo de petição '{tipo_id}' já existe.")
        return False
    
    # Adicionar novo tipo
    # Nota: Como o dicionário TIPOS_PETICAO é definido diretamente na classe,
    # não podemos modificá-lo em tempo de execução de forma permanente.
    # Esta função serve apenas para gerar um novo template.
    
    if gerar_template:
        # Criar um template para o novo tipo
        try:
            # Criar um template base
            doc = TemplateManager.criar_template_base()
            
            # Adicionar título
            p = doc.add_paragraph()
            p.alignment = 1  # Centralizado
            run = p.add_run(f"EXCELENTÍSSIMO(A) SENHOR(A) [AUTORIDADE]")
            run.bold = True
            run.font.size = 12
            
            # Adicionar referência ao processo
            p = doc.add_paragraph()
            p.alignment = 1  # Centralizado
            run = p.add_run("[REFERENCIA_PROCESSO]")
            run.bold = True
            
            # Adicionar espaço
            doc.add_paragraph()
            
            # Adicionar qualificação
            p = doc.add_paragraph()
            p.alignment = 3  # Justificado
            p.add_run("[NOME_CLIENTE], [QUALIFICACAO_CLIENTE], vem, respeitosamente, à presença de Vossa Excelência, por intermédio de seu(sua) advogado(a) que esta subscreve, com fundamento em [BASE_LEGAL], interpor o presente")
            
            # Adicionar tipo de petição
            p = doc.add_paragraph()
            p.alignment = 1  # Centralizado
            run = p.add_run(titulo)
            run.bold = True
            run.font.size = 12
            
            # Adicionar contraparte
            p = doc.add_paragraph()
            p.alignment = 3  # Justificado
            p.add_run("em face de [CONTRAPARTE], pelos fatos e fundamentos a seguir expostos.")
            
            # Adicionar seções
            doc.add_paragraph()
            p = doc.add_paragraph()
            run = p.add_run("I - DOS FATOS")
            run.bold = True
            
            doc.add_paragraph("[FATOS]")
            
            doc.add_paragraph()
            p = doc.add_paragraph()
            run = p.add_run("II - DOS FUNDAMENTOS")
            run.bold = True
            
            doc.add_paragraph("[FUNDAMENTOS]")
            
            doc.add_paragraph()
            p = doc.add_paragraph()
            run = p.add_run("III - DOS PEDIDOS")
            run.bold = True
            
            p = doc.add_paragraph()
            p.alignment = 3  # Justificado
            p.add_run("Ante o exposto, requer:")
            
            doc.add_paragraph("[PEDIDOS]")
            
            # Adicionar fechamento
            doc.add_paragraph()
            p = doc.add_paragraph()
            p.alignment = 3  # Justificado
            p.add_run("Nestes termos,")
            
            p = doc.add_paragraph()
            p.alignment = 3  # Justificado
            p.add_run("Pede deferimento.")
            
            doc.add_paragraph()
            p = doc.add_paragraph()
            p.alignment = 2  # Direita
            p.add_run("[CIDADE], [DATA].")
            
            doc.add_paragraph()
            p = doc.add_paragraph()
            p.alignment = 1  # Centralizado
            p.add_run("[ADVOGADO]")
            p.add_run("\n")
            p.add_run("[NUMERO_OAB]")
            
            # Salvar o template
            template_path = os.path.join(TEMPLATES_DIR, f"{tipo_id}.docx")
            doc.save(template_path)
            
            print(f"Template para '{titulo}' criado com sucesso: {template_path}")
            print("Nota: Para adicionar permanentemente este tipo de petição, edite o dicionário TIPOS_PETICAO no arquivo templates_manager.py")
            return True
            
        except Exception as e:
            print(f"Erro ao criar template: {e}")
            return False
    
    return True

def regenerar_template(tipo_id):
    """Regenera um template existente"""
    # Verificar se o tipo existe
    if tipo_id not in TemplateManager.TIPOS_PETICAO:
        print(f"Erro: Tipo de petição '{tipo_id}' não existe.")
        return False
    
    # Obter informações do tipo
    info = TemplateManager.TIPOS_PETICAO[tipo_id]
    
    # Verificar se o template existe
    template_path = os.path.join(TEMPLATES_DIR, f"{tipo_id}.docx")
    if os.path.exists(template_path):
        # Fazer backup do template existente
        import shutil
        from datetime import datetime
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(TEMPLATES_DIR, f"{tipo_id}_{timestamp}_backup.docx")
        
        try:
            shutil.copy2(template_path, backup_path)
            print(f"Backup do template existente criado: {backup_path}")
        except Exception as e:
            print(f"Aviso: Não foi possível criar backup do template: {e}")
    
    # Criar um novo template
    try:
        # Criar um template base
        doc = TemplateManager.criar_template_base()
        
        # Adicionar título
        p = doc.add_paragraph()
        p.alignment = 1  # Centralizado
        run = p.add_run(f"EXCELENTÍSSIMO(A) SENHOR(A) [AUTORIDADE]")
        run.bold = True
        run.font.size = 12
        
        # Adicionar referência ao processo
        p = doc.add_paragraph()
        p.alignment = 1  # Centralizado
        run = p.add_run("[REFERENCIA_PROCESSO]")
        run.bold = True
        
        # Adicionar espaço
        doc.add_paragraph()
        
        # Adicionar qualificação
        p = doc.add_paragraph()
        p.alignment = 3  # Justificado
        p.add_run("[NOME_CLIENTE], [QUALIFICACAO_CLIENTE], vem, respeitosamente, à presença de Vossa Excelência, por intermédio de seu(sua) advogado(a) que esta subscreve, com fundamento em [BASE_LEGAL], interpor o presente")
        
        # Adicionar tipo de petição
        p = doc.add_paragraph()
        p.alignment = 1  # Centralizado
        run = p.add_run(info['titulo'])
        run.bold = True
        run.font.size = 12
        
        # Adicionar contraparte
        p = doc.add_paragraph()
        p.alignment = 3  # Justificado
        p.add_run("em face de [CONTRAPARTE], pelos fatos e fundamentos a seguir expostos.")
        
        # Adicionar seções
        doc.add_paragraph()
        p = doc.add_paragraph()
        run = p.add_run("I - DOS FATOS")
        run.bold = True
        
        doc.add_paragraph("[FATOS]")
        
        doc.add_paragraph()
        p = doc.add_paragraph()
        run = p.add_run("II - DOS FUNDAMENTOS")
        run.bold = True
        
        doc.add_paragraph("[FUNDAMENTOS]")
        
        doc.add_paragraph()
        p = doc.add_paragraph()
        run = p.add_run("III - DOS PEDIDOS")
        run.bold = True
        
        p = doc.add_paragraph()
        p.alignment = 3  # Justificado
        p.add_run("Ante o exposto, requer:")
        
        doc.add_paragraph("[PEDIDOS]")
        
        # Adicionar fechamento
        doc.add_paragraph()
        p = doc.add_paragraph()
        p.alignment = 3  # Justificado
        p.add_run("Nestes termos,")
        
        p = doc.add_paragraph()
        p.alignment = 3  # Justificado
        p.add_run("Pede deferimento.")
        
        doc.add_paragraph()
        p = doc.add_paragraph()
        p.alignment = 2  # Direita
        p.add_run("[CIDADE], [DATA].")
        
        doc.add_paragraph()
        p = doc.add_paragraph()
        p.alignment = 1  # Centralizado
        p.add_run("[ADVOGADO]")
        p.add_run("\n")
        p.add_run("[NUMERO_OAB]")
        
        # Salvar o template
        doc.save(template_path)
        
        print(f"Template para '{info['titulo']}' regenerado com sucesso: {template_path}")
        return True
        
    except Exception as e:
        print(f"Erro ao regenerar template: {e}")
        return False

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='Gerenciador de templates de petições')
    subparsers = parser.add_subparsers(dest='comando', help='Comandos disponíveis')
    
    # Comando para listar templates
    listar_parser = subparsers.add_parser('listar', help='Listar todos os templates disponíveis')
    
    # Comando para adicionar tipo de petição
    adicionar_parser = subparsers.add_parser('adicionar', help='Adicionar um novo tipo de petição')
    adicionar_parser.add_argument('--id', required=True, help='ID único do tipo de petição (ex: recurso_administrativo)')
    adicionar_parser.add_argument('--titulo', required=True, help='Título do tipo de petição (ex: RECURSO ADMINISTRATIVO)')
    adicionar_parser.add_argument('--papel-cliente', required=True, help='Papel do cliente (ex: RECORRENTE)')
    adicionar_parser.add_argument('--papel-contraparte', required=True, help='Papel da contraparte (ex: RECORRIDA)')
    
    # Comando para regenerar template
    regenerar_parser = subparsers.add_parser('regenerar', help='Regenerar um template existente')
    regenerar_parser.add_argument('--id', required=True, help='ID do tipo de petição a ser regenerado')
    
    # Comando para regenerar todos os templates
    regenerar_todos_parser = subparsers.add_parser('regenerar-todos', help='Regenerar todos os templates')
    
    args = parser.parse_args()
    
    # Executar o comando apropriado
    if args.comando == 'listar':
        listar_templates()
    elif args.comando == 'adicionar':
        adicionar_tipo_peticao(args.id, args.titulo, args.papel_cliente, args.papel_contraparte)
    elif args.comando == 'regenerar':
        regenerar_template(args.id)
    elif args.comando == 'regenerar-todos':
        print("Regenerando todos os templates...")
        for tipo_id in TemplateManager.TIPOS_PETICAO:
            regenerar_template(tipo_id)
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 