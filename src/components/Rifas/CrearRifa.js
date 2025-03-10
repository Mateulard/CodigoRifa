'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './crear-rifa.css';

const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

const tiposPremios = [
  { value: 'diario', label: 'Estímulos Diarios' },
  { value: 'pre-semanal', label: 'Estímulos Pre-semanales' },
  { value: 'semanal', label: 'Estímulos Semanales' },
  { value: 'pre-mensual', label: 'Estímulos Pre-mensuales' },
  { value: 'mensual', label: 'Estímulos Mensuales' },
  { value: 'final', label: 'Premios Finales' },
  { value: 'especial', label: 'Premios Especiales' },
]

export default function CrearRifaMultipasos() {
  const [paso, setPaso] = useState(1)
  const [formData, setFormData] = useState({
    nombre: '',
    organizacion_id: '', // Changed from organizacionId to organizacion_id
    rangoInicio: '',
    rangoFin: '',
    crearBonos: false,
    cantidadBonos: '',
    cuotas: '',
    valorCuota: '',
    mesInicio: '',
    tiposPremios: {},
  })
  const [organizaciones, setOrganizaciones] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchOrganizaciones()
  }, [])

  const fetchOrganizaciones = async () => {
    try {
      const response = await axios.get('http://localhost:4000/organizaciones')
      setOrganizaciones(response.data)
    } catch (error) {
      console.error('Error al cargar las organizaciones:', error)
      setError('Error al cargar las organizaciones. Por favor, intente nuevamente.')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleTipoPremioChange = (tipo, cantidad) => {
    setFormData(prevState => ({
      ...prevState,
      tiposPremios: {
        ...prevState.tiposPremios,
        [tipo]: cantidad ? parseInt(cantidad, 10) : 0
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setIsLoading(true)

    try {
      const response = await axios.post('http://localhost:4000/crearRifa', formData)
      setMessage('Rifa creada exitosamente')
      // Reiniciar el formulario y volver al primer paso
      setFormData({
        nombre: '',
        organizacion_id: '',
        rangoInicio: '',
        rangoFin: '',
        crearBonos: false,
        cantidadBonos: '',
        cuotas: '',
        valorCuota: '',
        mesInicio: '',
        tiposPremios: {},
      })
      setPaso(1)
    } catch (error) {
      console.error('Error al crear la rifa:', error)
      setError('Error al crear la rifa. Por favor, intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const siguientePaso = () => {
    setPaso(paso + 1)
  }

  const pasoAnterior = () => {
    setPaso(paso - 1)
  }

  const renderPaso1 = () => (
    <div>
      <div className="form-group">
        <label htmlFor="nombre">Nombre de la Rifa</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
      </div>
  
      <div className="form-group">
        <label htmlFor="organizacion_id">Organización</label>
        <select
          id="organizacion_id"
          name="organizacion_id"
          value={formData.organizacion_id}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona una organización</option>
          {organizaciones.map((org) => (
            <option key={org.id} value={org.id}>
              {org.nombre}
            </option>
          ))}
        </select>
      </div>
  
      <div className="form-group">
        <label htmlFor="rangoInicio">Número Inicial</label>
        <input
          type="number"
          id="rangoInicio"
          name="rangoInicio"
          value={formData.rangoInicio}
          onChange={handleChange}
          required
        />
      </div>
  
      <div className="form-group">
        <label htmlFor="rangoFin">Número Final</label>
        <input
          type="number"
          id="rangoFin"
          name="rangoFin"
          value={formData.rangoFin}
          onChange={handleChange}
          required
        />
      </div>
  
      {/* Checkbox de Crear Bonos */}
      <div className="form-checkbox">
        <input
          type="checkbox"
          id="crearBonos"
          name="crearBonos"
          checked={formData.crearBonos}
          onChange={handleChange}
        />
        <label htmlFor="crearBonos">Crear Bonos</label>
      </div>
  
      {formData.crearBonos && (
        <div className="form-group">
          <label htmlFor="cantidadBonos">Cantidad de Bonos</label>
          <input
            type="number"
            id="cantidadBonos"
            name="cantidadBonos"
            value={formData.cantidadBonos}
            onChange={handleChange}
            required
          />
        </div>
      )}
  
      <div className="form-group">
        <label htmlFor="cuotas">Número de Cuotas (máximo 12)</label>
        <input
          type="number"
          id="cuotas"
          name="cuotas"
          value={formData.cuotas}
          onChange={handleChange}
          min="1"
          max="12"
          required
        />
      </div>
  
      <div className="form-group">
        <label htmlFor="valorCuota">Valor de la Cuota</label>
        <input
          type="number"
          id="valorCuota"
          name="valorCuota"
          value={formData.valorCuota}
          onChange={handleChange}
          required
        />
      </div>
  
      <button className="button button-primary" type="button" onClick={siguientePaso}>
        Siguiente
      </button>
    </div>
  );
  
  

  const renderPaso2 = () => (
    <div>
      <div className="form-group">
        <label htmlFor="mesInicio">Mes de Inicio</label>
        <select
          id="mesInicio"
          name="mesInicio"
          value={formData.mesInicio}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona un mes</option>
          {meses.map((mes, index) => (
            <option key={index} value={index}>
              {mes}
            </option>
          ))}
        </select>
      </div>
  
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="button button-secondary" type="button" onClick={pasoAnterior}>
          Anterior
        </button>
        <button className="button button-primary" type="button" onClick={siguientePaso}>
          Siguiente
        </button>
      </div>
    </div>
  );
  

  const renderPaso3 = () => (
    <div>
      <div className="form-group">
        <p>Tipos de Premios</p>
        {tiposPremios.map((tipo) => (
          <div key={tipo.value} className="form-checkbox">
            {/* Checkbox con diseño personalizado */}
            <input
              type="checkbox"
              id={tipo.value}
              checked={formData.tiposPremios[tipo.value] > 0}
              onChange={(e) => handleTipoPremioChange(tipo.value, e.target.checked ? 1 : 0)}
            />
            <label htmlFor={tipo.value}>{tipo.label}</label>
  
            {/* Campo numérico */}
            {formData.tiposPremios[tipo.value] > 0 && (
              <input
                className="form-input"
                type="number"
                value={formData.tiposPremios[tipo.value]}
                onChange={(e) => handleTipoPremioChange(tipo.value, e.target.value)}
                min="1"
                required
              />
            )}
          </div>
        ))}
      </div>
  
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="button button-secondary" type="button" onClick={pasoAnterior}>
          Anterior
        </button>
        <button className="button button-primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Creando...' : 'Crear Rifa'}
        </button>
      </div>
    </div>
  );
  
  
  

  return (
    <div className="crear-rifa-container">
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Crear Nueva Rifa</h1>
      {message && (
        <div
          style={{
            backgroundColor: '#e6ffe6',
            border: '1px solid #4CAF50',
            color: '#4CAF50',
            padding: '10px',
            marginBottom: '20px',
          }}
        >
          {message}
        </div>
      )}
      {error && (
        <div
          style={{
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            color: '#f44336',
            padding: '10px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div
            style={{
              height: '4px',
              width: '32%',
              backgroundColor: paso >= 1 ? '#2196F3' : '#e0e0e0',
            }}
          ></div>
          <div
            style={{
              height: '4px',
              width: '32%',
              backgroundColor: paso >= 2 ? '#2196F3' : '#e0e0e0',
            }}
          ></div>
          <div
            style={{
              height: '4px',
              width: '32%',
              backgroundColor: paso >= 3 ? '#2196F3' : '#e0e0e0',
            }}
          ></div>
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {paso === 1 && renderPaso1()}
        {paso === 2 && renderPaso2()}
        {paso === 3 && renderPaso3()}
      </form>
    </div>
  );
}

