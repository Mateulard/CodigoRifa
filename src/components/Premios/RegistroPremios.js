import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function RegistroPremios() {
  const [rifas, setRifas] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [premios, setPremios] = useState({
    diarios: [],
    semanales: [],
    presemanales: [],
    premensuales: [],
    mensuales: [],
    extra: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [searchNumber, setSearchNumber] = useState('');
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [showSearchSection, setShowSearchSection] = useState(false);

  useEffect(() => {
    fetchRifas();
  }, []);

  const fetchRifas = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4000/rifas');
      setRifas(response.data);
    } catch (error) {
      console.error('Error al obtener rifas:', error);
      setError('Error al cargar las rifas. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPremios = async () => {
    if (!selectedRifa) return;

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:4000/premios/${selectedRifa.id}`, {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      
      // Separate prizes by type
      const separatedPremios = {
        diarios: [],
        semanales: [],
        presemanales: [],
        premensuales: [],
        mensuales: [],
        extra: []
      };

      response.data.forEach(premio => {
        switch(premio.tipo) {
          case 'diario':
            separatedPremios.diarios.push(premio);
            break;
          case 'semanal':
            separatedPremios.semanales.push(premio);
            break;
          case 'presemanal':
            separatedPremios.presemanales.push(premio);
            break;
          case 'premensual':
            separatedPremios.premensuales.push(premio);
            break;
          case 'mensual':
            separatedPremios.mensuales.push(premio);
            break;
          case 'extra':
            separatedPremios.extra.push(premio);
            break;
          default:
            console.warn(`Tipo de premio desconocido: ${premio.tipo}`);
        }
      });

      setPremios(separatedPremios);
    } catch (error) {
      console.error('Error al obtener premios:', error);
      setError('Error al cargar los premios. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRifa = (rifaId) => {
    const rifa = rifas.find((r) => r.id === parseInt(rifaId));
    setSelectedRifa(rifa || null);
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

  const renderPremiosTable = (premiosList, title) => (
    premiosList.length > 0 && (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Fecha</th>
              <th className="border border-gray-300 px-4 py-2">Orden</th>
              <th className="border border-gray-300 px-4 py-2">Número Ganador</th>
              <th className="border border-gray-300 px-4 py-2">Premio</th>
            </tr>
          </thead>
          <tbody>
            {premiosList.map((premio) => (
              <tr key={premio.id}>
                <td className="border border-gray-300 px-4 py-2">{premio.fecha}</td>
                <td className="border border-gray-300 px-4 py-2">{premio.orden}</td>
                <td className="border border-gray-300 px-4 py-2">{premio.numero_ganador}</td>
                <td className="border border-gray-300 px-4 py-2">{premio.premio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  const getCuotasPagadas = (cuotas_pagadas) => {
    if (!cuotas_pagadas) return 0;
    
    try {
      const parsedCuotas = typeof cuotas_pagadas === 'string' 
        ? JSON.parse(cuotas_pagadas) 
        : cuotas_pagadas;

      if (typeof parsedCuotas === 'object' && parsedCuotas !== null) {
        return Object.values(parsedCuotas).filter(Boolean).length;
      }
      
      return 0;
    } catch (error) {
      console.error('Error parsing cuotas_pagadas:', error);
      return 0;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Registro de Premios y Ganadores</h2>
      
      <div className="mb-4">
        <select 
          className="form-select mb-2 w-full p-2 border rounded" 
          onChange={(e) => handleSelectRifa(e.target.value)} 
          disabled={loading}
          value={selectedRifa ? selectedRifa.id : ''}
        >
          <option value="">Selecciona una rifa</option>
          {rifas.map((rifa) => (
            <option key={rifa.id} value={rifa.id}>{rifa.nombre}</option>
          ))}
        </select>

        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de inicio</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de fin</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>

        <button 
          onClick={fetchPremios}
          className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading || !selectedRifa}
        >
          Buscar Premios
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">{error}</div>}

      {renderPremiosTable(premios.diarios, "Premios Diarios")}
      {renderPremiosTable(premios.semanales, "Premios Semanales")}
      {renderPremiosTable(premios.presemanales, "Premios Pre-semanales")}
      {renderPremiosTable(premios.premensuales, "Premios Pre-mensuales")}
      {renderPremiosTable(premios.mensuales, "Premios Mensuales")}
      {renderPremiosTable(premios.extra, "Premios Extra")}

      {!loading && Object.values(premios).every(arr => arr.length === 0) && (
        <p>No se encontraron premios para el período seleccionado.</p>
      )}

      <button
        onClick={() => setShowSearchSection(!showSearchSection)}
        className="mt-8 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        {showSearchSection ? 'Ocultar Búsqueda de Premios' : 'Buscar Premios'}
      </button>

      {showSearchSection && (
        <div className="mt-4">
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
              <p>Cuotas pagadas: {getCuotasPagadas(winnerInfo.cuotas_pagadas)}</p>
              <p>Vendedor: {winnerInfo.vendedor_nombre || 'No asignado'}</p>
              <p>Cobrador: {winnerInfo.cobrador_nombre || 'No asignado'}</p>
              <p>Dirección: {winnerInfo.direccion || 'No disponible'}</p>
              <p>Barrio: {winnerInfo.barrio || 'No disponible'}</p>
              <p>Localidad: {winnerInfo.localidad || 'No disponible'}</p>
              <p>Teléfono: {winnerInfo.telefono || 'No disponible'}</p>
              <p>Email: {winnerInfo.mail || 'No disponible'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

