'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Cliente {
  id: string;
  nome: string;
  [key: string]: string | number;
}

interface PeticaoResponse {
  success: boolean;
  peticao_id: string;
  nome_arquivo: string;
  download_url: string;
}

const GerarPeticao = () => {
  const { data: session } = useSession();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [templateSelecionado, setTemplateSelecionado] = useState('');
  const [dadosAdicionais, setDadosAdicionais] = useState({
    numero_processo: '',
    vara: '',
    comarca: '',
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState<PeticaoResponse | null>(null);

  useEffect(() => {
    if (!session) {
      setErro('Usuário não autenticado');
      return;
    }

    const carregarDados = async () => {
      try {
        // Carregar clientes
        const resClientes = await fetch('http://localhost:5000/api/clientes');
        if (!resClientes.ok) {
          throw new Error('Erro ao carregar clientes');
        }
        const clientesData = await resClientes.json();
        setClientes(clientesData);

        // Carregar templates
        const resTemplates = await fetch('http://localhost:5000/api/templates');
        if (!resTemplates.ok) {
          throw new Error('Erro ao carregar templates');
        }
        const templatesData = await resTemplates.json();
        setTemplates(templatesData);
      } catch (error) {
        setErro('Erro ao carregar dados: ' + (error as Error).message);
      }
    };

    carregarDados();
  }, [session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDadosAdicionais(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso(null);

    try {
      if (!clienteSelecionado) {
        throw new Error('Selecione um cliente');
      }
      if (!templateSelecionado) {
        throw new Error('Selecione um template');
      }

      // Gerar petição na API Python
      const response = await fetch('http://localhost:5000/api/gerar_peticao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cliente_id: clienteSelecionado,
          template_id: templateSelecionado,
          dados_peticao: dadosAdicionais
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar petição');
      }

      const resultado = await response.json();
      setSucesso(resultado);

      // Salvar no banco de dados PostgreSQL via Prisma
      await salvarPeticaoNoBanco(resultado);

      // Abrir janela de download
      window.open(`http://localhost:5000${resultado.download_url}`, '_blank');
    } catch (error) {
      setErro((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const salvarPeticaoNoBanco = async (peticaoData: PeticaoResponse) => {
    try {
      const response = await fetch('/api/peticoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...peticaoData,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar petição no banco de dados');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao salvar no banco:', error);
      // Não interromper o fluxo se falhar ao salvar no banco
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Gerar Nova Petição</h3>
      
      {erro && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {erro}
        </div>
      )}
      
      {sucesso && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Petição gerada com sucesso! 
          <a 
            href={`http://localhost:5000${sucesso.download_url}`} 
            target="_blank" 
            className="underline ml-2 font-medium"
          >
            Baixar Petição
          </a>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 mb-2">Cliente:</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded"
              value={clienteSelecionado} 
              onChange={(e) => setClienteSelecionado(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione um cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Template:</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded"
              value={templateSelecionado} 
              onChange={(e) => setTemplateSelecionado(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione um template</option>
              {templates.map(template => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-700 mb-2">Dados Adicionais:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Número do Processo:</label>
              <input
                type="text"
                name="numero_processo"
                className="w-full p-2 border border-gray-300 rounded"
                value={dadosAdicionais.numero_processo}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Vara:</label>
              <input
                type="text"
                name="vara"
                className="w-full p-2 border border-gray-300 rounded"
                value={dadosAdicionais.vara}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Comarca:</label>
              <input
                type="text"
                name="comarca"
                className="w-full p-2 border border-gray-300 rounded"
                value={dadosAdicionais.comarca}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Gerando...' : 'Gerar Petição'}
        </button>
      </form>
    </div>
  );
};

export default GerarPeticao;
