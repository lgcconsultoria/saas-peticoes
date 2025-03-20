#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Módulo para validação jurídica de petições
"""

import re
import os
import json
from datetime import datetime

class ValidacaoJuridica:
    """Classe para validação jurídica de petições"""
    
    def __init__(self, base_dir=None):
        """Inicializa o validador jurídico"""
        self.base_dir = base_dir or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Carregar regras de validação
        self.regras_validacao = self._carregar_regras_validacao()
    
    def _carregar_regras_validacao(self):
        """Carrega regras de validação de um arquivo JSON"""
        regras_path = os.path.join(self.base_dir, 'data', 'regras_validacao.json')
        
        # Criar diretório se não existir
        os.makedirs(os.path.dirname(regras_path), exist_ok=True)
        
        # Verificar se o arquivo existe
        if not os.path.exists(regras_path):
            # Criar arquivo com regras padrão
            regras_padrao = {
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
            
            # Salvar regras padrão
            with open(regras_path, 'w', encoding='utf-8') as f:
                json.dump(regras_padrao, f, indent=4, ensure_ascii=False)
            
            return regras_padrao
        
        # Carregar regras do arquivo
        try:
            with open(regras_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Erro ao carregar regras de validação: {e}")
            return {}
    
    def validar_termos_proibidos(self, texto):
        """Valida se o texto contém termos proibidos"""
        if not texto:
            return True, []
        
        termos_proibidos = self.regras_validacao.get('termos_proibidos', [])
        termos_encontrados = []
        
        for termo in termos_proibidos:
            if re.search(r'\b' + re.escape(termo) + r'\b', texto, re.IGNORECASE):
                termos_encontrados.append(termo)
        
        return len(termos_encontrados) == 0, termos_encontrados
    
    def validar_termos_obrigatorios(self, texto, tipo_peticao):
        """Valida se o texto contém termos obrigatórios para o tipo de petição"""
        if not texto or not tipo_peticao:
            return False, []
        
        # Normalizar tipo de petição
        tipo_normalizado = tipo_peticao.lower().replace(' ', '_')
        
        # Obter termos obrigatórios para o tipo de petição
        termos_obrigatorios = self.regras_validacao.get('termos_obrigatorios', {}).get(tipo_normalizado, [])
        termos_encontrados = []
        termos_faltantes = []
        
        for termo in termos_obrigatorios:
            if re.search(r'\b' + re.escape(termo) + r'\b', texto, re.IGNORECASE):
                termos_encontrados.append(termo)
            else:
                termos_faltantes.append(termo)
        
        # Considerar válido se pelo menos um termo obrigatório for encontrado
        return len(termos_encontrados) > 0, termos_faltantes
    
    def validar_citacoes_legais(self, texto):
        """Valida se o texto contém citações legais"""
        if not texto:
            return False, "Texto vazio"
        
        padroes_citacao = self.regras_validacao.get('padroes_citacao', [])
        citacoes_encontradas = []
        
        for padrao in padroes_citacao:
            matches = re.findall(padrao, texto)
            citacoes_encontradas.extend(matches)
        
        return len(citacoes_encontradas) > 0, citacoes_encontradas
    
    def validar_comprimento(self, texto, tipo_secao):
        """Valida se o texto tem o comprimento mínimo para a seção"""
        if not texto or not tipo_secao:
            return False, 0
        
        comprimento_minimo = self.regras_validacao.get('comprimento_minimo', {}).get(tipo_secao, 0)
        comprimento_atual = len(texto)
        
        return comprimento_atual >= comprimento_minimo, comprimento_atual
    
    def validar_peticao(self, dados_peticao):
        """
        Valida uma petição completa
        
        Args:
            dados_peticao: Dicionário com os dados da petição
                - tipo: Tipo da petição
                - fatos: Texto dos fatos
                - argumentos: Texto dos argumentos
                - pedidos: Texto dos pedidos
                
        Returns:
            Tupla (valido, erros)
                - valido: Boolean indicando se a petição é válida
                - erros: Lista de erros encontrados
        """
        if not dados_peticao:
            return False, ["Dados da petição não fornecidos"]
        
        tipo = dados_peticao.get('tipo', '')
        fatos = dados_peticao.get('fatos', '')
        argumentos = dados_peticao.get('argumentos', '')
        pedidos = dados_peticao.get('pedidos', '')
        
        erros = []
        
        # Validar termos proibidos
        for secao, texto in [('fatos', fatos), ('argumentos', argumentos), ('pedidos', pedidos)]:
            valido, termos = self.validar_termos_proibidos(texto)
            if not valido:
                erros.append(f"A seção '{secao}' contém termos proibidos: {', '.join(termos)}")
        
        # Validar termos obrigatórios
        valido, termos = self.validar_termos_obrigatorios(argumentos, tipo)
        if not valido:
            erros.append(f"A seção 'argumentos' não contém termos obrigatórios para o tipo '{tipo}': {', '.join(termos)}")
        
        # Validar citações legais
        valido, citacoes = self.validar_citacoes_legais(argumentos)
        if not valido:
            erros.append("A seção 'argumentos' não contém citações legais")
        
        # Validar comprimento
        for secao, texto in [('fatos', fatos), ('argumentos', argumentos), ('pedidos', pedidos)]:
            valido, comprimento = self.validar_comprimento(texto, secao)
            if not valido:
                comprimento_minimo = self.regras_validacao.get('comprimento_minimo', {}).get(secao, 0)
                erros.append(f"A seção '{secao}' tem apenas {comprimento} caracteres (mínimo: {comprimento_minimo})")
        
        return len(erros) == 0, erros
    
    def gerar_relatorio_validacao(self, dados_peticao):
        """
        Gera um relatório de validação para uma petição
        
        Args:
            dados_peticao: Dicionário com os dados da petição
                
        Returns:
            Dicionário com o relatório de validação
        """
        valido, erros = self.validar_peticao(dados_peticao)
        
        tipo = dados_peticao.get('tipo', '')
        fatos = dados_peticao.get('fatos', '')
        argumentos = dados_peticao.get('argumentos', '')
        pedidos = dados_peticao.get('pedidos', '')
        
        # Validar citações legais
        _, citacoes = self.validar_citacoes_legais(argumentos)
        
        # Calcular estatísticas
        estatisticas = {
            'caracteres': {
                'fatos': len(fatos),
                'argumentos': len(argumentos),
                'pedidos': len(pedidos),
                'total': len(fatos) + len(argumentos) + len(pedidos)
            },
            'palavras': {
                'fatos': len(fatos.split()),
                'argumentos': len(argumentos.split()),
                'pedidos': len(pedidos.split()),
                'total': len(fatos.split()) + len(argumentos.split()) + len(pedidos.split())
            },
            'citacoes_legais': len(citacoes)
        }
        
        return {
            'valido': valido,
            'erros': erros,
            'estatisticas': estatisticas,
            'data_validacao': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'citacoes_encontradas': citacoes
        } 