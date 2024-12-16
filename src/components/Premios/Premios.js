import React, { useState } from 'react';
import VerPremios from './VerPremios';
import CargarPremios from './CargarPremios';
import RegistroPremios from './RegistroPremios';

export default function Premios() {
  const [activeTab, setActiveTab] = useState('ver');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Premios de Rifas</h1>
      
      <div className="mb-4">
        <button
          className={`mr-2 px-4 py-2 rounded ${activeTab === 'ver' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('ver')}
        >
          Ver Premios
        </button>
        <button
          className={`mr-2 px-4 py-2 rounded ${activeTab === 'cargar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('cargar')}
        >
          Cargar Premios
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'registro' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('registro')}
        >
          Registro de Premios
        </button>
      </div>

      {activeTab === 'ver' && <VerPremios />}
      {activeTab === 'cargar' && <CargarPremios />}
      {activeTab === 'registro' && <RegistroPremios />}
    </div>
  );
}

