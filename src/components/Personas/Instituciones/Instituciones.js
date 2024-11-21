import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Organizaciones = ({ onEdit, onDelete }) => {
  const [organizaciones, setOrganizaciones] = useState([]);

  useEffect(() => {
    fetchOrganizaciones();
  }, []);

  const fetchOrganizaciones = () => {
    axios.get('http://localhost:4000/organizaciones').then((response) => {
      setOrganizaciones(response.data);
    });
  };

  return (
    <div className="table-responsive">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cuit</th>
            <th>Dirección</th>
            <th>Localidad</th>
            <th>Teléfono</th>
            <th>Comisiones</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {organizaciones.map((organizacion) => (
            <tr key={organizacion.id}>
              <td>{organizacion.nombre}</td>
              <td>{organizacion.Cuit}</td>
              <td>{organizacion.direccion}</td>
              <td>{organizacion.localidad}</td>
              <td>{organizacion.telefono}</td>
              <td>{organizacion.comisiones}</td>
              <td>{organizacion.email}</td>
              <td>
                <button onClick={() => onEdit('organizacion', organizacion)} className="btn btn-sm btn-primary me-2">Editar</button>
                <button onClick={() => onDelete('organizacion', organizacion.id)} className="btn btn-sm btn-danger">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Organizaciones;