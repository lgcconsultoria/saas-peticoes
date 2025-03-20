#!/usr/bin/env python
import os
import docx
from docx import Document

def corrigir_template(template_path):
    """Corrige o template para garantir que o nome do cliente seja exibido corretamente"""
    print(f"Corrigindo template: {template_path}")
    
    if not os.path.exists(template_path):
        print(f"Erro: Template não encontrado: {template_path}")
        return
    
    try:
        # Fazer backup do template original
        backup_path = template_path.replace('.docx', '_backup.docx')
        if not os.path.exists(backup_path):
            import shutil
            shutil.copy2(template_path, backup_path)
            print(f"Backup criado: {backup_path}")
        
        # Abrir o documento
        doc = Document(template_path)
        
        # Verificar e corrigir o parágrafo que deve conter o nome do cliente
        for i, para in enumerate(doc.paragraphs):
            if "vem, respeitosamente" in para.text:
                print(f"Encontrado parágrafo com 'vem, respeitosamente' (#{i+1}):")
                print(f"Original: {para.text}")
                
                # Verificar se o parágrafo contém a palavra "Cliente" em vez do placeholder
                if "Cliente," in para.text and "[NOME_CLIENTE]" not in para.text:
                    # Substituir "Cliente" por "[NOME_CLIENTE]"
                    novo_texto = para.text.replace("Cliente,", "[NOME_CLIENTE],")
                    para.text = novo_texto
                    print(f"Corrigido: {novo_texto}")
                    print("✓ Placeholder [NOME_CLIENTE] adicionado")
                else:
                    print("✓ Parágrafo já está correto ou não contém 'Cliente,'")
        
        # Salvar o documento corrigido
        doc.save(template_path)
        print(f"Template salvo: {template_path}")
        
        return True
    except Exception as e:
        print(f"Erro ao corrigir template: {e}")
        return False

if __name__ == "__main__":
    template_path = "templates_docx/recurso_administrativo.docx"
    corrigir_template(template_path) 