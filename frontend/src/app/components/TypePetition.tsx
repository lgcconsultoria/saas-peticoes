'use client';

import React from 'react';

export default function TypePetition() {
  return (
    <>
      <h3 className="text-lg font-medium text-gray-700 mb-4">Escolha um tipo de petição</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div 
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-t-4 border-blue-600 cursor-pointer"
        >
          <div className="text-blue-600 mb-3">
            <i className="fas fa-gavel text-3xl"></i>
          </div>
          <h4 className="text-lg font-semibold mb-2">Recurso Administrativo</h4>
          <p className="text-gray-600 text-sm">Conteste decisões administrativas com argumentos sólidos.</p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-t-4 border-green-600 cursor-pointer"
        >
          <div className="text-green-600 mb-3">
            <i className="fas fa-chart-line text-3xl"></i>
          </div>
          <h4 className="text-lg font-semibold mb-2">Pedido de Reajustamento</h4>
          <p className="text-gray-600 text-sm">Solicite reajustes contratuais baseados em índices oficiais.</p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-t-4 border-purple-600 cursor-pointer"
        >
          <div className="text-purple-600 mb-3">
            <i className="fas fa-balance-scale text-3xl"></i>
          </div>
          <h4 className="text-lg font-semibold mb-2">Contrarrazões</h4>
          <p className="text-gray-600 text-sm">Responda a recursos de terceiros com argumentos técnicos.</p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-t-4 border-red-600 cursor-pointer"
        >
          <div className="text-red-600 mb-3">
            <i className="fas fa-shield-alt text-3xl"></i>
          </div>
          <h4 className="text-lg font-semibold mb-2">Defesa de Sanções</h4>
          <p className="text-gray-600 text-sm">Elabore defesas contra penalidades administrativas.</p>
        </div>
      </div>
    </>
  );
}