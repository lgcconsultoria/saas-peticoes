import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons"

interface PreviewPetitionProps {
  processNumber: string;
  entity: string;
  reason: string;
  description: string;
  argumentsText: string;
  request: string;
  content: string;
  onDownload: () => void;
  isLoading: boolean;
}

export default function PreviewPetition({ 
  processNumber, 
  entity, 
  reason, 
  description, 
  argumentsText, 
  request,
  content,
  onDownload,
  isLoading
}: PreviewPetitionProps) {
  return (
    <div id="previa-peticao" className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Prévia da Petição
        </h3>
        <div className="flex space-x-3">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center cursor-pointer disabled:bg-blue-400"
            onClick={onDownload}
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faDownload} width={16} height={16} className="mr-2" /> 
            {isLoading ? "Processando..." : "Download"}
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-md p-6 bg-gray-50 min-h-[400px] whitespace-pre-wrap">
        {content ? (
          <div className="prose max-w-none">
            {content}
          </div>
        ) : (
          <div>
            <p><strong>Número do Processo:</strong> {processNumber}</p>
            <p><strong>Órgão/Entidade:</strong> {entity}</p>
            <p><strong>Motivo:</strong> {reason}</p>
            <p><strong>Descrição dos Fatos:</strong> {description}</p>
            <p><strong>Argumentos Jurídicos:</strong> {argumentsText}</p>
            <p><strong>Pedido:</strong> {request}</p>
          </div>
        )}
      </div>
    </div>
  );
}
