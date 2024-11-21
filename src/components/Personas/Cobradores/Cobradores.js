import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Cobradores = ({ onEdit, onDelete, filter = {}, hideActions = false }) => {
  const [cobradores, setCobradores] = useState([]);

  useEffect(() => {
    fetchCobradores();
  }, [filter]);

  const fetchCobradores = () => {
    axios.get('http://localhost:4000/cobradores', { params: filter }).then((response) => {
      setCobradores(response.data);
    });
  };

  return (
    <div className="table-responsive">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>DNI</th>
            <th>Dirección</th>
            <th>Localidad</th>
            <th>Teléfono</th>
            <th>Cargo</th>
            <th>Comisiones</th>
            <th>Email</th>
            {!hideActions && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {cobradores.map((cobrador) => (
            <tr key={cobrador.id}>
              <td>{cobrador.nombre}</td>
              <td>{cobrador.dni}</td>
              <td>{cobrador.direccion}</td>
              <td>{cobrador.localidad}</td>
              <td>{cobrador.telefono}</td>
              <td>{cobrador.cargo}</td>
              <td>{cobrador.comisiones}</td>
              <td>{cobrador.email}</td>
              {!hideActions && (
                <td>
                  <button onClick={() => onEdit('cobrador', cobrador)} className="btn btn-sm btn-primary me-2">Editar</button>
                  <button onClick={() => onDelete('cobrador', cobrador.id)} className="btn btn-sm btn-danger">Eliminar</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Cobradores;