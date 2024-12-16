import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function CargarPremios() {
  const [rifas, setRifas] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [tiposPremios, setTiposPremios] = useState({});
  const [selectedTipoPremio, setSelectedTipoPremio] = useState('');
  const [premios, setPremios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allPremios, setAllPremios] = useState([]);

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

  const handleSelectRifa = (rifaId) => {
    const rifa = rifas.find((r) => r.id === parseInt(rifaId));
    setSelectedRifa(rifa || null);
    if (rifa) {
      try {
        const tiposPremiosData = JSON.parse(rifa.tiposPremios || '{}');
        setTiposPremios(tiposPremiosData);
        setSelectedTipoPremio('');
        setPremios([]);
        fetchAllPremios(); // Add this line
      } catch (error) {
        console.error('Error parsing tiposPremios:', error);
        setError('Error al procesar los tipos de premios. Por favor, verifica la configuración de la rifa.');
        setTiposPremios({});
      }
    }
  };

  const handleSelectTipoPremio = (tipo) => {
    setSelectedTipoPremio(tipo);
    const cantidad = tiposPremios[tipo] || 0;
    const nuevoPremios = Array(cantidad).fill().map((_, index) => ({
      tipo,
      orden: index + 1,
      numeroGanador: '',
      premio: ''
    }));
    setPremios(nuevoPremios);
  };

  const handlePremioChange = (index, field, value) => {
    const newPremios = [...premios];
    newPremios[index] = { ...newPremios[index], [field]: value };
    setPremios(newPremios);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRifa || !selectedTipoPremio) return;

    try {
      setLoading(true);
      const premiosConFecha = premios.map(premio => ({
        ...premio,
        fecha: selectedDate.toISOString().split('T')[0],
        rifaId: selectedRifa.id,
        tipo: selectedTipoPremio
      }));
      await axios.post('http://localhost:4000/guardarPremios', { 
        rifaId: selectedRifa.id,
        premios: premiosConFecha 
      });
      alert('Premios guardados exitosamente');
      // Limpiar el formulario después de guardar
      setPremios([]);
      setSelectedTipoPremio('');
    } catch (error) {
      console.error('Error al guardar premios:', error);
      setError('Error al guardar los premios. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPremios = async () => {
    if (!selectedRifa) return;
    try {
      const response = await axios.get(`http://localhost:4000/premios/${selectedRifa.id}`);
      setAllPremios(response.data);
    } catch (error) {
      console.error('Error al obtener premios:', error);
      setError('Error al cargar los premios. Por favor, intente de nuevo.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Cargar Premios</h2>
      
      <select 
        className="form-select mb-4 w-full p-2 border rounded" 
        onChange={(e) => handleSelectRifa(e.target.value)} 
        disabled={loading}
        value={selectedRifa ? selectedRifa.id : ''}
      >
        <option value="">Selecciona una rifa</option>
        {rifas.map((rifa) => (
          <option key={rifa.id} value={rifa.id}>{rifa.nombre}</option>
        ))}
      </select>

      {selectedRifa && (
        <select 
          className="form-select mb-4 w-full p-2 border rounded" 
          onChange={(e) => handleSelectTipoPremio(e.target.value)} 
          disabled={loading}
          value={selectedTipoPremio}
        >
          <option value="">Selecciona un tipo de premio</option>
          {Object.entries(tiposPremios).map(([tipo, cantidad]) => (
            <option key={tipo} value={tipo}>{`${tipo} (${cantidad})`}</option>
          ))}
        </select>
      )}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">{error}</div>}

      {selectedRifa && selectedTipoPremio && (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Fecha de los premios</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Orden</th>
                <th className="border border-gray-300 px-4 py-2">Número Ganador</th>
                <th className="border border-gray-300 px-4 py-2">Premio</th>
              </tr>
            </thead>
            <tbody>
              {premios.map((premio, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">{premio.orden}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      value={premio.numeroGanador}
                      onChange={(e) => handlePremioChange(index, 'numeroGanador', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="text"
                      value={premio.premio}
                      onChange={(e) => handlePremioChange(index, 'premio', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Premios'}
          </button>
        </form>
      )}
      {allPremios.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Premios Guardados</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Fecha</th>
                <th className="border border-gray-300 px-4 py-2">Tipo</th>
                <th className="border border-gray-300 px-4 py-2">Orden</th>
                <th className="border border-gray-300 px-4 py-2">Número Ganador</th>
                <th className="border border-gray-300 px-4 py-2">Premio</th>
              </tr>
            </thead>
            <tbody>
              {allPremios.map((premio, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">{premio.fecha}</td>
                  <td className="border border-gray-300 px-4 py-2">{premio.tipo}</td>
                  <td className="border border-gray-300 px-4 py-2">{premio.orden}</td>
                  <td className="border border-gray-300 px-4 py-2">{premio.numeroGanador}</td>
                  <td className="border border-gray-300 px-4 py-2">{premio.premio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

