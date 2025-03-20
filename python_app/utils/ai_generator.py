#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Módulo para geração de conteúdo jurídico com IA
"""

import os
import re
import json
import time
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

# Carregar variáveis de ambiente
load_dotenv()

class AIGenerator:
    """Classe para geração de conteúdo jurídico com IA"""
    
    def __init__(self, api_key, assistant_id):
        """Inicializa o gerador de conteúdo com IA"""
        print("="*80)
        print("Inicializando AIGenerator...")
        
        # Garantir que as variáveis de ambiente sejam carregadas
        self.api_key = api_key
        self.assistant_id = assistant_id
        self.model = "gpt-4"
        self.cache = {}  # Inicializar o cache como um dicionário vazio

        print("Inicializando AIGenerator...")
        print(f"API Key configurada: {'Sim' if api_key else 'Não'}")
        print(f"ID do Assistente: {assistant_id}")
        print(f"Modelo: {self.model}")
        
        # Verificar se o ID do assistente está configurado
        if not self.assistant_id:
            raise ValueError("ID do assistente não fornecido")
            
        # Verificar se a API key está configurada
        if not self.api_key:
            raise ValueError("API key da OpenAI não configurada")
            
        print(f"API Key configurada: {'Sim' if self.api_key else 'Não'}")
        print(f"ID do Assistente: {self.assistant_id}")
        print(f"Modelo: {self.model}")
        
        try:
            self.client = self._create_client()
            # Verificar se o assistente existe
            self.thread = self.client.beta.threads.create()
        except Exception as e:
            print(f"Erro ao inicializar cliente OpenAI ou criar thread: {e}")
            raise
        
        print("AIGenerator inicializado com sucesso!")
    
    def _create_client(self):
        """Cria um cliente OpenAI"""
        try:
            os.environ.pop('HTTP_PROXY', None)
            os.environ.pop('HTTPS_PROXY', None)
            os.environ.pop('http_proxy', None)
            os.environ.pop('https_proxy', None)

            return OpenAI(
                api_key=self.api_key,
                default_headers={"OpenAI-Beta": "assistants=v2"}
            )
        except Exception as e:
            print(f"Erro ao criar cliente OpenAI: {e}")
            raise
    
    def generate_content(self, prompt, max_retries=3):
        """Gera conteúdo usando o assistente"""
        try:
            # Adicionar a mensagem ao thread
            message = self.client.beta.threads.messages.create(
                thread_id=self.thread.id,
                role="user",
                content=prompt
            )

            # Executar o assistente
            run = self.client.beta.threads.runs.create(
                thread_id=self.thread.id,
                assistant_id=self.assistant_id
            )

            # Aguardar a conclusão
            for _ in range(max_retries):
                run = self.client.beta.threads.runs.retrieve(
                    thread_id=self.thread.id,
                    run_id=run.id
                )
                
                if run.status == "completed":
                    # Recuperar a resposta
                    messages = self.client.beta.threads.messages.list(
                        thread_id=self.thread.id
                    )
                    
                    # Pegar a última mensagem (a resposta do assistente)
                    last_message = messages.data[0]
                    return last_message.content[0].text.value
                
                elif run.status in ["failed", "expired", "cancelled"]:
                    raise Exception(f"Run failed with status: {run.status}")
                
                time.sleep(1)  # Esperar 1 segundo antes de verificar novamente

            raise Exception("Timeout waiting for assistant response")
            
        except Exception as e:
            print(f"Erro ao gerar conteúdo: {e}")
            raise

    def close(self):
        """Limpa recursos"""
        try:
            if hasattr(self, 'thread'):
                # Deletar o thread ao finalizar
                self.client.beta.threads.delete(self.thread.id)
        except Exception as e:
            print(f"Erro ao limpar recursos: {e}")
            
    def _extrair_secoes(self, texto):
        """Extrai seções de fatos, argumentos e pedidos do texto"""
        print(f"Extraindo seções do texto: {texto[:100]}...")
        
        # Padrões mais flexíveis para encontrar as seções
        fatos_patterns = [
            r'FATOS:\s*([\s\S]*?)(?=ARGUMENTOS:|FUNDAMENTOS:|DO DIREITO:|$)',
            r'DOS FATOS:\s*([\s\S]*?)(?=ARGUMENTOS:|FUNDAMENTOS:|DO DIREITO:|$)',
            r'I - DOS FATOS\s*([\s\S]*?)(?=II|ARGUMENTOS:|FUNDAMENTOS:|DO DIREITO:|$)'
        ]
        
        argumentos_patterns = [
            r'ARGUMENTOS:\s*([\s\S]*?)(?=PEDIDO:|PEDIDOS:|DO PEDIDO:|$)',
            r'FUNDAMENTOS:\s*([\s\S]*?)(?=PEDIDO:|PEDIDOS:|DO PEDIDO:|$)',
            r'DO DIREITO:\s*([\s\S]*?)(?=PEDIDO:|PEDIDOS:|DO PEDIDO:|$)',
            r'II - DOS FUNDAMENTOS\s*([\s\S]*?)(?=III|PEDIDO:|PEDIDOS:|DO PEDIDO:|$)'
        ]
        
        pedido_patterns = [
            r'PEDIDO:\s*([\s\S]*?)(?=$)',
            r'PEDIDOS:\s*([\s\S]*?)(?=$)',
            r'DO PEDIDO:\s*([\s\S]*?)(?=$)',
            r'III - DOS PEDIDOS\s*([\s\S]*?)(?=$)'
        ]
        
        # Tentar encontrar cada seção usando múltiplos padrões
        fatos = None
        for pattern in fatos_patterns:
            match = re.search(pattern, texto, re.IGNORECASE)
            if match:
                fatos = match.group(1).strip()
                break
        
        argumentos = None
        for pattern in argumentos_patterns:
            match = re.search(pattern, texto, re.IGNORECASE)
            if match:
                argumentos = match.group(1).strip()
                break
        
        pedido = None
        for pattern in pedido_patterns:
            match = re.search(pattern, texto, re.IGNORECASE)
            if match:
                pedido = match.group(1).strip()
                break
        
        # Verificar se conseguimos extrair as seções
        if not fatos and not argumentos and not pedido:
            print("AVISO: Não foi possível extrair nenhuma seção usando os padrões regulares.")
            # Tentar uma abordagem mais simples: dividir o texto em terços
            partes = texto.split('\n\n')
            if len(partes) >= 3:
                print("Usando abordagem alternativa: dividindo o texto em partes.")
                fatos = partes[0]
                argumentos = '\n\n'.join(partes[1:-1])
                pedido = partes[-1]
        
        print(f"Seções extraídas: Fatos: {'Sim' if fatos else 'Não'}, Argumentos: {'Sim' if argumentos else 'Não'}, Pedido: {'Sim' if pedido else 'Não'}")
        
        return {
            "fatos": fatos or "",
            "argumentos": argumentos or "",
            "pedido": pedido or ""
        }
    
    def _gerar_prompt_peticao(self, tipo, motivo, fatos, contexto_adicional=None):
        """Gera o prompt para a petição"""
        prompt = f"""Por favor, gere uma petição completa do tipo {tipo} com o seguinte motivo: "{motivo}". 
        Os fatos básicos são: "{fatos}".
        
        É EXTREMAMENTE IMPORTANTE que você ELABORE E EXPANDA os fatos fornecidos, criando uma narrativa jurídica completa e detalhada. NÃO apenas repita os fatos básicos, mas desenvolva-os de forma profissional e juridicamente adequada.
        
        Preciso que você gere:
        1. Uma versão COMPLETA, DETALHADA e juridicamente adequada dos fatos apresentados, expandindo-os significativamente
        2. Argumentos jurídicos sólidos e DETALHADOS baseados nos fatos, com citações de leis e jurisprudências relevantes
        3. Pedidos claros e objetivos
        
        Formate sua resposta EXATAMENTE neste formato:
        
        FATOS:
        [Sua versão completa e expandida dos fatos aqui - seja detalhado e abrangente]
        
        ARGUMENTOS:
        [Seus argumentos jurídicos detalhados aqui - inclua citações de leis, doutrinas e jurisprudências]
        
        PEDIDO:
        [Seus pedidos aqui - seja específico e abrangente]
        
        É EXTREMAMENTE IMPORTANTE que você use exatamente os cabeçalhos "FATOS:", "ARGUMENTOS:" e "PEDIDO:" para que eu possa extrair corretamente as informações.
        
        Seja MUITO detalhado e específico nos fatos, argumentos e pedidos, baseando-se nos fatos apresentados, mas expandindo-os significativamente.
        
        Lembre-se que estou gerando uma petição do tipo {tipo}, então adapte os argumentos e pedidos de acordo com esse tipo específico.
        
        Utilize seu conhecimento jurídico especializado e os documentos com os quais você foi treinado para criar uma petição de alta qualidade.
        """
        
        # Adicionar contexto adicional se fornecido
        if contexto_adicional:
            prompt += f"\n\nContexto adicional para considerar: {contexto_adicional}"
        
        return prompt
    
    def _gerar_prompt_jurisprudencia(self, tipo, fatos, argumentos):
        """Gera o prompt para buscar jurisprudências relevantes"""
        prompt = f"""Com base nos fatos e argumentos abaixo, forneça 3 jurisprudências relevantes para uma petição do tipo {tipo}.
        
        FATOS:
        {fatos}
        
        ARGUMENTOS:
        {argumentos}
        
        Para cada jurisprudência, forneça:
        1. Tribunal (STF, STJ, TRF, etc.)
        2. Número do processo
        3. Relator
        4. Data de julgamento
        5. Ementa resumida
        6. Explicação de como essa jurisprudência se aplica ao caso
        
        Formate sua resposta como:
        
        JURISPRUDÊNCIA 1:
        [Detalhes da jurisprudência 1]
        
        JURISPRUDÊNCIA 2:
        [Detalhes da jurisprudência 2]
        
        JURISPRUDÊNCIA 3:
        [Detalhes da jurisprudência 3]
        """
        
        return prompt
    
    def _gerar_prompt_fundamentacao_legal(self, tipo, fatos):
        """Gera o prompt para buscar fundamentação legal"""
        prompt = f"""Com base nos fatos abaixo, forneça a fundamentação legal completa para uma petição do tipo {tipo}.
        
        FATOS:
        {fatos}
        
        Inclua:
        1. Leis aplicáveis (com números de artigos específicos)
        2. Códigos relevantes (com números de artigos específicos)
        3. Princípios jurídicos aplicáveis
        4. Doutrina relevante (se aplicável)
        
        Formate sua resposta como:
        
        FUNDAMENTAÇÃO LEGAL:
        [Sua fundamentação legal detalhada aqui]
        """
        
        return prompt
    
    def gerar_peticao_com_chat(self, tipo, motivo, fatos, contexto_adicional=None):
        """Gera uma petição usando o modelo de chat da OpenAI"""
        try:
            print(f"Iniciando geração de petição com modelo de chat: {self.model}")
            print(f"Tipo: {tipo}")
            print(f"Motivo: {motivo}")
            
            # Verificar cache
            cache_key = f"{tipo}_{motivo}_{fatos[:100]}"
            if cache_key in self.cache:
                print("Usando resposta em cache")
                return self.cache[cache_key]
            
            # Gerar prompt
            prompt = self._gerar_prompt_peticao(tipo, motivo, fatos, contexto_adicional)
            
            # Chamar a API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Você é um assistente jurídico especializado em redigir petições com linguagem técnica e formal."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )
            
            # Extrair resposta
            resposta_texto = response.choices[0].message.content
            
            # Extrair seções
            secoes = self._extrair_secoes(resposta_texto)
            
            # Verificar se todas as seções foram extraídas
            if not secoes["fatos"] or not secoes["argumentos"] or not secoes["pedido"]:
                print("AVISO: Algumas seções não foram extraídas corretamente.")
                
                # Tentar novamente com temperatura mais baixa se alguma seção estiver faltando
                if not all(secoes.values()):
                    print("Tentando novamente com temperatura mais baixa...")
                    response = self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": "Você é um assistente jurídico especializado em redigir petições com linguagem técnica e formal. É CRUCIAL que você siga o formato exato solicitado."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.2,
                        max_tokens=4000
                    )
                    
                    resposta_texto = response.choices[0].message.content
                    secoes = self._extrair_secoes(resposta_texto)
            
            # Adicionar jurisprudências se as seções foram extraídas corretamente
            if secoes["fatos"] and secoes["argumentos"]:
                try:
                    # Gerar jurisprudências
                    prompt_jurisprudencia = self._gerar_prompt_jurisprudencia(
                        tipo, secoes["fatos"], secoes["argumentos"]
                    )
                    
                    response_jurisprudencia = self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": "Você é um assistente jurídico especializado em jurisprudência."},
                            {"role": "user", "content": prompt_jurisprudencia}
                        ],
                        temperature=0.5,
                        max_tokens=2000
                    )
                    
                    jurisprudencias = response_jurisprudencia.choices[0].message.content
                    
                    # Adicionar jurisprudências aos argumentos
                    if jurisprudencias and "JURISPRUDÊNCIA" in jurisprudencias:
                        secoes["argumentos"] += "\n\nJURISPRUDÊNCIAS APLICÁVEIS:\n\n" + jurisprudencias
                except Exception as e:
                    print(f"Erro ao gerar jurisprudências: {e}")
            
            # Formatar resultado
            resultado = {
                "fatos": secoes["fatos"] or fatos,
                "argumentos": secoes["argumentos"] or "Não foi possível extrair os argumentos.",
                "pedido": secoes["pedido"] or "Não foi possível extrair o pedido.",
                "texto_completo": resposta_texto
            }
            
            # Salvar no cache
            self.cache[cache_key] = resultado
            
            return resultado
            
        except Exception as error:
            print(f"Erro ao gerar petição com chat: {error}")
            raise error
    
    def gerar_peticao_com_assistente(self, tipo, motivo, fatos, contexto_adicional=None):
        """Gera uma petição usando o Assistente da OpenAI"""
        try:
            print("="*80)
            print(f"Iniciando geração de petição com o Assistente da OpenAI...")
            print(f"ID do Assistente: {self.assistant_id}")
            print(f"Tipo: {tipo}")
            print(f"Motivo: {motivo}")
            print("="*80)
            
            # Verificar cache
            cache_key = f"assistant_{tipo}_{motivo}_{fatos[:100]}"
            if cache_key in self.cache:
                print("Usando resposta em cache")
                return self.cache[cache_key]
            
            # Obter informações do assistente
            try:
                assistant_info = self.client.beta.assistants.retrieve(self.assistant_id)
                print(f"Nome do Assistente: {assistant_info.name}")
                print(f"Modelo: {assistant_info.model}")
                print(f"Instruções: {assistant_info.instructions[:100]}...")
                print(f"Ferramentas disponíveis: {[tool.type for tool in assistant_info.tools]}")
                print("="*80)
            except Exception as e:
                print(f"Aviso: Não foi possível obter informações detalhadas do assistente: {e}")
            
            # Criar um thread
            thread = self.client.beta.threads.create()
            print(f"Thread criado com ID: {thread.id}")
            
            # Gerar prompt
            prompt = self._gerar_prompt_peticao(tipo, motivo, fatos, contexto_adicional)
            
            # Adicionar uma mensagem ao thread
            self.client.beta.threads.messages.create(
                thread_id=thread.id,
                role="user",
                content=prompt
            )
            
            # Executar o assistente
            run = self.client.beta.threads.runs.create(
                thread_id=thread.id,
                assistant_id=self.assistant_id
            )
            
            # Verificar o status da execução
            run_status = self.client.beta.threads.runs.retrieve(
                thread_id=thread.id,
                run_id=run.id
            )
            
            # Aguardar a conclusão da execução
            max_attempts = 30  # 60 segundos (30 * 2)
            attempts = 0
            
            while run_status.status not in ["completed", "failed", "cancelled", "expired"] and attempts < max_attempts:
                print(f"Status atual: {run_status.status}")
                
                # Aguardar 2 segundos antes de verificar novamente
                time.sleep(2)
                attempts += 1
                
                run_status = self.client.beta.threads.runs.retrieve(
                    thread_id=thread.id,
                    run_id=run.id
                )
            
            # Verificar se a execução foi concluída com sucesso
            if run_status.status != "completed":
                print(f"AVISO: Execução do assistente não foi concluída com sucesso. Status: {run_status.status}")
                # Tentar novamente com o modelo de chat como fallback
                print("Tentando gerar com o modelo de chat como fallback...")
                return self.gerar_peticao_com_chat(tipo, motivo, fatos, contexto_adicional)
            
            # Obter as mensagens do thread
            messages = self.client.beta.threads.messages.list(
                thread_id=thread.id
            )
            
            # Obter a última mensagem do assistente
            assistant_messages = [msg for msg in messages.data if msg.role == "assistant"]
            
            if not assistant_messages:
                print("AVISO: Nenhuma resposta do assistente foi encontrada")
                # Tentar novamente com o modelo de chat como fallback
                print("Tentando gerar com o modelo de chat como fallback...")
                return self.gerar_peticao_com_chat(tipo, motivo, fatos, contexto_adicional)
            
            last_message = assistant_messages[0]
            
            # Verificar se a mensagem tem conteúdo
            if not last_message.content or len(last_message.content) == 0:
                print("AVISO: A mensagem do assistente não contém conteúdo")
                # Tentar novamente com o modelo de chat como fallback
                print("Tentando gerar com o modelo de chat como fallback...")
                return self.gerar_peticao_com_chat(tipo, motivo, fatos, contexto_adicional)
            
            # Extrair o texto da mensagem
            content = ""
            for item in last_message.content:
                if hasattr(item, 'text') and hasattr(item.text, 'value'):
                    content += item.text.value
            
            if not content:
                print("AVISO: Não foi possível extrair texto da mensagem do assistente")
                # Tentar novamente com o modelo de chat como fallback
                print("Tentando gerar com o modelo de chat como fallback...")
                return self.gerar_peticao_com_chat(tipo, motivo, fatos, contexto_adicional)
            
            # Extrair seções
            secoes = self._extrair_secoes(content)
            
            # Verificar se as seções foram extraídas corretamente
            if not secoes["fatos"] or not secoes["argumentos"] or not secoes["pedido"]:
                print("AVISO: Algumas seções não foram extraídas corretamente")
                print(f"Fatos extraídos: {'Sim' if secoes['fatos'] else 'Não'}")
                print(f"Argumentos extraídos: {'Sim' if secoes['argumentos'] else 'Não'}")
                print(f"Pedido extraído: {'Sim' if secoes['pedido'] else 'Não'}")
                
                # Se fatos não foram extraídos, tentar novamente
                if not secoes["fatos"] or not secoes["argumentos"]:
                    print("Tentando gerar novamente com instruções mais específicas...")
                    # Adicionar uma mensagem de follow-up ao thread
                    self.client.beta.threads.messages.create(
                        thread_id=thread.id,
                        role="user",
                        content="""Por favor, reformule sua resposta seguindo EXATAMENTE este formato:
                        
                        FATOS:
                        [Fatos detalhados aqui]
                        
                        ARGUMENTOS:
                        [Argumentos detalhados aqui]
                        
                        PEDIDO:
                        [Pedidos detalhados aqui]
                        
                        É crucial que você use exatamente esses cabeçalhos e forneça conteúdo detalhado para cada seção."""
                    )
                    
                    # Executar o assistente novamente
                    run = self.client.beta.threads.runs.create(
                        thread_id=thread.id,
                        assistant_id=self.assistant_id
                    )
                    
                    # Aguardar a conclusão da execução
                    run_status = self.client.beta.threads.runs.retrieve(
                        thread_id=thread.id,
                        run_id=run.id
                    )
                    
                    attempts = 0
                    while run_status.status not in ["completed", "failed", "cancelled", "expired"] and attempts < max_attempts:
                        time.sleep(2)
                        attempts += 1
                        run_status = self.client.beta.threads.runs.retrieve(
                            thread_id=thread.id,
                            run_id=run.id
                        )
                    
                    if run_status.status == "completed":
                        # Obter as mensagens atualizadas
                        messages = self.client.beta.threads.messages.list(
                            thread_id=thread.id
                        )
                        
                        assistant_messages = [msg for msg in messages.data if msg.role == "assistant"]
                        if assistant_messages:
                            last_message = assistant_messages[0]
                            content = ""
                            for item in last_message.content:
                                if hasattr(item, 'text') and hasattr(item.text, 'value'):
                                    content += item.text.value
                            
                            # Extrair seções novamente
                            secoes = self._extrair_secoes(content)
            
            # Formatar resultado
            resultado = {
                "fatos": secoes["fatos"] or "Não foi possível extrair os fatos. Por favor, forneça fatos mais detalhados.",
                "argumentos": secoes["argumentos"] or "Não foi possível extrair os argumentos. Por favor, tente novamente.",
                "pedido": secoes["pedido"] or "Não foi possível extrair os pedidos. Por favor, tente novamente.",
                "texto_completo": content
            }
            
            # Salvar no cache
            self.cache[cache_key] = resultado
            
            return resultado
            
        except Exception as error:
            print(f"Erro ao gerar petição com assistente: {error}")
            # Tentar com o modelo de chat como fallback
            try:
                print("Tentando gerar com o modelo de chat como fallback devido a erro...")
                return self.gerar_peticao_com_chat(tipo, motivo, fatos, contexto_adicional)
            except:
                # Retornar um resultado padrão em caso de exceção
                resultado_padrao = {
                    "fatos": "Ocorreu um erro ao gerar os fatos. Por favor, tente novamente mais tarde.",
                    "argumentos": f"Ocorreu um erro ao gerar argumentos para a petição do tipo {tipo}. Erro: {str(error)}",
                    "pedido": f"Ocorreu um erro ao gerar pedidos para a petição do tipo {tipo}. Por favor, tente novamente mais tarde.",
                    "texto_completo": f"Erro ao gerar petição: {str(error)}"
                }
                return resultado_padrao
    
    def gerar_peticao(self, tipo, motivo, fatos, usar_assistente=True, contexto_adicional=None):
        """
        Gera uma petição usando o método especificado
        
        Args:
            tipo: Tipo da petição
            motivo: Motivo da petição
            fatos: Fatos da petição
            usar_assistente: Se True, usa o Assistente da OpenAI, caso contrário usa o modelo de chat
            contexto_adicional: Contexto adicional para a geração (opcional)
            
        Returns:
            Dicionário com fatos, argumentos e pedidos
        """
        # Forçar o uso do assistente configurado no .env
        if self.assistant_id:
            print(f"Usando assistente com ID: {self.assistant_id}")
            return self.gerar_peticao_com_assistente(tipo, motivo, fatos, contexto_adicional)
        else:
            print("AVISO: ID do assistente não configurado. Usando modelo de chat como fallback.")
            return self.gerar_peticao_com_chat(tipo, motivo, fatos, contexto_adicional) 