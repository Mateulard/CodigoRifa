import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Comisiones() {
  const [rifas, setRifas] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [numerosRifa, setNumerosRifa] = useState([]);
  const [comisionData, setComisionData] = useState(null);
  const [message, setMessage] = useState('');
  const [tipoPersona, setTipoPersona] = useState('vendedor');

  const generatePDF = () => {
    if (!selectedRifa || !selectedPersona || !numerosRifa || !comisionData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Set light green background color
    const headerColor = [204, 255, 204];
    
    // Title
    doc.setFillColor(...headerColor);
    doc.rect(15, 15, pageWidth - 30, 10, 'F');
    doc.setFontSize(16);
    doc.text('RENDICION DE VENTAS', pageWidth / 2, 22, { align: 'center' });

    // Header information
    doc.setFontSize(10);
    const today = new Date();
    const headerData = [
      ['FECHA:', today.toLocaleDateString()],
      [tipoPersona.toUpperCase() + ':', selectedPersona.nombre],
      ['CAMPAÑA:', selectedRifa.nombre],
      ['FORMA DE PAGO:', 'CTAS PAGAS']
    ];

    doc.autoTable({
      startY: 30,
      head: [],
      body: headerData,
      theme: 'plain',
      styles: {
        cellPadding: 2,
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 100 }
      }
    });

    // Main table
    const tableData = numerosRifa.map((numero, index) => {
      const cuotasPagadas = contarCuotasPagadas(numero.cuotas_pagadas);
      return [
        (index + 1).toString(),
        numero.numero.toString(),
        '1',
        cuotasPagadas.toString(),
        `$ ${(cuotasPagadas * selectedRifa.valorCuota).toFixed(2)}`
      ];
    });

    // Fill empty rows to reach 20
    while (tableData.length < 20) {
      tableData.push(['', '', '', '', '']);
    }

    // Calculate total
    const total = numerosRifa.reduce((sum, numero) => {
      const cuotasPagadas = contarCuotasPagadas(numero.cuotas_pagadas);
      return sum + (cuotasPagadas * selectedRifa.valorCuota);
    }, 0);

    // Add total row
    tableData.push(['', '', '', 'TOTALES', `$ ${total.toFixed(2)}`]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['', 'SOCIO Nº', 'DESDE CUOTA', 'HASTA CUOTA', 'VALOR RENDIR']],
      body: tableData,
      theme: 'grid',
      styles: {
        cellPadding: 2,
        fontSize: 10,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: headerColor,
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 40, halign: 'right' }
      }
    });

    // Save the PDF
    doc.save(`rendicion_${selectedPersona.nombre}_${today.toLocaleDateString()}.pdf`);
  };





  useEffect(() => {
    fetchRifas();
  }, []);

  const fetchRifas = () => {
    axios.get('http://localhost:4000/rifas')
      .then((response) => {
        setRifas(response.data);
      })
      .catch((error) => {
        console.error("Error al obtener rifas:", error);
        setMessage("Error al cargar las rifas. Por favor, intente nuevamente.");
      });
  };

  const handleRifaSelect = (rifaId) => {
    const selectedRifa = rifas.find(rifa => rifa.id === parseInt(rifaId));
    setSelectedRifa(selectedRifa);
    setSelectedPersona(null);
    setNumerosRifa([]);
    setComisionData(null);
    fetchPersonas(selectedRifa.organizacion_id);
  };

  const fetchPersonas = (organizacionId) => {
    const endpoint = tipoPersona === 'vendedor' ? 'vendedoresPorOrganizacion' : 'cobradoresPorOrganizacion';
    axios.get(`http://localhost:4000/${endpoint}/${organizacionId}`)
      .then((response) => {
        setPersonas(response.data);
      })
      .catch((error) => {
        console.error(`Error al obtener ${tipoPersona}es:`, error);
        setMessage(`Error al cargar los ${tipoPersona}es. Por favor, intente nuevamente.`);
      });
  };

  const handlePersonaSelect = (personaId) => {
    const personaSeleccionada = personas.find(persona => persona.id === parseInt(personaId));
    setSelectedPersona(personaSeleccionada);
    fetchNumerosRifaPorPersona(selectedRifa.id, personaId);
    fetchComisionData(selectedRifa.id, personaId);
  };

  const fetchNumerosRifaPorPersona = (rifaId, personaId) => {
    const endpoint = tipoPersona === 'vendedor' ? 'numerosRifaPorVendedor' : 'numerosRifaPorCobrador';
    axios.get(`http://localhost:4000/${endpoint}/${rifaId}/${personaId}`)
      .then((response) => {
        setNumerosRifa(response.data);
      })
      .catch((error) => {
        console.error(`Error al obtener números de rifa:`, error);
        setMessage(`Error al cargar los números de rifa del ${tipoPersona}. Por favor, intente nuevamente.`);
      });
  };

  const fetchComisionData = (rifaId, personaId) => {
    setMessage(`Cargando datos de comisión...`);
    const endpoint = tipoPersona === 'vendedor' ? 'calcularComision' : 'calcularComisionCobrador';
    axios.get(`http://localhost:4000/${endpoint}/${rifaId}/${personaId}`)
      .then((response) => {
        setComisionData(response.data);
        setMessage('');
      })
      .catch((error) => {
        console.error(`Error al calcular comisión:`, error);
        setMessage(`Error al calcular la comisión: ${error.response?.data?.error || error.message}`);
        setComisionData(null);
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

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Cálculo de Comisiones</h2>
      <div className="form-group mb-3">
        <label htmlFor="tipoPersona">Selecciona el tipo:</label>
        <select
          id="tipoPersona"
          className="form-control"
          value={tipoPersona}
          onChange={(e) => {
            setTipoPersona(e.target.value);
            setSelectedRifa(null);
            setSelectedPersona(null);
            setNumerosRifa([]);
            setComisionData(null);
          }}
        >
          <option value="vendedor">Vendedor</option>
          <option value="cobrador">Cobrador</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="rifaSelect">Selecciona una rifa:</label>
        <select
          id="rifaSelect"
          className="form-control"
          onChange={(e) => handleRifaSelect(e.target.value)}
          value={selectedRifa ? selectedRifa.id : ''}
        >
          <option value="">Selecciona una rifa</option>
          {rifas.map((rifa) => (
            <option key={rifa.id} value={rifa.id}>
              {rifa.nombre} - {rifa.organizacion_nombre}
            </option>
          ))}
        </select>
      </div>
      
      {selectedRifa && (
        <div className="form-group mt-3">
          <label htmlFor="personaSelect">Selecciona un {tipoPersona}:</label>
          <select
            id="personaSelect"
            className="form-control"
            onChange={(e) => handlePersonaSelect(e.target.value)}
            value={selectedPersona ? selectedPersona.id : ''}
          >
            <option value="">Selecciona un {tipoPersona}</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

{selectedPersona && (
      <div className="row mt-4">
        <div className="col-md-6">
          <h3>Detalles de Rifas Asignadas</h3>
          <ul className="list-group">
            {numerosRifa.map((numero) => (
              <li key={numero.id} className="list-group-item">
                <strong>Número de Rifa:</strong> {numero.numero}<br />
                <strong>Cuotas Pagadas:</strong> {contarCuotasPagadas(numero.cuotas_pagadas)} / {selectedRifa.cuotas}<br />
                <strong>Total:</strong> ${(contarCuotasPagadas(numero.cuotas_pagadas) * selectedRifa.valorCuota).toFixed(2)}
                {tipoPersona === 'cobrador' && (
                  <><br /><strong>Vendedor:</strong> {numero.vendedor_nombre || 'No asignado'}</>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-6">
          <h3>Detalles de Comisiones</h3>
          {comisionData ? (
            <ul className="list-group">
              <li className="list-group-item">
                <strong>Rifa:</strong> {comisionData.detalles.rifa_nombre}
              </li>
              <li className="list-group-item">
                <strong>{tipoPersona === 'vendedor' ? 'Vendedor' : 'Cobrador'}:</strong> {comisionData.detalles.cobrador_nombre || comisionData.detalles.vendedor_nombre}
              </li>
              <li className="list-group-item">
                <strong>Total Ventas:</strong> ${comisionData.totalVentas.toFixed(2)}
              </li>
              <li className="list-group-item">
                <strong>{tipoPersona === 'vendedor' ? 'Comisión Total' : 'Descuento Total'}:</strong> ${Math.abs(comisionData.comisionTotal).toFixed(2)}
              </li>
              <li className="list-group-item">
                <strong>Números Totales:</strong> {comisionData.detalles.numerosTotales}
              </li>
              <li className="list-group-item">
                <strong>Cuotas Pagadas:</strong> {comisionData.detalles.cuotasPagadas}
              </li>
              <li className="list-group-item">
                <strong>Cuotas Comisionables:</strong> {comisionData.detalles.cuotasComisionables}
              </li>
              <li className="list-group-item">
                <strong>Valor de Cuota:</strong> ${comisionData.detalles.valorCuota.toFixed(2)}
              </li>
              <li className="list-group-item">
                <strong>Porcentaje de {tipoPersona === 'vendedor' ? 'Comisión' : 'Descuento'}:</strong> {comisionData.detalles.porcentajeComision}%
              </li>
              {tipoPersona === 'cobrador' && (
                <li className="list-group-item">
                  <strong>Vendedores Asociados:</strong> {comisionData.detalles.vendedoresUnicos.join(', ')}
                </li>
              )}
            </ul>
          ) : (
            <p>No hay datos de comisión disponibles.</p>
          )}
        </div>

        {/* Nuevo botón para generar PDF */}
        <div className="col-12 mt-4">
          <button
            className="btn btn-primary"
            onClick={generatePDF}
            disabled={!comisionData || numerosRifa.length === 0}
          >
            Generar PDF de Rendición
          </button>
        </div>
      </div>
    )}

    {message && <div className="alert alert-info mt-3" role="alert">{message}</div>}
  </div> )}