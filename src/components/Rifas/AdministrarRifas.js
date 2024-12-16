import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdministrarRifas.css';

export default function AdministrarRifas() {
  const [rifas, setRifas] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [confirmationStep, setConfirmationStep] = useState(0);
  const [confirmationInput, setConfirmationInput] = useState('');

  useEffect(() => {
    fetchRifas();
  }, []);

  const fetchRifas = async () => {
    try {
      const response = await axios.get("http://localhost:4000/rifas");
      setRifas(response.data);
    } catch (error) {
      console.error("Error fetching rifas:", error);
    }
  };

  const handleDeleteClick = (rifa) => {
    setSelectedRifa(rifa);
    setConfirmationStep(1);
  };

  const handleConfirmation = () => {
    if (confirmationStep === 1) {
      setConfirmationStep(2);
    } else if (confirmationStep === 2) {
      setConfirmationStep(3);
    } else if (confirmationStep === 3 && confirmationInput === selectedRifa.nombre) {
      deleteRifa();
    }
  };

  const deleteRifa = async () => {
    try {
      await axios.delete(`http://localhost:4000/eliminarRifa/${selectedRifa.id}`);
      setRifas(rifas.filter(rifa => rifa.id !== selectedRifa.id));
      resetConfirmation();
    } catch (error) {
      console.error("Error deleting rifa:", error);
    }
  };

  const resetConfirmation = () => {
    setSelectedRifa(null);
    setConfirmationStep(0);
    setConfirmationInput('');
  };

  return (
    <div className="administrar-rifas-container">
      <h2>Administrar Rifas</h2>
      <table className="rifas-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Organización</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rifas.map((rifa) => (
            <tr key={rifa.id}>
              <td>{rifa.nombre}</td>
              <td>{rifa.organizacion_nombre}</td>
              <td>
                <button onClick={() => handleDeleteClick(rifa)} className="delete-button">
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedRifa && (
        <div className="confirmation-modal">
          <h3>Confirmar eliminación</h3>
          {confirmationStep === 1 && (
            <p>¿Está seguro que desea eliminar la rifa "{selectedRifa.nombre}"?</p>
          )}
          {confirmationStep === 2 && (
            <p>Esta acción no se puede deshacer. ¿Está realmente seguro?</p>
          )}
          {confirmationStep === 3 && (
            <div>
              <p>Por favor, escriba el nombre de la rifa para confirmar la eliminación:</p>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Nombre de la rifa"
              />
            </div>
          )}
          <div className="confirmation-buttons">
            <button onClick={handleConfirmation} className="confirm-button">
              {confirmationStep === 3 ? 'Eliminar definitivamente' : 'Confirmar'}
            </button>
            <button onClick={resetConfirmation} className="cancel-button">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

