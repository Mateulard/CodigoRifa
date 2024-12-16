import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function VerRifas() {
  const [rifas, setRifas] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [numerosRifa, setNumerosRifa] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

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

  const handleRifaSelect = async (event) => {
    const rifaId = event.target.value;
    const selected = rifas.find((rifa) => rifa.id === parseInt(rifaId));
    setSelectedRifa(selected || null);
    if (selected) {
      try {
        const response = await axios.get(`http://localhost:4000/numerosRifa/${selected.id}`);
        setNumerosRifa(response.data);
      } catch (error) {
        console.error("Error fetching numeros:", error);
      }
    }
  };

  const handleEdit = (numero) => {
    setEditingId(numero.id);
    setEditData(numero);
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      await axios.put(`http://localhost:4000/actualizarNumeroRifa/${editingId}`, editData);
      const updatedNumeros = numerosRifa.map((numero) =>
        numero.id === editingId ? { ...numero, ...editData } : numero
      );
      setNumerosRifa(updatedNumeros);
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error("Error updating numero:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  return (
    <div className="ver-rifas-container">
      <h2>Ver Rifas</h2>
      <select onChange={handleRifaSelect} className="rifa-select">
        <option value="">Selecciona una rifa</option>
        {rifas.map((rifa) => (
          <option key={rifa.id} value={rifa.id}>
            {rifa.nombre} - {rifa.organizacion_nombre}
          </option>
        ))}
      </select>

      {selectedRifa && (
        <div className="numeros-rifa-table-container">
          <table className="numeros-rifa-table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Fecha Suscripción</th>
                <th>Apellido y Nombre</th>
                <th>Dirección</th>
                <th>Barrio</th>
                <th>Localidad</th>
                <th>Teléfono</th>
                <th>Cobrar</th>
                <th>Fecha Cobro</th>
                <th>Mail</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {numerosRifa.map((numero) => (
                <tr key={numero.id}>
                  <td>{numero.numero}</td>
                  <td>
                    {editingId === numero.id ? (
                      <input
                        type="date"
                        name="fecha_suscripcion"
                        value={editData.fecha_suscripcion || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      numero.fecha_suscripcion
                    )}
                  </td>
                  <td>
                    {editingId === numero.id ? (
                      <input
                        type="text"
                        name="nombre_comprador"
                        value={editData.nombre_comprador || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      numero.nombre_comprador
                    )}
                  </td>
                  <td>
                    {editingId === numero.id ? (
                      <input
                        type="text"
                        name="direccion"
                        value={editData.direccion || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      numero.direccion
                    )}
                  </td>
                  <td>
                    {editingId === numero.id ? (
                      <input
                        type="text"
                        name="barrio"
                        value={editData.barrio || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      numero.barrio
                    )}
                  </td>
                  <td>
                    {editingId === numero.id ? (
                      <input
                        type="text"
                        name="localidad"
                        value={editData.localidad || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      numero.localidad
                    )}
                  </td>
                  <td>
                    {editingId === numero.id ? (
                      <input
                        type="text"
                        name="telefono"
                        value={editData.telefono || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      numero.telefono
                    )}
                  </td>
                  <td>
                    {editingId === numero.id ? (
                      <input
                        type="text"
                        name="cobrar"
                        value={editData.cobrar || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      numero.cobrar
                    )}
                  </td>
                  <td>
                    {editingId === numero.id ? (
                      <input
                        type="date"
                        name="fecha_cobro"
                        value={editData.fecha_cobro || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      numero.fecha_cobro
                    )}
                  </td>
                  <td>
                    {editingId === numero.id ? (
                      <input
                        type="email"
                        name="mail"
                        value={editData.mail || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      numero.mail
                    )}
                  </td>
                  <td>
                    {editingId === numero.id ? (
                      <div>
                        <button onClick={handleSave}>Guardar</button>
                        <button onClick={handleCancel}>Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(numero)}>Editar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

