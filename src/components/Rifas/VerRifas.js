import React, { useState, useEffect } from 'react';
import axios from 'axios';

const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export default function VerRifas() {
  const [rifas, setRifas] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [numerosRifa, setNumerosRifa] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [cobradores, setCobradores] = useState([]);
  const [message, setMessage] = useState('');
  const [rangoInicio, setRangoInicio] = useState('');
  const [rangoFin, setRangoFin] = useState('');
  const [vendedorRango, setVendedorRango] = useState('');
  const [cobradorRango, setCobradorRango] = useState('');
  const [tipoAsignacion, setTipoAsignacion] = useState('vendedor');

  useEffect(() => {
    fetchRifas();
  }, []);

  const fetchRifas = () => {
    axios.get('http://localhost:4000/rifas').then((response) => {
      setRifas(response.data);
    });
  };

  const handleRifaSelect = (rifaId) => {
    const selectedRifa = rifas.find(rifa => rifa.id === parseInt(rifaId));
    setSelectedRifa(selectedRifa);
    fetchNumerosRifa(selectedRifa.id);
    fetchVendedores(selectedRifa.organizacion_id);
    fetchCobradores(selectedRifa.organizacion_id);
  };

  const fetchNumerosRifa = (rifaId) => {
    axios.get(`http://localhost:4000/numerosRifa/${rifaId}`).then((response) => {
      setNumerosRifa(response.data);
    });
  };

  const fetchVendedores = (organizacionId) => {
    axios.get(`http://localhost:4000/vendedoresPorOrganizacion/${organizacionId}`).then((response) => {
      setVendedores(response.data);
    });
  };

  const fetchCobradores = (organizacionId) => {
    axios.get(`http://localhost:4000/cobradoresPorOrganizacion/${organizacionId}`).then((response) => {
      setCobradores(response.data);
    });
  };

  const handleAsignarPersona = (numeroRifaId, personaId, tipo) => {
    const endpoint = tipo === 'vendedor' ? 'actualizarVendedor' : 'actualizarCobrador';
    axios.post(`http://localhost:4000/${endpoint}`, { numeroRifaId, [`${tipo}Id`]: personaId || null })
      .then(() => {
        setMessage(`Asignación de ${tipo} actualizada con éxito.`);
        fetchNumerosRifa(selectedRifa.id); // Vuelve a cargar los números de rifa para reflejar los cambios
      })
      .catch((error) => {
        console.error(`Error al actualizar asignación de ${tipo}:`, error);
        setMessage(`Error al actualizar asignación de ${tipo}. Inténtalo nuevamente.`);
      });
  };

  const handleMarcarCuotaPagada = (numeroRifaId, cuotaIndex) => {
    const numero = numerosRifa.find(n => n.id === numeroRifaId);
    let cuotasPagadas = {};
    try {
      cuotasPagadas = numero.cuotas_pagadas ? JSON.parse(numero.cuotas_pagadas) : {};
    } catch (error) {
      console.error("Error parsing cuotas_pagadas:", error);
      cuotasPagadas = {};
    }
    const nuevoEstado = !cuotasPagadas[cuotaIndex];

    axios.post('http://localhost:4000/actualizarCuotaPagada', { numeroRifaId, cuotaIndex, estado: nuevoEstado })
      .then((response) => {
        setMessage("Estado de cuota actualizado con éxito.");
        setNumerosRifa(numerosRifa.map(numero => 
          numero.id === numeroRifaId 
            ? { 
                ...numero, 
                cuotas_pagadas: JSON.stringify(response.data.cuotasPagadas)
              }
            : numero
        ));
      })
      .catch((error) => {
        console.error("Error al actualizar estado de cuota:", error);
        if (error.response && error.response.status === 400) {
          setMessage(error.response.data.error);
        } else {
          setMessage("Error al actualizar estado de cuota. Inténtalo nuevamente.");
        }
      });
  };

  const handleAsignarPersonaRango = () => {
    const endpoint = tipoAsignacion === 'vendedor' ? 'asignarVendedorRango' : 'asignarCobradorRango';
    const personaId = tipoAsignacion === 'vendedor' ? vendedorRango : cobradorRango;
    axios.post(`http://localhost:4000/${endpoint}`, {
      rifaId: selectedRifa.id,
      [`${tipoAsignacion}Id`]: personaId,
      rangoInicio,
      rangoFin
    })
      .then(() => {
        setMessage(`${tipoAsignacion.charAt(0).toUpperCase() + tipoAsignacion.slice(1)} asignado al rango con éxito.`);
        fetchNumerosRifa(selectedRifa.id);
        setRangoInicio('');
        setRangoFin('');
        setVendedorRango('');
        setCobradorRango('');
      })
      .catch((error) => {
        console.error(`Error al asignar ${tipoAsignacion} al rango:`, error);
        setMessage(`Error al asignar ${tipoAsignacion} al rango. Inténtalo nuevamente.`);
      });
  };

  const calcularTotalPagado = (numero) => {
    let cuotasPagadas = {};
    try {
      cuotasPagadas = numero.cuotas_pagadas ? JSON.parse(numero.cuotas_pagadas) : {};
    } catch (error) {
      console.error("Error parsing cuotas_pagadas:", error);
      cuotasPagadas = {};
    }
    const cuotasPagadasCount = Object.values(cuotasPagadas).filter(Boolean).length;
    return cuotasPagadasCount * (selectedRifa?.valorCuota || 0);
  };

  return (
    <div className="container mt-5">
      <h2>Rifas en Curso</h2>
      <select className="form-control mb-3" onChange={(e) => handleRifaSelect(e.target.value)}>
        <option value="">Selecciona una rifa</option>
        {rifas.map((rifa) => (
          <option key={rifa.id} value={rifa.id}>{rifa.nombre} - {rifa.organizacion_nombre}</option>
        ))}
      </select>
      {selectedRifa && (
        <div>
          <h3>Asignar Persona a Rango de Números</h3>
          <div className="form-row">
            <div className="form-group col-md-2">
              <select
                className="form-control"
                value={tipoAsignacion}
                onChange={(e) => setTipoAsignacion(e.target.value)}
              >
                <option value="vendedor">Vendedor</option>
                <option value="cobrador">Cobrador</option>
              </select>
            </div>
            <div className="form-group col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Rango inicio"
                value={rangoInicio}
                onChange={(e) => setRangoInicio(e.target.value)}
              />
            </div>
            <div className="form-group col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Rango fin"
                value={rangoFin}
                onChange={(e) => setRangoFin(e.target.value)}
              />
            </div>
            <div className="form-group col-md-4">
              <select
                className="form-control"
                value={tipoAsignacion === 'vendedor' ? vendedorRango : cobradorRango}
                onChange={(e) => tipoAsignacion === 'vendedor' ? setVendedorRango(e.target.value) : setCobradorRango(e.target.value)}
              >
                <option value="">Seleccionar {tipoAsignacion}</option>
                {(tipoAsignacion === 'vendedor' ? vendedores : cobradores).map((persona) => (
                  <option key={persona.id} value={persona.id}>{persona.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group col-md-2">
              <button className="btn btn-primary" onClick={handleAsignarPersonaRango}>Asignar</button>
            </div>
          </div>
          <h3>Números de la Rifa</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Vendedor</th>
                <th>Cobrador</th>
                <th>Cuotas Pagadas</th>
                <th>Total Pagado</th>
              </tr>
            </thead>
            <tbody>
              {numerosRifa.map((numero) => (
                <tr key={numero.id}>
                  <td>{numero.numero}</td>
                  <td>
                    <select
                      className="form-control"
                      value={numero.vendedor_id || ''}
                      onChange={(e) => handleAsignarPersona(numero.id, e.target.value, 'vendedor')}
                    >
                      <option value="">Sin asignar</option>
                      {vendedores.map((vendedor) => (
                        <option key={vendedor.id} value={vendedor.id}>{vendedor.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-control"
                      value={numero.cobrador_id || ''}
                      onChange={(e) => handleAsignarPersona(numero.id, e.target.value, 'cobrador')}
                    >
                      <option value="">Sin asignar</option>
                      {cobradores.map((cobrador) => (
                        <option key={cobrador.id} value={cobrador.id}>{cobrador.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {Array.from({ length: selectedRifa.cuotas }, (_, index) => {
                      const mesIndex = (selectedRifa.mesInicio + index) % 12;
                      let cuotasPagadas = {};
                      try {
                        cuotasPagadas = numero.cuotas_pagadas ? JSON.parse(numero.cuotas_pagadas) : {};
                      } catch (error) {
                        console.error("Error parsing cuotas_pagadas:", error);
                      }
                      return (
                        <button
                          key={index}
                          className={`btn btn-sm ${cuotasPagadas[index] ? 'btn-success' : 'btn-outline-secondary'} mr-1 mb-1`}
                          onClick={() => handleMarcarCuotaPagada(numero.id, index)}
                          disabled={index > 0 && !cuotasPagadas[index - 1]}
                        >
                          {meses[mesIndex]}
                        </button>
                      );
                    })}
                  </td>
                  <td>${calcularTotalPagado(numero).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {message && <p className="mt-3 alert alert-info">{message}</p>}
    </div>
  );
}