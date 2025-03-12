"use client"

import { useState } from "react"
import { prisma } from "@/lib/prisma"

export default function NewPetition () {
  const [processNumber, setProcessNumber] = useState("");
  const [entity, setEntity] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [argumentsText, setArgumentsText] = useState("");
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const newPetition = await prisma.petition.create({
        data: {
          processNumber,
          type: "recurso",
          entity,
          reason,
          description,
          arguments: argumentsText,
          request,
          userId: 1,
        },
      });

      console.log("Petição criada com sucesso:", newPetition);
    } catch (error) {
      console.error("Erro ao salvar a petição:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="formulario-peticao" className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Nova Petição</h3>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="tipo-peticao" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Petição
          </label>
          <select 
            id="tipo-peticao" 
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Selecione um tipo</option>
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

        <div className="mb-6">
          <label htmlFor="argumentos" className="block text-sm font-medium text-gray-700 mb-2">
            Argumentos Jurídicos
          </label>
          <textarea 
            id="argumentos" 
            rows={4}
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
            rows={3}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-4">
          <button 
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
          >
            {loading ? "Salvando..." : "Gerar Petição"}
          </button>
        </div>
      </form>
    </div>
  );
}