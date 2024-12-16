import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const opcionesMetodoPago = ['CBU', 'Contado', 'Tarjeta', 'Fiado'];

export default function ConsignarCuotas() {
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
  const [metodosPago, setMetodosPago] = useState({});

  useEffect(() => {
    fetchRifas();
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
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
      // Initialize metodosPago state with existing data
      const initialMetodosPago = {};
      response.data.forEach(numero => {
        initialMetodosPago[numero.id] = numero.metodo_pago || '';
      });
      setMetodosPago(initialMetodosPago);
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
        fetchNumerosRifa(selectedRifa.id);
      })
      .catch((error) => {
        console.error(`Error al actualizar asignación de ${tipo}:`, error);
        setMessage(`Error al actualizar asignación de ${tipo}. Inténtalo nuevamente.`);
      });
  };

  const handleMarcarCuota = (numeroRifaId, cuotaIndex, estado) => {
    const numero = numerosRifa.find(n => n.id === numeroRifaId);
    let cuotasPagadas = {};
    try {
      cuotasPagadas = numero.cuotas_pagadas ? JSON.parse(numero.cuotas_pagadas) : {};
    } catch (error) {
      console.error("Error parsing cuotas_pagadas:", error);
      cuotasPagadas = {};
    }
    
    cuotasPagadas[cuotaIndex] = estado;

    axios.post('http://localhost:4000/actualizarCuotaPagada', { numeroRifaId, cuotaIndex, estado })
      .then((response) => {
        setMessage("Estado de cuota actualizado con éxito.");
        setNumerosRifa(numerosRifa.map(numero => 
          numero.id === numeroRifaId 
            ? { 
                ...numero, 
                cuotas_pagadas: JSON.stringify(cuotasPagadas)
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
    const cuotasPagadasCount = Object.values(cuotasPagadas).filter(estado => estado === 'pagada').length;
    return cuotasPagadasCount * (selectedRifa?.valorCuota || 0);
  };

  const getEstadoCuotaClass = (estado) => {
    switch(estado) {
      case 'pagada':
        return 'btn-success';
      case 'debe':
        return 'btn-danger';
      case 'baja':
        return 'btn-primary';
      default:
        return 'btn-outline-secondary';
    }
  };

  const getNextEstado = (estadoActual) => {
    const estados = [null, 'pagada', 'debe', 'baja'];
    const currentIndex = estados.indexOf(estadoActual);
    return estados[(currentIndex + 1) % estados.length];
  };

  const handleMetodoPagoChange = useCallback(async (numeroId, metodo) => {
    try {
      const response = await axios.post('http://localhost:4000/actualizarMetodoPago', { numeroRifaId: numeroId, metodoPago: metodo });
      if (response.data.success) {
        console.log('Método de pago actualizado con éxito');
        setMetodosPago(prevState => ({ ...prevState, [numeroId]: metodo }));
      } else {
        throw new Error(response.data.message || 'Error desconocido al actualizar el método de pago');
      }
    } catch (error) {
      console.error("Error al actualizar método de pago:", error);
      setMessage(error.response?.data?.message || "Error al actualizar método de pago. Inténtalo nuevamente.");
    }
  }, []);

  const handleBeforeUnload = useCallback(async (event) => {
    event.preventDefault();
    event.returnValue = '';
    
    for (const [numeroId, metodo] of Object.entries(metodosPago)) {
      try {
        await axios.post('http://localhost:4000/actualizarMetodoPago', { numeroRifaId: numeroId, metodoPago: metodo });
      } catch (error) {
        console.error("Error al guardar método de pago:", error);
      }
    }
  }, [metodosPago]);

  return (
    <div className="container mt-5">
      <h2>Consignar Cuotas de Rifas</h2>
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
                <th>Cuotas</th>
                <th>Total Pagado</th>
                <th>Método de Pago</th>
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
                      const estadoActual = cuotasPagadas[index] || null;
                      return (
                        <button
                          key={index}
                          className={`btn btn-sm ${getEstadoCuotaClass(estadoActual)} mr-1 mb-1`}
                          onClick={() => handleMarcarCuota(numero.id, index, getNextEstado(estadoActual))}
                        >
                          {meses[mesIndex]}
                        </button>
                      );
                    })}
                  </td>
                  <td>${calcularTotalPagado(numero).toFixed(2)}</td>
                  <td>
                    <select
                      className="form-control"
                      value={metodosPago[numero.id] || ''}
                      onChange={(e) => handleMetodoPagoChange(numero.id, e.target.value)}
                    >
                      <option value="">Seleccionar método de pago</option>
                      {opcionesMetodoPago.map((metodo) => (
                        <option key={metodo} value={metodo}>{metodo}</option>
                      ))}
                    </select>
                  </td>
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

