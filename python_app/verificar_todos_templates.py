import os
import sys
import json
from datetime import datetime
from docx import Document
from app import gerar_html_preview, gerar_docx, limpar_texto

def verificar_todos_templates():
    """Verifica se as alterações estão funcionando corretamente em todos os templates"""
    print("=== Verificando todos os templates ===")
    
    # Valores de teste
    fatos = "A empresa participou do processo licitatório nº 123/2024, tendo apresentado a melhor proposta. No entanto, foi indevidamente desclassificada sob alegação de não atendimento a requisitos técnicos que não constavam no edital."
    argumentos = "Conforme estabelecido na Lei 8.666/93, a Administração Pública deve observar o princípio da vinculação ao instrumento convocatório. A desclassificação baseada em critérios não previstos no edital constitui violação a este princípio fundamental."
    pedidos = "1. Que seja reconsiderada a decisão que desclassificou a empresa recorrente;\n2. Que seja declarada vencedora do certame a empresa recorrente, por ter apresentado a proposta mais vantajosa para a Administração."
    
    # Tipos de petição para testar
    tipos = [
        "recurso administrativo",
        "impugnação ao edital",
        "mandado de segurança",
        "contrarrazões de recurso"
    ]
    
    # Testar cada tipo de petição
    for tipo in tipos:
        print(f"\n=== Testando tipo: {tipo.upper()} ===")
        
        # Gerar HTML para preview
        print(f"1. Gerando HTML para preview de {tipo}...")
        html = gerar_html_preview(tipo, fatos, argumentos, pedidos)
        
        # Salvar HTML para inspeção
        html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"teste_{tipo.replace(' ', '_')}.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"HTML gerado e salvo em: {html_path}")
        
        # Gerar documento DOCX
        print(f"2. Gerando documento DOCX para {tipo}...")
        try:
            docx_path = gerar_docx(tipo, "", fatos_texto=fatos, argumentos_texto=argumentos, pedidos_texto=pedidos)
            print(f"Documento DOCX gerado e salvo em: {docx_path}")
            
            # Verificar conteúdo do documento DOCX gerado
            print(f"3. Verificando conteúdo do documento DOCX de {tipo}...")
            doc = Document(docx_path)
            
            # Extrair texto dos parágrafos
            paragraphs_text = [p.text for p in doc.paragraphs]
            
            # Verificar se os textos foram inseridos corretamente
            fatos_found = False
            argumentos_found = False
            pedidos_found = False
            
            for text in paragraphs_text:
                if fatos in text:
                    fatos_found = True
                if argumentos in text:
                    argumentos_found = True
                if pedidos.split('\n')[0] in text:  # Verificar apenas a primeira linha dos pedidos
                    pedidos_found = True
            
            if fatos_found and argumentos_found and pedidos_found:
                print(f"✓ Todos os textos foram encontrados no documento {tipo}")
            else:
                if not fatos_found:
                    print(f"✗ Fatos não encontrados no documento {tipo}")
                if not argumentos_found:
                    print(f"✗ Argumentos não encontrados no documento {tipo}")
                if not pedidos_found:
                    print(f"✗ Pedidos não encontrados no documento {tipo}")
                
        except Exception as e:
            print(f"Erro ao gerar ou verificar documento DOCX para {tipo}: {e}")
    
    print("\nVerificação concluída!")

if __name__ == "__main__":
    verificar_todos_templates() 