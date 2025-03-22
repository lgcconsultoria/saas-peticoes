"use client"

import { useState, useEffect } from "react"
import PreviewPetition from "./PreviewPetition"
import { Tooltip } from 'react-tooltip'
import { showError, showSuccess, showInfo } from "@/lib/toast"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons"

// Mapeamento dos tipos de petição para seus nomes completos
const TIPOS_PETICAO = {
  recurso: "Recurso Administrativo",
  reajuste: "Pedido de Reajustamento",
  contrarrazoes: "Contrarrazões",
  defesa: "Defesa de Sanções"
};

// Definição dos tooltips para cada campo
const TOOLTIPS = {
  tipoPeticao: "Selecione o tipo de documento jurídico que você precisa criar. Cada tipo tem propósitos específicos.",
  modalidade: "Informe a modalidade da licitação (ex: Pregão Eletrônico, Concorrência, Tomada de Preços, etc).",
  objeto: "Descreva brevemente o assunto principal da licitação ou contrato que está sendo tratado.",
  motivo: "Explique resumidamente o motivo pelo qual você está criando esta petição.",
  descricao: "Descreva detalhadamente os fatos relevantes para embasar a petição.",
  autoridade: "Indique a autoridade competente a quem a petição será endereçada (ex: Pregoeiro, Presidente da Comissão, etc).",
  contraparte: "Informe o nome da parte contrária no processo (órgão público, empresa, etc). Campo obrigatório apenas para Contrarrazões."
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

// Constante para o limite máximo de caracteres
const MAX_DESCRIPTION_LENGTH = 1500;

export default function NewPetition() {
  const [tipoPeticao, setTipoPeticao] = useState("recurso");
  const [customerId, setCustomerId] = useState("");
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
  const [customers, setCustomers] = useState<{id: string, razaoSocial: string}[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  // Novos estados para o processamento assíncrono
  const [statusId, setStatusId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Função para obter a classe CSS do contador de caracteres
  const getCharCountClass = () => {
    const length = description.length;
    if (length > MAX_DESCRIPTION_LENGTH) return "text-red-600 font-bold";
    if (length > MAX_DESCRIPTION_LENGTH * 0.8) return "text-orange-500";
    return "text-gray-500";
  };
  
  // Manipulador de alteração na descrição com validação
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setDescription(newValue);
    
    // Aviso ao usuário quando se aproximar do limite
    if (newValue.length > MAX_DESCRIPTION_LENGTH * 0.9 && description.length <= MAX_DESCRIPTION_LENGTH * 0.9) {
      showInfo(`Atenção: Você está se aproximando do limite de ${MAX_DESCRIPTION_LENGTH} caracteres.`);
    }
  };

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

  // Novo useEffect para lidar com o polling de status
  useEffect(() => {
    // Limpar o intervalo de polling ao desmontar o componente
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Função para verificar o status da petição
  const checkPeticaoStatus = async (id: string) => {
    try {
      const response = await fetch('/api/peticoes/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkStatus: true, statusId: id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao verificar status');
      }

      const statusData = await response.json();

      // Atualizar interface com o progresso
      if (statusData.progress) {
        setProgress(statusData.progress);
      }
      
      if (statusData.message) {
        setStatusMessage(statusData.message);
      }

      // Processar o resultado com base no status
      if (statusData.status === 'completed') {
        // Petição concluída com sucesso
        setPeticaoGerada(statusData.content);
        setPeticaoId(statusData.peticaoId);
        setLoading(false);
        setStatusId(null);
        showSuccess("Petição gerada com sucesso!");
        
        // Limpar o intervalo de polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } 
      else if (statusData.status === 'error') {
        // Ocorreu um erro na geração
        throw new Error(statusData.error || 'Ocorreu um erro na geração da petição');
      }
      // Em caso de 'processing', continua o polling
      
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      setError((error as Error).message);
      setLoading(false);
      setStatusId(null);
      
      // Limpar o intervalo de polling em caso de erro
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      showError((error as Error).message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setProgress(0);
    setStatusMessage("Iniciando...");

    try {
      // Validar campos obrigatórios comuns a todos os tipos
      if (!tipoPeticao || !customerId || !processNumber || !entity || !reason || !description || !autoridade || !cidade || !dataDocumento || !nomeAdvogado || !numeroOAB) {
        throw new Error("Todos os campos são obrigatórios");
      }
      
      // Validar contraparte apenas para Contrarrazões
      if (tipoPeticao === "contrarrazoes" && !contraparte) {
        throw new Error("O campo Contraparte é obrigatório para Contrarrazões");
      }
      
      // Validar tamanho da descrição
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`A descrição excede o limite de ${MAX_DESCRIPTION_LENGTH} caracteres. Atualmente tem ${description.length} caracteres.`);
      }

      // Obter o nome completo do tipo de petição
      const tipoCompleto = TIPOS_PETICAO[tipoPeticao as keyof typeof TIPOS_PETICAO];

      // Mostrar mensagem informativa sobre processamento assíncrono
      showInfo("Sua petição será processada de forma assíncrona. Acompanhe o progresso na tela.");

      // Chamar API para iniciar o processamento assíncrono
      const response = await fetch('/api/peticoes/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoPeticao: tipoCompleto,
          customerId,
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
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao iniciar geração de petição');
      }

      const responseData = await response.json();
      
      // Verificar se recebemos um ID de status para processar de forma assíncrona
      if (responseData.status === 'accepted' && responseData.statusId) {
        setStatusId(responseData.statusId);
        setStatusMessage(responseData.message || "Petição em processamento...");
        
        // Iniciar polling para verificar o status a cada 3 segundos
        const interval = setInterval(() => {
          checkPeticaoStatus(responseData.statusId);
        }, 3000);
        
        setPollingInterval(interval);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error("Erro ao gerar a petição:", error);
      setError((error as Error).message || "Ocorreu um erro ao gerar a petição. Por favor, tente novamente mais tarde.");
      setLoading(false);
      showError((error as Error).message || "Ocorreu um erro ao gerar a petição");
    }
  };

  const handleDownload = async () => {
    if (!peticaoId || !peticaoGerada) return;

    try {
      setDownloadLoading(true);
      showInfo("Preparando documento para download...");
      
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
      
      showSuccess("Download concluído com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar o documento:", error);
      setError((error as Error).message);
      showError("Erro ao baixar o documento: " + (error as Error).message);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Função para atualizar o tipo de petição
  const handleTipoPeticaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTipoPeticao(e.target.value);
  };

  // Função para criar o ícone de ajuda com tooltip
  const renderTooltip = (fieldId: string, label: string) => (
    <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
      {label}
      <span 
        className="ml-1 inline-flex items-center cursor-help"
        data-tooltip-id={`tooltip-${fieldId}`}
        data-tooltip-content={TOOLTIPS[fieldId as keyof typeof TOOLTIPS]}
      >
        <FontAwesomeIcon 
          icon={faInfoCircle} 
          className="text-gray-500" 
          width={14}
          height={14}
          tabIndex={-1}
        />
      </span>
      <Tooltip id={`tooltip-${fieldId}`} />
    </label>
  );

  return (
    <div id="formulario-peticao" className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Nova Petição</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          {error.includes("tempo") || error.includes("timeout") || error.includes("excedido") ? (
            <div className="mt-2 text-sm">
              Sugestões:
              <ul className="list-disc pl-5 mt-1">
                <li>Reduza o tamanho da descrição dos fatos (máximo {MAX_DESCRIPTION_LENGTH} caracteres)</li>
                <li>Seja mais conciso nos detalhes</li>
                <li>Tente em um horário com menos tráfego</li>
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center mb-2">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {statusMessage || "Processando petição..."}
          </div>
          
          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs mt-1 text-right">{progress}% concluído</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            {renderTooltip("tipoPeticao", "Tipo de Petição")}
            <select 
              id="tipoPeticao" 
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            {renderTooltip("modalidade", "Modalidade")}
            <input 
              type="text" 
              id="modalidade"
              value={modalidade} 
              onChange={(e) => setModalidade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            {renderTooltip("objeto", "Objeto")}
            <input 
              type="text"
              id="objeto"
              value={objeto}
              onChange={(e) => setObjeto(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          {renderTooltip("motivo", "Motivo da Petição")}
          <input 
            type="text" 
            id="motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          {renderTooltip("descricao", `Descrição dos Fatos (máx. ${MAX_DESCRIPTION_LENGTH} caracteres)`)}
          <textarea 
            id="descricao" 
            rows={4}
            value={description}
            onChange={handleDescriptionChange}
            className={`w-full px-4 py-2 border ${description.length > MAX_DESCRIPTION_LENGTH ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          ></textarea>
          <div className="flex justify-between mt-1 text-sm">
            <div className={`${getCharCountClass()}`}>
              {description.length}/{MAX_DESCRIPTION_LENGTH} caracteres
              {description.length > MAX_DESCRIPTION_LENGTH && 
                <span className="ml-1 font-bold text-red-600">
                  (Excedeu o limite)
                </span>
              }
            </div>
            <div className="text-gray-500 italic">
              Recomendação: Seja conciso para evitar timeouts
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            {renderTooltip("autoridade", "Autoridade Competente")}
            <input 
              type="text" 
              id="autoridade"
              value={autoridade} 
              onChange={(e) => setAutoridade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            {renderTooltip("contraparte", tipoPeticao === "contrarrazoes" ? "Contraparte *" : "Contraparte (opcional)")}
            <input 
              type="text" 
              id="contraparte"
              value={contraparte}
              onChange={(e) => setContraparte(e.target.value)}
              className={`w-full px-4 py-2 border ${tipoPeticao === "contrarrazoes" ? "border-blue-300" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
              showInfo("Formulário limpo");
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