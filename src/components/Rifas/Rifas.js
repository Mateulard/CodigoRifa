import React, { useState } from 'react';
import CrearRifa from './CrearRifa';
import VerRifas from './VerRifas';
import './Rifas.css';

export default function Rifas() {
  const [activeTab, setActiveTab] = useState('ver');

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Gestión de Rifas</h1>
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'ver' ? 'active' : ''}`}
            onClick={() => setActiveTab('ver')}
          >
            Ver Rifas
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'crear' ? 'active' : ''}`}
            onClick={() => setActiveTab('crear')}
          >
            Crear Rifa
          </button>
        </li>
      </ul>
      {activeTab === 'crear' && <CrearRifa />}
      {activeTab === 'ver' && <VerRifas />}
    </div>
  );
}