#!/usr/bin/env python
import os
import json
from utils.docx_generator import DocxGenerator

def testar_geracao():
    """Testa a geração de um documento com o cliente correto"""
    print("Testando geração de documento com cliente correto...")
    
    # Carregar cliente de teste
    cliente_id = "1643384963681x301322380423725060"
    clientes_json_path = os.path.join("clientes", "clientes.json")
    
    if not os.path.exists(clientes_json_path):
        print(f"Erro: Arquivo de clientes não encontrado: {clientes_json_path}")
        return
    
    try:
        with open(clientes_json_path, 'r', encoding='utf-8') as f:
            clientes = json.load(f)
            
            # Converter cliente_id para string para comparação
            cliente_id_str = str(cliente_id)
            cliente = next((c for c in clientes if str(c.get('id')) == cliente_id_str), None)
            
            if not cliente:
                print(f"Erro: Cliente com ID {cliente_id} não encontrado")
                return
            
            print(f"Cliente encontrado: {cliente.get('nome')}")
            
            # Criar gerador de documentos
            generator = DocxGenerator(
                templates_dir="templates_docx",
                output_dir="peticoes",
                clientes_dir="clientes"
            )
            
            # Dados para o documento
            dados = {
                'cliente_id': cliente_id,
                'cliente_nome': cliente.get('nome'),
                'fatos': "Este é um teste de geração de documento para verificar se o nome do cliente está sendo exibido corretamente.",
                'fundamentos': "O nome do cliente deve ser substituído corretamente no documento.",
                'pedidos': "Que o nome do cliente seja exibido corretamente no documento.",
                'cidade': "Campo Grande",
                'contraparte': "EMPRESA TESTE",
                'autoridade': "JUIZ DE DIREITO",
                'referencia_processo': "Processo nº 123/2024"
            }
            
            # Gerar documento
            doc = generator.gerar_documento("Recurso Administrativo", dados)
            
            # Salvar documento
            output_path = os.path.join("peticoes", "teste_cliente.docx")
            doc.save(output_path)
            
            print(f"Documento gerado com sucesso: {output_path}")
            print("Verifique se o nome do cliente está sendo exibido corretamente no documento.")
            
    except Exception as e:
        print(f"Erro ao testar geração: {e}")

if __name__ == "__main__":
    testar_geracao() 