import React, { useState, useEffect } from 'react';
import axios from 'axios';

const prizeCategories = [
  { value: 'diario', label: 'Estímulos Diarios' },
  { value: 'pre-semanal', label: 'Estímulos Pre-semanales' },
  { value: 'semanal', label: 'Estímulos Semanales' },
  { value: 'pre-mensual', label: 'Estímulos Pre-mensuales' },
  { value: 'mensual', label: 'Estímulos Mensuales' },
  { value: 'final', label: 'Premios Finales' },
  { value: 'especial', label: 'Premios Especiales' },
];

export default function RafflePrizes() {
  const [rifas, setRifas] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [viewMode, setViewMode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('diario');
  const [premios, setPremios] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRifas();
  }, []);

  useEffect(() => {
    if (selectedRifa) {
      fetchPremios(selectedRifa.id);
    }
  }, [selectedRifa]);

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

  const fetchPremios = async (rifaId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:4000/premios/${rifaId}`);
      setPremios(response.data || {});
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

  const handlePremioChange = (index, field, value) => {
    const newPremios = { ...premios };
    if (!newPremios[selectedCategory]) {
      newPremios[selectedCategory] = Array(23).fill({ orden: '', favorecidos: '' });
    }
    newPremios[selectedCategory][index] = { ...newPremios[selectedCategory][index], [field]: value };
    setPremios(newPremios);
  };

  const handleGuardarPremios = async () => {
    if (selectedRifa) {
      try {
        setLoading(true);
        const response = await axios.post('http://localhost:4000/guardarPremios', {
          rifaId: selectedRifa.id,
          premios: premios
        });
        if (response.status === 200) {
          alert('Premios guardados exitosamente');
          // Refetch premios to ensure we have the latest data
          await fetchPremios(selectedRifa.id);
        }
      } catch (error) {
        console.error('Error al guardar premios:', error);
        setError(`Error al guardar los premios: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderPremiosTable = (categoryPremios) => {
    return (
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-green-500 text-white">
            <th className="border border-gray-300 px-4 py-2">ORDEN</th>
            <th className="border border-gray-300 px-4 py-2">Nº FAVORECIDOS</th>
            <th className="border border-gray-300 px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {(categoryPremios || []).map((premio, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
              <td className="border border-gray-300 px-4 py-2">{index < 20 ? index + 1 : ''}</td>
              <td className="border border-gray-300 px-4 py-2">
                {viewMode === 'view' ? premio.favorecidos : (
                  <input
                    className="w-full p-1 border rounded"
                    value={premio.favorecidos || ''}
                    onChange={(e) => handlePremioChange(index, 'favorecidos', e.target.value)}
                  />
                )}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {index === 20 && '3 CIFRAS 1º ESTIMULO'}
                {index === 21 && '2 CIFRAS'}
                {index === 22 && '1º ESTIMULO'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Premios de Rifas</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">{error}</div>}

      <div className="card mb-4">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Seleccionar Rifa</h2>
        </div>
        <div className="card-body">
          <select 
            className="form-select mb-4 w-full p-2 border rounded" 
            onChange={(e) => handleSelectRifa(e.target.value)} 
            disabled={loading}
            value={selectedRifa ? selectedRifa.id : ''}
          >
            <option value="">Selecciona una rifa</option>
            {rifas.map((rifa) => (
              <option key={rifa.id} value={rifa.id}>
                {rifa.nombre}
              </option>
            ))}
          </select>
          {selectedRifa && (
            <div className="flex justify-center space-x-4">
              <button className="btn btn-primary bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => setViewMode('view')} disabled={loading}>Ver Premios</button>
              <button className="btn btn-secondary bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" onClick={() => setViewMode('load')} disabled={loading}>Cargar Premios</button>
            </div>
          )}
        </div>
      </div>

      {selectedRifa && (viewMode === 'view' || viewMode === 'load') && (
        <div className="card mb-4">
          <div className="card-header">
            <h2 className="text-xl font-semibold">
              {viewMode === 'view' ? 'Ver' : 'Cargar'} Premios de {selectedRifa.nombre}
            </h2>
          </div>
          <div className="card-body">
            <select 
              className="form-select mb-4 w-full p-2 border rounded" 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={loading}
            >
              {prizeCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {renderPremiosTable(premios[selectedCategory] || Array(23).fill({ orden: '', favorecidos: '' }))}
            {viewMode === 'load' && (
              <button 
                className="btn btn-primary w-full mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" 
                onClick={handleGuardarPremios}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Premios'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}