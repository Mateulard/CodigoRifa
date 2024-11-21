import React, { useState, useEffect } from 'react';
import axios from 'axios';

const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export default function CrearRifa() {
  const [nombre, setNombre] = useState('');
  const [organizacionId, setOrganizacionId] = useState('');
  const [rangoInicio, setRangoInicio] = useState('');
  const [rangoFin, setRangoFin] = useState('');
  const [crearBonos, setCrearBonos] = useState(false);
  const [cantidadBonos, setCantidadBonos] = useState('');
  const [cuotas, setCuotas] = useState('');
  const [valorCuota, setValorCuota] = useState('');
  const [mesInicio, setMesInicio] = useState('');
  const [organizaciones, setOrganizaciones] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOrganizaciones();
  }, []);

  const fetchOrganizaciones = async () => {
    try {
      const response = await axios.get('http://localhost:4000/organizaciones');
      setOrganizaciones(response.data);
    } catch (error) {
      console.error('Error fetching organizaciones:', error);
      setError('Error al cargar las organizaciones. Por favor, intente nuevamente.');
    }
  };

  const validateForm = () => {
    if (!nombre.trim()) return 'El nombre de la rifa es requerido.';
    if (!organizacionId) return 'Debe seleccionar una organización.';
    if (isNaN(parseInt(rangoInicio)) || isNaN(parseInt(rangoFin))) return 'Los rangos deben ser números válidos.';
    if (parseInt(rangoInicio) >= parseInt(rangoFin)) return 'El rango final debe ser mayor que el rango inicial.';
    if (crearBonos && (!cantidadBonos || parseInt(cantidadBonos) <= 0)) return 'La cantidad de bonos debe ser un número positivo.';
    if (!cuotas || parseInt(cuotas) < 1 || parseInt(cuotas) > 12) return 'El número de cuotas debe estar entre 1 y 12.';
    if (!valorCuota || parseFloat(valorCuota) <= 0) return 'El valor de la cuota debe ser mayor que cero.';
    if (!mesInicio) return 'Debe seleccionar un mes de inicio.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:4000/crearRifa', {
        nombre,
        organizacion_id: parseInt(organizacionId),
        rangoInicio: parseInt(rangoInicio),
        rangoFin: parseInt(rangoFin),
        numeros: parseInt(rangoFin) - parseInt(rangoInicio) + 1,
        crearBonos,
        cantidadBonos: crearBonos ? parseInt(cantidadBonos) : null,
        cuotas: parseInt(cuotas),
        valorCuota: parseFloat(valorCuota),
        mesInicio: parseInt(mesInicio)
      });

      setMessage('Rifa creada exitosamente');
      resetForm();
    } catch (error) {
      console.error('Error creating rifa:', error);
      setError('Error al crear la rifa. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNombre('');
    setOrganizacionId('');
    setRangoInicio('');
    setRangoFin('');
    setCrearBonos(false);
    setCantidadBonos('');
    setCuotas('');
    setValorCuota('');
    setMesInicio('');
  };

  return (
    <div className="container mt-5">
      <h2>Crear Nueva Rifa</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="nombre" className="form-label">Nombre de la Rifa</label>
          <input
            type="text"
            className="form-control"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="organizacion" className="form-label">Organización</label>
          <select
            className="form-control"
            id="organizacion"
            value={organizacionId}
            onChange={(e) => setOrganizacionId(e.target.value)}
            required
          >
            <option value="">Selecciona una organización</option>
            {organizaciones.map(org => (
              <option key={org.id} value={org.id}>{org.nombre}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="rangoInicio" className="form-label">Número Inicial</label>
          <input
            type="number"
            className="form-control"
            id="rangoInicio"
            value={rangoInicio}
            onChange={(e) => setRangoInicio(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="rangoFin" className="form-label">Número Final</label>
          <input
            type="number"
            className="form-control"
            id="rangoFin"
            value={rangoFin}
            onChange={(e) => setRangoFin(e.target.value)}
            required
          />
        </div>
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="crearBonos"
            checked={crearBonos}
            onChange={(e) => setCrearBonos(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="crearBonos">Crear Bonos</label>
        </div>
        {crearBonos && (
          <div className="mb-3">
            <label htmlFor="cantidadBonos" className="form-label">Cantidad de Bonos</label>
            <input
              type="number"
              className="form-control"
              id="cantidadBonos"
              value={cantidadBonos}
              onChange={(e) => setCantidadBonos(e.target.value)}
              required
            />
          </div>
        )}
        <div className="mb-3">
          <label htmlFor="cuotas" className="form-label">Número de Cuotas (máximo 12)</label>
          <input
            type="number"
            className="form-control"
            id="cuotas"
            value={cuotas}
            onChange={(e) => setCuotas(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)).toString())}
            min="1"
            max="12"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="valorCuota" className="form-label">Valor de la Cuota</label>
          <input
            type="number"
            className="form-control"
            id="valorCuota"
            value={valorCuota}
            onChange={(e) => setValorCuota(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="mesInicio" className="form-label">Mes de Inicio</label>
          <select
            className="form-control"
            id="mesInicio"
            value={mesInicio}
            onChange={(e) => setMesInicio(e.target.value)}
            required
          >
            <option value="">Selecciona un mes</option>
            {meses.map((mes, index) => (
              <option key={index} value={index}>{mes}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creando...' : 'Crear Rifa'}
        </button>
      </form>
      {message && <div className="alert alert-success mt-3">{message}</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </div>
  );
}