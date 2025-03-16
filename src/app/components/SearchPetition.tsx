"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

export default function SearchPetition() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.trim()) {
      // Redirecionar para a página de resultados de busca com o termo de busca
      router.push(`/minhas-peticoes?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="mb-8">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar petições por número do processo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} width={16} height={16} className="text-gray-400" />
          </div>
          <button 
            type="submit"
            className="absolute inset-y-0 right-0 px-4 text-blue-600 font-medium cursor-pointer"
          >
            Buscar
          </button>
        </div>
      </form>
    </div>
  );
}