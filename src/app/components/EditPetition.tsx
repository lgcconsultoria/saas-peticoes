"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation';
import PreviewPetition from "./PreviewPetition"

// Mapeamento dos tipos de petição para seus nomes completos
const TIPOS_PETICAO = {
  recurso: "Recurso Administrativo",
  reajuste: "Pedido de Reajustamento",
  contrarrazoes: "Contrarrazões",
  defesa: "Defesa de Sanções"
};

// Mapeamento inverso para obter a chave a partir do valor
const TIPOS_PETICAO_INVERSO: Record<string, string> = {
  "Recurso Administrativo": "recurso",
  "Pedido de Reajustamento": "reajuste",
  "Contrarrazões": "contrarrazoes",
  "Defesa de Sanções": "defesa"
};

// Definindo o tipo para as petições
interface Petition {
  id: number;
  processNumber: string;
  type: string;
  entity: string;
  reason: string;
  description: string;
  arguments: string;
  request: string;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
}

interface EditPetitionProps {
  peticao: Petition;
}

export default function EditPetition({ peticao }: EditPetitionProps) {
  const [tipoPeticao, setTipoPeticao] = useState("");
  const [processNumber, setProcessNumber] = useState("");
  const [entity, setEntity] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [argumentsText, setArgumentsText] = useState("");
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState("");
  const [peticaoGerada, setPeticaoGerada] = useState("");
  const [peticaoId, setPeticaoId] = useState<number | null>(null);
  
  const router = useRouter();

  // Carregar os dados da petição
  useEffect(() => {
    if (peticao) {
      // Converter o tipo completo para a chave do select
      const tipoKey = TIPOS_PETICAO_INVERSO[peticao.type] || "recurso";
      
      setTipoPeticao(tipoKey);
      setProcessNumber(peticao.processNumber);
      setEntity(peticao.entity);
      setReason(peticao.reason);
      setDescription(peticao.description);
      setArgumentsText(peticao.arguments);
      setRequest(peticao.request);
      setPeticaoId(peticao.id);
    }
  }, [peticao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // Validar campos obrigatórios
      if (!tipoPeticao || !processNumber || !entity || !reason || !description || !argumentsText || !request) {
        throw new Error("Todos os campos são obrigatórios");
      }

      // Obter o nome completo do tipo de petição
      const tipoCompleto = TIPOS_PETICAO[tipoPeticao as keyof typeof TIPOS_PETICAO];

      // Chamar a API para atualizar a petição
      const response = await fetch(`/api/peticoes/${peticaoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipoPeticao: tipoCompleto, // Enviando o nome completo
          processNumber,
          entity,
          reason,
          description,
          arguments: argumentsText,
          request
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar petição');
      }

      const data = await response.json();
      setPeticaoGerada(data.content);
      
      // Redirecionar para a lista de petições após atualização bem-sucedida
      alert("Petição atualizada com sucesso!");
      router.push('/minhas-peticoes');
    } catch (error) {
      console.error("Erro ao atualizar a petição:", error);
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

      const data = await response.json();
      
      // Converter o conteúdo base64 para Blob
      const binaryString = window.atob(data.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.contentType });
      
      // Criar um link para download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
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

  const handleCancel = () => {
    router.push('/minhas-peticoes');
  };

  return (
    <div id="formulario-peticao" className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Editar Petição</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
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
            Motivo
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
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
            Descrição dos Fatos
          </label>
          <textarea 
            id="descricao"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="mb-6">
          <label htmlFor="argumentos" className="block text-sm font-medium text-gray-700 mb-2">
            Argumentos Jurídicos
          </label>
          <textarea 
            id="argumentos"
            rows={6}
            value={argumentsText}
            onChange={(e) => setArgumentsText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="mb-6">
          <label htmlFor="pedido" className="block text-sm font-medium text-gray-700 mb-2">
            Pedido
          </label>
          <textarea 
            id="pedido"
            rows={4}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-4">
          <button 
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
            onClick={handleCancel}
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer disabled:bg-blue-400"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
} 