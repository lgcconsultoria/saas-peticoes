"use client"

import { useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faEdit, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

interface PetitionListProps {
  peticoes: Petition[];
}

export default function PetitionList({ peticoes }: PetitionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const router = useRouter();

  // Filtrar petições pelo número do processo
  const filteredPeticoes = peticoes.filter(peticao => 
    peticao.processNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para formatar a data
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Função para baixar a petição
  const handleDownload = async (peticaoId: number, content: string) => {
    setIsDownloading(peticaoId);
    
    try {
      // Chamar a API para gerar o documento DOCX
      const response = await fetch('/api/peticoes/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          peticaoId,
          content
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
      alert("Erro ao baixar o documento. Tente novamente.");
    } finally {
      setIsDownloading(null);
    }
  };

  // Função para editar a petição
  const handleEdit = (peticao: Petition) => {
    // Armazenar os dados da petição no localStorage para recuperar na página de edição
    localStorage.setItem('editPeticao', JSON.stringify(peticao));
    router.push(`/editar-peticao/${peticao.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="mb-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar por número do processo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} width={16} height={16} className="text-gray-400" />
          </div>
        </div>
      </div>

      {filteredPeticoes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "Nenhuma petição encontrada com esse número de processo." : "Você ainda não criou nenhuma petição."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Órgão/Entidade
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPeticoes.map((peticao) => (
                <tr key={peticao.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {peticao.processNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {peticao.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {peticao.entity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(peticao.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(peticao)}
                      className="text-blue-600 hover:text-blue-900 mr-4 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faEdit} width={16} height={16} className="mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDownload(peticao.id, peticao.arguments)}
                      disabled={isDownloading === peticao.id}
                      className="text-green-600 hover:text-green-900 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faDownload} width={16} height={16} className="mr-1" />
                      {isDownloading === peticao.id ? "Baixando..." : "Download"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 