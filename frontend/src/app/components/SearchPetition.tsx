'use client';

import React from 'react';

const SearchPetition: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="relative">
        <input 
          type="text" 
          placeholder="Buscar petições..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="fas fa-search text-gray-400"></i>
        </div>
      </div>
    </div>
  );
};

export default SearchPetition;