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

// Mapeamento dos tipos de petição para os papéis do cliente e contraparte
const PAPEIS_PETICAO = {
  recurso: {
    cliente: "Recorrente",
    contraparte: "Recorrido"
  },
  reajuste: {
    cliente: "Requerente",
    contraparte: "Requerido"
  },
  contrarrazoes: {
    cliente: "Contrarrazoante",
    contraparte: "Recorrente"
  },
  defesa: {
    cliente: "Defendente",
    contraparte: "Acusador"
  }
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
  modalidade?: string | null;
  objeto?: string | null;
  autoridade?: string | null;
  contraparte?: string | null;
  cidade?: string | null;
  dataDocumento?: string | null;
  nomeAdvogado?: string | null;
  numeroOAB?: string | null;
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
  const [modalidade, setModalidade] = useState("");
  const [objeto, setObjeto] = useState("");
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
      setModalidade(peticao.modalidade || "");
      setObjeto(peticao.objeto || "");
      setAutoridade(peticao.autoridade || "");
      setContraparte(peticao.contraparte || "");
      setCidade(peticao.cidade || "");
      setDataDocumento(peticao.dataDocumento || "");
      setNomeAdvogado(peticao.nomeAdvogado || "");
      setNumeroOAB(peticao.numeroOAB || "");
    }
  }, [peticao]);

  // Função para atualizar o tipo de petição
  const handleTipoPeticaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTipoPeticao(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // Validar campos obrigatórios
      if (!tipoPeticao || !processNumber || !entity || !reason || !description || !autoridade || !contraparte || !cidade || !dataDocumento || !nomeAdvogado || !numeroOAB) {
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
          modalidade,
          objeto,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="tipo-peticao" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Petição
            </label>
            <select 
              id="tipo-peticao" 
              value={tipoPeticao}
              onChange={handleTipoPeticaoChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recurso">Recurso Administrativo</option>
              <option value="reajuste">Pedido de Reajustamento</option>
              <option value="contrarrazoes">Contrarrazões</option>
              <option value="defesa">Defesa de Sanções</option>
            </select>
            <div className="mt-2 text-sm text-gray-600">
              <span>Papel do cliente: <strong>{PAPEIS_PETICAO[tipoPeticao as keyof typeof PAPEIS_PETICAO]?.cliente}</strong></span><br/>
              <span>Papel da contraparte: <strong>{PAPEIS_PETICAO[tipoPeticao as keyof typeof PAPEIS_PETICAO]?.contraparte}</strong></span>
            </div>
          </div>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="modalidade" className="block text-sm font-medium text-gray-700 mb-2">
              Modalidade
            </label>
            <input 
              type="text" 
              id="modalidade"
              value={modalidade} 
              onChange={(e) => setModalidade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="objeto" className="block text-sm font-medium text-gray-700 mb-2">
              Objeto
            </label>
            <input 
              type="text"
              id="objeto"
              value={objeto}
              onChange={(e) => setObjeto(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
          <div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="autoridade" className="block text-sm font-medium text-gray-700 mb-2">
              Autoridade Competente
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