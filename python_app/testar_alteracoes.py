import os
import sys
import json
from datetime import datetime
from docx import Document
from app import gerar_html_preview, gerar_docx, limpar_texto

def testar_alteracoes():
    """Testa as alterações feitas nas funções gerar_html_preview e gerar_docx"""
    print("=== Testando alterações nas funções gerar_html_preview e gerar_docx ===")
    
    # Valores de teste
    tipo = "recurso administrativo"
    fatos = "A empresa participou do processo licitatório nº 123/2024, tendo apresentado a melhor proposta. No entanto, foi indevidamente desclassificada sob alegação de não atendimento a requisitos técnicos que não constavam no edital."
    argumentos = "Conforme estabelecido na Lei 8.666/93, a Administração Pública deve observar o princípio da vinculação ao instrumento convocatório. A desclassificação baseada em critérios não previstos no edital constitui violação a este princípio fundamental."
    pedidos = "1. Que seja reconsiderada a decisão que desclassificou a empresa recorrente;\n2. Que seja declarada vencedora do certame a empresa recorrente, por ter apresentado a proposta mais vantajosa para a Administração."
    
    # Gerar HTML para preview
    print("\n1. Gerando HTML para preview...")
    html = gerar_html_preview(tipo, fatos, argumentos, pedidos)
    
    # Salvar HTML para inspeção
    html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "teste_preview.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML gerado e salvo em: {html_path}")
    
    # Verificar se o HTML contém caracteres especiais corretamente
    print("\nVerificando codificação do HTML...")
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()
        
    if "ção" in html_content and "ência" in html_content:
        print("✓ Codificação UTF-8 parece estar funcionando corretamente")
    else:
        print("✗ Problemas com a codificação UTF-8 no HTML")
    
    # Gerar documento DOCX
    print("\n2. Gerando documento DOCX...")
    try:
        docx_path = gerar_docx(tipo, "", fatos_texto=fatos, argumentos_texto=argumentos, pedidos_texto=pedidos)
        print(f"Documento DOCX gerado e salvo em: {docx_path}")
        
        # Verificar conteúdo do documento DOCX gerado
        print("\n3. Verificando conteúdo do documento DOCX gerado...")
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
                print("✓ Fatos encontrados no documento")
            if argumentos in text:
                argumentos_found = True
                print("✓ Argumentos encontrados no documento")
            if pedidos.split('\n')[0] in text:  # Verificar apenas a primeira linha dos pedidos
                pedidos_found = True
                print("✓ Pedidos encontrados no documento")
        
        if not fatos_found:
            print("✗ Fatos não encontrados no documento")
        if not argumentos_found:
            print("✗ Argumentos não encontrados no documento")
        if not pedidos_found:
            print("✗ Pedidos não encontrados no documento")
            
    except Exception as e:
        print(f"Erro ao gerar ou verificar documento DOCX: {e}")
    
    print("\nTeste concluído!")

if __name__ == "__main__":
    testar_alteracoes() 