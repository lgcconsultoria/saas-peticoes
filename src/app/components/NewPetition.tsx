"use client"

import { useState, useEffect } from "react"
import PreviewPetition from "./PreviewPetition"

// Mapeamento dos tipos de petição para seus nomes completos
const TIPOS_PETICAO = {
  recurso: "Recurso Administrativo",
  reajuste: "Pedido de Reajustamento",
  contrarrazoes: "Contrarrazões",
  defesa: "Defesa de Sanções"
};

export default function NewPetition() {
  const [tipoPeticao, setTipoPeticao] = useState("recurso");
  const [customerId, setCustomerId] = useState("");
  const [processNumber, setProcessNumber] = useState("");
  const [entity, setEntity] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [argumentsText, setArgumentsText] = useState("");
  const [request, setRequest] = useState("");
  const [autoridade, setAutoridade] = useState("");
  const [contraparte, setContraparte] = useState("");
  const [cidade, setCidade] = useState("");
  const [dataDocumento, setDataDocumento] = useState("");
  const [nomeAdvogado, setNomeAdvogado] = useState("");
  const [numeroOAB, setNumeroOAB] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState("");
  const [peticaoGerada, setPeticaoGerada] = useState("");
  const [peticaoId, setPeticaoId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<{id: string, razaoSocial: string}[]>([]);

  useEffect(() => {
    // Função para buscar clientes do banco de dados
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customer');
        if (!response.ok) {
          throw new Error('Erro ao buscar clientes');
        }
        const customersData = await response.json();
        setCustomers(customersData.customers);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        setError((error as Error).message);
      }
    };

    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // Validar campos obrigatórios
      if (!tipoPeticao || !customerId || !processNumber || !entity || !reason || !description || !argumentsText || !request || !autoridade || !contraparte || !cidade || !dataDocumento || !nomeAdvogado || !numeroOAB) {
        throw new Error("Todos os campos são obrigatórios");
      }

      // Obter o nome completo do tipo de petição
      const tipoCompleto = TIPOS_PETICAO[tipoPeticao as keyof typeof TIPOS_PETICAO];

      // Chamar a API para gerar a petição
      const response = await fetch('/api/peticoes/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipoPeticao: tipoCompleto, // Enviando o nome completo
          customerId,
          processNumber,
          entity,
          reason,
          description,
          arguments: argumentsText,
          request,
          autoridade,
          contraparte,
          cidade,
          dataDocumento,
          nomeAdvogado,
          numeroOAB
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar petição');
      }

      const responseData = await response.json();
      setPeticaoGerada(responseData.content);
      setPeticaoId(responseData.peticaoId);
    } catch (error) {
      console.error("Erro ao gerar a petição:", error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!peticaoId || !peticaoGerada) return;

    try {
      setDownloadLoading(true);
      
      // Chamar a API para gerar o documento DOCX
      const response = await fetch('/api/peticoes/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          peticaoId,
          content: peticaoGerada
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar documento');
      }

      const downloadData = await response.json();
      
      // Converter o conteúdo base64 para Blob
      const binaryString = window.atob(downloadData.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: downloadData.contentType });
      
      // Criar um link para download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadData.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao baixar o documento:", error);
      setError((error as Error).message);
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div id="formulario-peticao" className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Nova Petição</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="tipo-peticao" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Petição
            </label>
            <select 
              id="tipo-peticao" 
              value={tipoPeticao}
              onChange={(e) => setTipoPeticao(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recurso">Recurso Administrativo</option>
              <option value="reajuste">Pedido de Reajustamento</option>
              <option value="contrarrazoes">Contrarrazões</option>
              <option value="defesa">Defesa de Sanções</option>
            </select>
          </div>
          <div>
            <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <select 
              id="cliente" 
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.razaoSocial}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="processo" className="block text-sm font-medium text-gray-700 mb-2">
              Número do Processo
            </label>
            <input 
              type="text" 
              id="processo"
              value={processNumber} 
              onChange={(e) => setProcessNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="orgao" className="block text-sm font-medium text-gray-700 mb-2">
              Órgão/Entidade
            </label>
            <input 
              type="text" 
              id="orgao"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
            Motivo da Petição
          </label>
          <input 
            type="text" 
            id="motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="fatos" className="block text-sm font-medium text-gray-700 mb-2">
            Descrição dos Fatos
          </label>
          <textarea 
            id="fatos" 
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="autoridade" className="block text-sm font-medium text-gray-700 mb-2">
              Autoridade Destinatária
            </label>
            <input 
              type="text" 
              id="autoridade"
              value={autoridade} 
              onChange={(e) => setAutoridade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="contraparte" className="block text-sm font-medium text-gray-700 mb-2">
              Contraparte
            </label>
            <input 
              type="text" 
              id="contraparte"
              value={contraparte}
              onChange={(e) => setContraparte(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-2">
              Cidade
            </label>
            <input 
              type="text" 
              id="cidade"
              value={cidade} 
              onChange={(e) => setCidade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="dataDocumento" className="block text-sm font-medium text-gray-700 mb-2">
              Data
            </label>
            <input 
              type="date" 
              id="dataDocumento"
              value={dataDocumento}
              onChange={(e) => setDataDocumento(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="nomeAdvogado" className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Advogado
            </label>
            <input 
              type="text" 
              id="nomeAdvogado"
              value={nomeAdvogado} 
              onChange={(e) => setNomeAdvogado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="numeroOAB" className="block text-sm font-medium text-gray-700 mb-2">
              Número da OAB
            </label>
            <input 
              type="text" 
              id="numeroOAB"
              value={numeroOAB}
              onChange={(e) => setNumeroOAB(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button 
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              setCustomerId("");
              setProcessNumber("");
              setEntity("");
              setReason("");
              setDescription("");
              setArgumentsText("");
              setRequest("");
              setAutoridade("");
              setContraparte("");
              setCidade("");
              setDataDocumento("");
              setNomeAdvogado("");
              setNumeroOAB("");
              setPeticaoGerada("");
              setPeticaoId(null);
            }}
          >
            Limpar
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer disabled:bg-blue-400"
          >
            {loading ? "Gerando..." : "Gerar Petição"}
          </button>
        </div>
      </form>

      {peticaoGerada && (
        <div className="mt-8">
          <PreviewPetition 
            processNumber={processNumber}
            entity={entity}
            reason={reason}
            description={description}
            argumentsText={argumentsText}
            request={request}
            autoridade={autoridade}
            contraparte={contraparte}
            cidade={cidade}
            dataDocumento={dataDocumento}
            nomeAdvogado={nomeAdvogado}
            numeroOAB={numeroOAB}
            content={peticaoGerada}
            onDownload={handleDownload}
            isLoading={downloadLoading}
          />
        </div>
      )}
    </div>
  );
}