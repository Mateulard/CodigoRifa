const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Calcular comisión para un vendedor
  router.get('/vendedor/:rifaId/:vendedorId', (req, res) => {
    const { rifaId, vendedorId } = req.params;

    const sqlRifaVendedor = `
      SELECT r.valorCuota, r.cuotas, v.comisiones
      FROM rifas r
      JOIN vendedores v ON v.organizacion_id = r.organizacion_id
      WHERE r.id = ? AND v.id = ?
    `;

    db.query(sqlRifaVendedor, [rifaId, vendedorId], (err, rifaVendedorData) => {
      if (err) return res.status(500).json({ error: 'Error al obtener datos de rifa y vendedor', details: err.message });
      
      if (rifaVendedorData.length === 0) return res.status(404).json({ error: 'Rifa o vendedor no encontrado' });

      const { valorCuota, cuotas, comisiones } = rifaVendedorData[0];

      const sqlNumerosRifa = `
        SELECT cuotas_pagadas
        FROM numeros_rifa
        WHERE rifa_id = ? AND vendedor_id = ?
      `;

      db.query(sqlNumerosRifa, [rifaId, vendedorId], (err, numerosRifaData) => {
        if (err) return res.status(500).json({ error: 'Error al obtener números de rifa', details: err.message });

        let totalCuotasPagadas = 0;
        numerosRifaData.forEach(numero => {
          if (numero.cuotas_pagadas) {
            const cuotasPagadas = JSON.parse(numero.cuotas_pagadas);
            totalCuotasPagadas += Object.values(cuotasPagadas).filter(Boolean).length;
          }
        });

        const numerosTotales = numerosRifaData.length;
        const cuotasComisionables = totalCuotasPagadas - numerosTotales; // Exclude first quota
        const totalVentas = cuotasComisionables * valorCuota;
        const comisionTotal = totalVentas * (comisiones / 100);

        res.json({
          totalVentas,
          comisionTotal,
          detalles: {
            numerosTotales,
            cuotasPagadas: totalCuotasPagadas,
            cuotasComisionables,
            valorCuota,
            porcentajeComision: comisiones
          }
        });
      });
    });
  });

  // Calcular comisión para un cobrador
  router.get('/cobrador/:rifaId/:cobradorId', (req, res) => {
    const { rifaId, cobradorId } = req.params;

    const sqlRifaCobrador = `
      SELECT r.valorCuota, r.cuotas, c.comisiones
      FROM rifas r
      JOIN cobradores c ON c.organizacion_id = r.organizacion_id
      WHERE r.id = ? AND c.id = ?
    `;

    db.query(sqlRifaCobrador, [rifaId, cobradorId], (err, rifaCobradorData) => {
      if (err) return res.status(500).json({ error: 'Error al obtener datos de rifa y cobrador', details: err.message });
      
      if (rifaCobradorData.length === 0) return res.status(404).json({ error: 'Rifa o cobrador no encontrado' });

      const { valorCuota, cuotas, comisiones } = rifaCobradorData[0];

      const sqlNumerosRifa = `
        SELECT nr.cuotas_pagadas
        FROM numeros_rifa nr
        JOIN vendedores v ON nr.vendedor_id = v.id
        WHERE nr.rifa_id = ? AND v.cobrador_id = ?
      `;

      db.query(sqlNumerosRifa, [rifaId, cobradorId], (err, numerosRifaData) => {
        if (err) return res.status(500).json({ error: 'Error al obtener números de rifa', details: err.message });

        let totalCuotasPagadas = 0;
        numerosRifaData.forEach(numero => {
          if (numero.cuotas_pagadas) {
            const cuotasPagadas = JSON.parse(numero.cuotas_pagadas);
            totalCuotasPagadas += Object.values(cuotasPagadas).filter(Boolean).length;
          }
        });

        const numerosTotales = numerosRifaData.length;
        const cuotasComisionables = totalCuotasPagadas;
        const totalVentas = cuotasComisionables * valorCuota;
        const comisionTotal = -(totalVentas * (comisiones / 100)); // Negative for collectors

        res.json({
          totalVentas,
          comisionTotal,
          detalles: {
            numerosTotales,
            cuotasPagadas: totalCuotasPagadas,
            cuotasComisionables,
            valorCuota,
            porcentajeComision: comisiones
          }
        });
      });
    });
  });

  return router;
};