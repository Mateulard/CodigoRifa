import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export default function Cuotas() {
  const [rifas, setRifas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [selectedVendedor, setSelectedVendedor] = useState(null);
  const [numerosRifa, setNumerosRifa] = useState([]);
  const [message, setMessage] = useState('');
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    fetchRifas();
  }, []);

  useEffect(() => {
    if (numerosRifa.length > 0 && selectedRifa) {
      const total = numerosRifa.reduce((acc, numero) => acc + calcularTotalCuotas(numero.cuotas_pagadas), 0);
      setTotalGeneral(total);
    }
  }, [numerosRifa, selectedRifa]);

  const fetchRifas = () => {
    console.log('Fetching rifas...');
    axios.get('http://localhost:4000/rifas')
      .then((response) => {
        console.log('Rifas fetched successfully:', response.data);
        setRifas(response.data);
      })
      .catch((error) => {
        console.error("Error al obtener rifas:", error);
        setMessage("Error al cargar las rifas. Por favor, intente nuevamente.");
        if (error.message === "Network Error") {
          setNetworkError(true);
        }
      });
  };

  const handleRifaSelect = (rifaId) => {
    console.log('Rifa selected:', rifaId);
    const selectedRifa = rifas.find(rifa => rifa.id === parseInt(rifaId));
    setSelectedRifa(selectedRifa);
    setSelectedVendedor(null);
    setNumerosRifa([]);
    setNetworkError(false);
    fetchVendedores(selectedRifa.organizacion_id);
  };

  const fetchVendedores = (organizacionId) => {
    console.log('Fetching vendedores for organizacion:', organizacionId);
    axios.get(`http://localhost:4000/vendedoresPorOrganizacion/${organizacionId}`)
      .then((response) => {
        console.log('Vendedores fetched successfully:', response.data);
        setVendedores(response.data);
      })
      .catch((error) => {
        console.error("Error al obtener vendedores:", error);
        setMessage("Error al cargar los vendedores. Por favor, intente nuevamente.");
        if (error.message === "Network Error") {
          setNetworkError(true);
        }
      });
  };

  const handleVendedorSelect = (vendedorId) => {
    console.log('Vendedor selected:', vendedorId);
    const vendedorSeleccionado = vendedores.find(vendedor => vendedor.id === parseInt(vendedorId));
    setSelectedVendedor(vendedorSeleccionado);
    setNetworkError(false);
    fetchNumerosRifaPorVendedor(selectedRifa.id, vendedorId);
  };

  const fetchNumerosRifaPorVendedor = (rifaId, vendedorId) => {
    console.log(`Fetching numeros rifa for rifa ${rifaId} and vendedor ${vendedorId}`);
    axios.get(`http://localhost:4000/numerosRifaPorVendedor/${rifaId}/${vendedorId}`)
      .then((response) => {
        console.log('Numeros rifa fetched successfully:', response.data);
        setNumerosRifa(response.data);
      })
      .catch((error) => {
        console.error("Error al obtener números de rifa:", error);
        setMessage("Error al cargar los números de rifa del vendedor. Por favor, intente nuevamente.");
        if (error.message === "Network Error") {
          setNetworkError(true);
        }
      });
  };

  const contarCuotasPagadas = (cuotasPagadas) => {
    if (!cuotasPagadas) return 0;
    try {
      const cuotas = JSON.parse(cuotasPagadas);
      return Object.values(cuotas).filter(Boolean).length;
    } catch (error) {
      console.error("Error al parsear cuotas_pagadas:", error);
      return 0;
    }
  };

  const calcularTotalCuotas = (cuotasPagadas) => {
    if (!cuotasPagadas || !selectedRifa) return 0;
    const cuotasPagadasCount = contarCuotasPagadas(cuotasPagadas);
    return cuotasPagadasCount * selectedRifa.valorCuota;
  };

  const generarPDF = () => {
    if (!selectedRifa || !selectedVendedor || numerosRifa.length === 0) {
      setMessage("Por favor, seleccione una rifa y un vendedor antes de generar el PDF.");
      return;
    }

    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text(`Reporte de Rifa: ${selectedRifa.nombre}`, 14, 20);

    // Información del vendedor
    doc.setFontSize(14);
    doc.text(`Vendedor: ${selectedVendedor.nombre}`, 14, 30);

    // Tabla de números de rifa
    const headers = [['Número', 'Cuotas Pagadas', 'Detalle', 'Total Pagado']];
    const data = numerosRifa.map(numero => [
      numero.numero,
      `${contarCuotasPagadas(numero.cuotas_pagadas)} / ${selectedRifa.cuotas}`,
      Array.from({ length: selectedRifa.cuotas }, (_, index) => {
        const mesIndex = (selectedRifa.mesInicio + index) % 12;
        let cuotasPagadas = {};
        try {
          cuotasPagadas = numero.cuotas_pagadas ? JSON.parse(numero.cuotas_pagadas) : {};
        } catch (error) {
          console.error("Error parsing cuotas_pagadas:", error);
        }
        return cuotasPagadas[index] ? meses[mesIndex] : '-';
      }).join(' '),
      `$${calcularTotalCuotas(numero.cuotas_pagadas).toFixed(2)}`
    ]);

    doc.autoTable({
      head: headers,
      body: data,
      startY: 40,
    });

    // Total general
    const finalY = doc.lastAutoTable.finalY || 40;
    doc.setFontSize(14);
    doc.text(`Total General: $${totalGeneral.toFixed(2)}`, 14, finalY + 10);

    // Guardar el PDF
    doc.save(`reporte_rifa_${selectedRifa.nombre}_${selectedVendedor.nombre}.pdf`);
  };

  return (
    <div className='m-5'>
      <h3 className="mb-4">Lista de Rifas</h3>
      <div className="form-group mt-3">
        <label htmlFor="rifaSelect">Selecciona una rifa:</label>
        <select
          id="rifaSelect"
          className="form-control"
          onChange={(e) => handleRifaSelect(e.target.value)}
        >
          <option value="">Selecciona una rifa</option>
          {rifas.map((rifa) => (
            <option key={rifa.id} value={rifa.id}>
              {rifa.nombre} - {rifa.organizacion_nombre}
            </option>
          ))}
        </select>
      </div>
      
      {selectedRifa && selectedVendedor && (
        <h4 className="mt-3">Vendedor: {selectedVendedor.nombre}</h4>
      )}

      {selectedRifa && (
        <div className="form-group mt-3">
          <label htmlFor="vendedorSelect">Selecciona un vendedor:</label>
          <select
            id="vendedorSelect"
            className="form-control"
            onChange={(e) => handleVendedorSelect(e.target.value)}
          >
            <option value="">Selecciona un vendedor</option>
            {vendedores.map((vendedor) => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {numerosRifa.length > 0 && (
        <div className="mt-4">
          <h3>{selectedRifa.nombre} - Números del Vendedor</h3>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Número de Rifa</th>
                <th>Cuotas Pagadas</th>
                <th>Detalle de Cuotas</th>
                <th>Total Pagado</th>
              </tr>
            </thead>
            <tbody>
              {numerosRifa.map((numero) => (
                <tr key={numero.id}>
                  <td>{numero.numero}</td>
                  <td>{contarCuotasPagadas(numero.cuotas_pagadas)} / {selectedRifa.cuotas}</td>
                  <td>
                    {Array.from({ length: selectedRifa.cuotas }, (_, index) => {
                      let cuotasPagadas = {};
                      try {
                        cuotasPagadas = numero.cuotas_pagadas ? JSON.parse(numero.cuotas_pagadas) : {};
                      } catch (error) {
                        console.error("Error parsing cuotas_pagadas:", error);
                      }
                      const mesIndex = (selectedRifa.mesInicio + index) % 12;
                      return (
                        <span
                          key={index}
                          className={`badge ${cuotasPagadas[index] ? 'bg-success' : 'bg-secondary'} me-1`}
                          title={cuotasPagadas[index] ? 'Pagada' : 'No pagada'}
                        >
                          {meses[mesIndex]}
                        </span>
                      );
                    })}
                  </td>
                  <td>${calcularTotalCuotas(numero.cuotas_pagadas).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <strong>Total General: ${totalGeneral.toFixed(2)}</strong>
          </div>
          <button onClick={generarPDF} className="btn btn-primary mt-3">Generar PDF</button>
        </div>
      )}

      {message && <div className="alert alert-info mt-3">{message}</div>}
      {networkError && (
        <div className="alert alert-danger mt-3">
          Error de red. Por favor, verifica tu conexión y asegúrate de que el servidor esté en funcionamiento.
        </div>
      )}
    </div>
  );
}

