#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para gerenciar clientes do sistema de petições
"""

import os
import sys
import json
import argparse
from templates_manager import Cliente, CLIENTES_DIR

def listar_clientes():
    """Lista todos os clientes cadastrados"""
    clientes = Cliente.carregar_clientes()
    
    if not clientes:
        print("Nenhum cliente cadastrado.")
        return
    
    print(f"Total de clientes: {len(clientes)}")
    print("="*80)
    
    for cliente in clientes:
        print(f"ID: {cliente.id}")
        print(f"Nome: {cliente.nome}")
        print(f"CNPJ: {cliente.cnpj}")
        print(f"Endereço: {cliente.endereco}")
        print(f"Logo: {cliente.logo_path}")
        
        if cliente.advogados:
            print("Advogados:")
            for advogado in cliente.advogados:
                print(f"  - {advogado.get('nome')} ({advogado.get('oab')})")
        else:
            print("Advogados: Nenhum advogado cadastrado")
            
        print("="*80)

def adicionar_cliente(id, nome, cnpj, endereco, logo_path=None):
    """Adiciona um novo cliente"""
    # Verificar se o ID já existe
    cliente_existente = Cliente.obter_cliente_por_id(id)
    if cliente_existente:
        print(f"Erro: Cliente com ID '{id}' já existe.")
        return False
    
    # Carregar clientes existentes
    clientes_file = os.path.join(CLIENTES_DIR, 'clientes.json')
    clientes_data = []
    
    if os.path.exists(clientes_file):
        try:
            with open(clientes_file, 'r', encoding='utf-8') as f:
                clientes_data = json.load(f)
        except Exception as e:
            print(f"Erro ao carregar arquivo de clientes: {e}")
            return False
    
    # Adicionar novo cliente
    novo_cliente = {
        "id": id,
        "nome": nome,
        "cnpj": cnpj,
        "endereco": endereco,
        "logo_path": logo_path,
        "advogados": []
    }
    
    clientes_data.append(novo_cliente)
    
    # Salvar arquivo atualizado
    try:
        with open(clientes_file, 'w', encoding='utf-8') as f:
            json.dump(clientes_data, f, ensure_ascii=False, indent=4)
        print(f"Cliente '{nome}' adicionado com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao salvar arquivo de clientes: {e}")
        return False

def adicionar_advogado(cliente_id, nome, oab):
    """Adiciona um advogado a um cliente existente"""
    # Verificar se o cliente existe
    cliente_existente = Cliente.obter_cliente_por_id(cliente_id)
    if not cliente_existente:
        print(f"Erro: Cliente com ID '{cliente_id}' não encontrado.")
        return False
    
    # Carregar clientes existentes
    clientes_file = os.path.join(CLIENTES_DIR, 'clientes.json')
    clientes_data = []
    
    if os.path.exists(clientes_file):
        try:
            with open(clientes_file, 'r', encoding='utf-8') as f:
                clientes_data = json.load(f)
        except Exception as e:
            print(f"Erro ao carregar arquivo de clientes: {e}")
            return False
    
    # Encontrar o cliente e adicionar o advogado
    for cliente in clientes_data:
        if cliente.get('id') == cliente_id:
            if 'advogados' not in cliente:
                cliente['advogados'] = []
            
            # Verificar se o advogado já existe
            for advogado in cliente['advogados']:
                if advogado.get('nome') == nome and advogado.get('oab') == oab:
                    print(f"Advogado '{nome}' já cadastrado para este cliente.")
                    return False
            
            # Adicionar novo advogado
            cliente['advogados'].append({
                "nome": nome,
                "oab": oab
            })
            
            # Salvar arquivo atualizado
            try:
                with open(clientes_file, 'w', encoding='utf-8') as f:
                    json.dump(clientes_data, f, ensure_ascii=False, indent=4)
                print(f"Advogado '{nome}' adicionado ao cliente '{cliente.get('nome')}' com sucesso!")
                return True
            except Exception as e:
                print(f"Erro ao salvar arquivo de clientes: {e}")
                return False
    
    print(f"Erro: Cliente com ID '{cliente_id}' não encontrado no arquivo.")
    return False

def remover_cliente(cliente_id):
    """Remove um cliente existente"""
    # Verificar se o cliente existe
    cliente_existente = Cliente.obter_cliente_por_id(cliente_id)
    if not cliente_existente:
        print(f"Erro: Cliente com ID '{cliente_id}' não encontrado.")
        return False
    
    # Carregar clientes existentes
    clientes_file = os.path.join(CLIENTES_DIR, 'clientes.json')
    clientes_data = []
    
    if os.path.exists(clientes_file):
        try:
            with open(clientes_file, 'r', encoding='utf-8') as f:
                clientes_data = json.load(f)
        except Exception as e:
            print(f"Erro ao carregar arquivo de clientes: {e}")
            return False
    
    # Remover o cliente
    clientes_data = [cliente for cliente in clientes_data if cliente.get('id') != cliente_id]
    
    # Salvar arquivo atualizado
    try:
        with open(clientes_file, 'w', encoding='utf-8') as f:
            json.dump(clientes_data, f, ensure_ascii=False, indent=4)
        print(f"Cliente '{cliente_existente.nome}' removido com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao salvar arquivo de clientes: {e}")
        return False

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='Gerenciador de clientes para o sistema de petições')
    subparsers = parser.add_subparsers(dest='comando', help='Comandos disponíveis')
    
    # Comando para listar clientes
    listar_parser = subparsers.add_parser('listar', help='Listar todos os clientes')
    
    # Comando para adicionar cliente
    adicionar_parser = subparsers.add_parser('adicionar', help='Adicionar um novo cliente')
    adicionar_parser.add_argument('--id', required=True, help='ID único do cliente')
    adicionar_parser.add_argument('--nome', required=True, help='Nome do cliente')
    adicionar_parser.add_argument('--cnpj', required=True, help='CNPJ do cliente')
    adicionar_parser.add_argument('--endereco', required=True, help='Endereço do cliente')
    adicionar_parser.add_argument('--logo', help='Caminho para o logo do cliente')
    
    # Comando para adicionar advogado
    advogado_parser = subparsers.add_parser('advogado', help='Adicionar um advogado a um cliente')
    advogado_parser.add_argument('--cliente', required=True, help='ID do cliente')
    advogado_parser.add_argument('--nome', required=True, help='Nome do advogado')
    advogado_parser.add_argument('--oab', required=True, help='Número da OAB do advogado')
    
    # Comando para remover cliente
    remover_parser = subparsers.add_parser('remover', help='Remover um cliente')
    remover_parser.add_argument('--id', required=True, help='ID do cliente a ser removido')
    
    args = parser.parse_args()
    
    # Executar o comando apropriado
    if args.comando == 'listar':
        listar_clientes()
    elif args.comando == 'adicionar':
        adicionar_cliente(args.id, args.nome, args.cnpj, args.endereco, args.logo)
    elif args.comando == 'advogado':
        adicionar_advogado(args.cliente, args.nome, args.oab)
    elif args.comando == 'remover':
        remover_cliente(args.id)
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 