import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Vendedores = ({ onEdit, onDelete, filter = {}, hideActions = false }) => {
  const [vendedores, setVendedores] = useState([]);

  useEffect(() => {
    fetchVendedores();
  }, [filter]);

  const fetchVendedores = () => {
    axios.get('http://localhost:4000/vendedores', { params: filter }).then((response) => {
      setVendedores(response.data);
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
          {vendedores.map((vendedor) => (
            <tr key={vendedor.id}>
              <td>{vendedor.nombre}</td>
              <td>{vendedor.dni}</td>
              <td>{vendedor.direccion}</td>
              <td>{vendedor.localidad}</td>
              <td>{vendedor.telefono}</td>
              <td>{vendedor.cargo}</td>
              <td>{vendedor.comisiones}</td>
              <td>{vendedor.email}</td>
              {!hideActions && (
                <td>
                  <button onClick={() => onEdit('vendedor', vendedor)} className="btn btn-sm btn-primary me-2">Editar</button>
                  <button onClick={() => onDelete('vendedor', vendedor.id)} className="btn btn-sm btn-danger">Eliminar</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Vendedores;