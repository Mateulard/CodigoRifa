import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [rifas, setRifas] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchNumber, setSearchNumber] = useState('');
  const [winnerInfo, setWinnerInfo] = useState(null);

  useEffect(() => {
    const fetchRifas = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:4000/rifas');
        setRifas(response.data);
        console.log('Rifas fetched:', response.data); // Add this line
      } catch (error) {
        console.error('Error fetching rifas:', error);
        setError('Error al obtener las rifas. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchRifas();
  }, []);

  const handleSelectRifa = (rifa) => {
    console.log('Selected rifa:', rifa); // Add this line
    console.log('Rifa numbers:', rifa.numeros);
    console.log('Type of rifa.numeros:', typeof rifa.numeros);
    setSelectedRifa(rifa);
    setWinnerInfo(null); // Clear winner info when selecting a new rifa
    setSearchNumber(''); // Clear search number when selecting a new rifa
  };

  const handleSearch = async () => {
    if (!selectedRifa || !searchNumber) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:4000/buscarGanador/${selectedRifa.id}/${searchNumber}`);
      setWinnerInfo(response.data);
    } catch (error) {
      console.error('Error al buscar ganador:', error);
      if (error.response && error.response.status === 404) {
        setError('Número no encontrado.');
      } else {
        setError('Error al buscar el ganador. Por favor, intente de nuevo.');
      }
      setWinnerInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <select
        value={selectedRifa ? selectedRifa.id : ''}
        onChange={(e) => {
          const selectedRifaId = parseInt(e.target.value, 10);
          const rifa = rifas.find((rifa) => rifa.id === selectedRifaId);
          handleSelectRifa(rifa);
        }}
      >
        <option value="">Selecciona una rifa</option>
        {rifas.map((rifa) => (
          <option key={rifa.id} value={rifa.id}>
            {rifa.nombre}
          </option>
        ))}
      </select>

      {selectedRifa && (
        <div>
          <h3 className="text-lg font-semibold mt-4 mb-2">Números de la Rifa</h3>
          {console.log('Rendering rifa numbers:', selectedRifa.numeros)}
          {Array.isArray(selectedRifa.numeros) && selectedRifa.numeros.length > 0 ? (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">Número</th>
                  <th className="border border-gray-300 px-4 py-2">Comprador</th>
                  <th className="border border-gray-300 px-4 py-2">Cuotas Pagadas</th>
                </tr>
              </thead>
              <tbody>
                {selectedRifa.numeros.map((numero) => (
                  <tr key={numero.id || numero}>
                    <td className="border border-gray-300 px-4 py-2">{numero.numero || numero}</td>
                    <td className="border border-gray-300 px-4 py-2">{numero.comprador || 'N/A'}</td>
                    <td className="border border-gray-300 px-4 py-2">{numero.cuotas_pagadas || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>
              <p>No hay números disponibles para esta rifa.</p>
              <p>Tipo de selectedRifa.numeros: {typeof selectedRifa.numeros}</p>
              <p>Valor de selectedRifa.numeros: {JSON.stringify(selectedRifa.numeros)}</p>
            </div>
          )}
        </div>
      )}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Buscar Ganador</h3>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            placeholder="Número de rifa"
            className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          <button
            onClick={handleSearch}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading || !selectedRifa}
          >
            Buscar
          </button>
        </div>
        {winnerInfo && (
          <div className="mt-4 p-4 border rounded">
            <h4 className="font-semibold">Información del Ganador:</h4>
            <p>Nombre: {winnerInfo.nombre_comprador || 'No disponible'}</p>
            <p>Número: {winnerInfo.numero}</p>
            <p>Cuotas pagadas: {winnerInfo.cuotas_pagadas ? JSON.parse(winnerInfo.cuotas_pagadas).filter(Boolean).length : 0}</p>
            <p>Vendedor: {winnerInfo.vendedor_nombre || 'No asignado'}</p>
            <p>Cobrador: {winnerInfo.cobrador_nombre || 'No asignado'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

