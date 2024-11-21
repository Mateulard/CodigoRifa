import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Personas.css';
import Organizaciones from './Instituciones/Instituciones';
import Vendedores from './Vendedores/Vendedores';
import Cobradores from './Cobradores/Cobradores';

export default function Personas() {
  const [activeTab, setActiveTab] = useState('gestion');
  const [activeSubTab, setActiveSubTab] = useState('instituciones');
  const [showForm, setShowForm] = useState(false);
  const [employeeType, setEmployeeType] = useState('cobrador');
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [organizaciones, setOrganizaciones] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [expandedOrg, setExpandedOrg] = useState(null);

  useEffect(() => {
    fetchOrganizaciones();
  }, []);

  const fetchOrganizaciones = () => {
    axios.get('http://localhost:4000/organizaciones').then((response) => {
      setOrganizaciones(response.data);
    });
  };

  const renderTabContent = () => {
    if (activeTab === 'gestion') {
      return renderGestionContent();
    } else {
      return renderVisualizacionContent();
    }
  };

  const renderGestionContent = () => {
    switch (activeSubTab) {
      case 'instituciones':
        return <Organizaciones onEdit={handleEdit} onDelete={handleDelete} />;
      case 'cobradores':
        return <Cobradores onEdit={handleEdit} onDelete={handleDelete} />;
      case 'vendedores':
        return <Vendedores onEdit={handleEdit} onDelete={handleDelete} />;
      default:
        return <Organizaciones onEdit={handleEdit} onDelete={handleDelete} />;
    }
  };

  const renderVisualizacionContent = () => {
    return (
      <div>
        <h3>Personas por Institución</h3>
        {organizaciones.map((org) => (
          <div key={org.id} className="mb-4">
            <button 
              className="btn btn-primary w-100 text-left d-flex justify-content-between align-items-center" 
              onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
            >
              <span>{org.nombre}</span>
              <span>{expandedOrg === org.id ? '▲' : '▼'}</span>
            </button>
            {expandedOrg === org.id && (
              <div className="mt-3">
                <h5>Cobradores</h5>
                <Cobradores filter={{ organizacion_id: org.id }} hideActions={true} />
                <h5>Vendedores</h5>
                <Vendedores filter={{ organizacion_id: org.id }} hideActions={true} />
              </div>
            )}
          </div>
        ))}
        <h3>Personas sin Institución</h3>
        <h5>Cobradores</h5>
        <Cobradores filter={{ organizacion_id: 'null' }} hideActions={true} />
        <h5>Vendedores</h5>
        <Vendedores filter={{ organizacion_id: 'null' }} hideActions={true} />
      </div>
    );
  };

  const handleAddEmployee = (type) => {
    setEmployeeType(type);
    setShowForm(true);
    setEditingId(null);
    setFormData({});
  };

  const handleEdit = (type, data) => {
    setEmployeeType(type);
    setShowForm(true);
    setEditingId(data.id);
    setFormData(data);
  };

  const handleDelete = (type, id) => {
    const endpoint = type === 'cobrador'
      ? '/cobradores'
      : type === 'vendedor'
      ? '/vendedores'
      : '/organizaciones';

    axios.delete(`http://localhost:4000${endpoint}/${id}`)
      .then(() => {
        setMessage('Eliminado correctamente.');
        if (type === 'organizacion') {
          fetchOrganizaciones();
        }
      })
      .catch((error) => {
        setMessage('Error al eliminar. Inténtalo nuevamente.');
        console.error('Error al eliminar:', error);
      });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const endpoint = employeeType === 'cobrador'
      ? '/cobradores'
      : employeeType === 'vendedor'
      ? '/vendedores'
      : '/organizaciones';

    const method = editingId ? 'put' : 'post';
    const url = editingId 
      ? `http://localhost:4000${endpoint}/${editingId}`
      : `http://localhost:4000${endpoint}`;

    axios[method](url, formData)
      .then((response) => {
        setMessage(editingId ? 'Datos actualizados correctamente.' : 'Datos cargados correctamente.');
        setShowForm(false);
        e.target.reset();
        setEditingId(null);
        if (employeeType === 'organizacion') {
          fetchOrganizaciones();
        }
      })
      .catch((error) => {
        setMessage('Error al procesar los datos. Inténtalo nuevamente.');
        console.error('Error:', error);
      });
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Gestión de Personas</h1>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'gestion' ? 'active' : ''}`}
            onClick={() => setActiveTab('gestion')}
          >
            Gestión
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'visualizacion' ? 'active' : ''}`}
            onClick={() => setActiveTab('visualizacion')}
          >
            Visualización
          </button>
        </li>
      </ul>

      {activeTab === 'gestion' && (
        <ul className="nav nav-pills mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeSubTab === 'instituciones' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('instituciones')}
            >
              Instituciones
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeSubTab === 'cobradores' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('cobradores')}
            >
              Cobradores
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeSubTab === 'vendedores' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('vendedores')}
            >
              Vendedores
            </button>
          </li>
        </ul>
      )}

      <div className="tab-content mt-4">{renderTabContent()}</div>

      {activeTab === 'gestion' && (
        <div className="mt-4">
          <button onClick={() => handleAddEmployee('cobrador')} className="btn btn-primary me-2">
            Agregar Cobrador
          </button>
          <button onClick={() => handleAddEmployee('vendedor')} className="btn btn-primary me-2">
            Agregar Vendedor
          </button>
          <button onClick={() => handleAddEmployee('organizacion')} className="btn btn-primary">
            Agregar Institución
          </button>
        </div>
      )}

      {message && <p className="mt-3 alert alert-info">{message}</p>}

      {showForm && (
        <div className="mt-4">
          <h3>{editingId ? 'Editar' : 'Agregar'} {employeeType === 'cobrador' ? 'Cobrador' : employeeType === 'vendedor' ? 'Vendedor' : 'Institución'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="nombre" className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombre" value={formData.nombre || ''} onChange={handleChange} required />
            </div>

            {employeeType !== 'organizacion' && (
              <div className="mb-3">
                <label htmlFor="dni" className="form-label">DNI</label>
                <input type="text" className="form-control" id="dni" value={formData.dni || ''} onChange={handleChange} required />
              </div>
            )}

            {employeeType === 'organizacion' && (
              <div className="mb-3">
                <label htmlFor="Cuit" className="form-label">CUIT</label>
                <input type="text" className="form-control" id="Cuit" value={formData.Cuit || ''} onChange={handleChange} required />
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="direccion" className="form-label">Dirección</label>
              <input type="text" className="form-control" id="direccion" value={formData.direccion || ''} onChange={handleChange} required />
            </div>

            <div className="mb-3">
              <label htmlFor="localidad" className="form-label">Localidad</label>
              <input type="text" className="form-control" id="localidad" value={formData.localidad || ''} onChange={handleChange} required />
            </div>

            <div className="mb-3">
              <label htmlFor="telefono" className="form-label">Teléfono</label>
              <input type="text" className="form-control" id="telefono" value={formData.telefono || ''} onChange={handleChange} required />
            </div>

            {employeeType !== 'organizacion' && (
              <div className="mb-3">
                <label htmlFor="cargo" className="form-label">Cargo</label>
                <input type="text" className="form-control" id="cargo" value={formData.cargo || ''} onChange={handleChange} required />
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="comisiones" className="form-label">Comisiones</label>
              <input type="text" className="form-control" id="comisiones" value={formData.comisiones || ''} onChange={handleChange} required />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input type="email" className="form-control" id="email" value={formData.email || ''} onChange={handleChange} required />
            </div>

            {employeeType !== 'organizacion' && (
              <div className="mb-3">
                <label htmlFor="organizacion_id" className="form-label">Institución</label>
                <select className="form-control" id="organizacion_id" value={formData.organizacion_id || ''} onChange={handleChange}>
                  <option value="">Sin institución</option>
                  {organizaciones.map((org) => (
                    <option key={org.id} value={org.id}>{org.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-success">Guardar</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}