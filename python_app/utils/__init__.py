#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Módulo de utilitários para o sistema de geração de petições
"""

from .formatacao_juridica import (
    configurar_estilos_juridicos,
    formatar_citacoes_legais,
    adicionar_numeracao_paginas,
    formatar_jurisprudencia,
    adicionar_marca_dagua,
    formatar_texto_juridico
)

from .docx_generator import DocxGenerator
from .ai_generator import AIGenerator
from .validacao_juridica import ValidacaoJuridica

__all__ = [
    'configurar_estilos_juridicos',
    'formatar_citacoes_legais',
    'adicionar_numeracao_paginas',
    'formatar_jurisprudencia',
    'adicionar_marca_dagua',
    'formatar_texto_juridico',
    'DocxGenerator',
    'AIGenerator',
    'ValidacaoJuridica'
] 