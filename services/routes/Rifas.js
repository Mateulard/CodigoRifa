const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Obtener todas las rifas
  router.get('/', (req, res) => {
    const sql = 'SELECT r.*, o.nombre as organizacion_nombre FROM rifas r LEFT JOIN organizaciones o ON r.organizacion_id = o.id';
    db.query(sql, (err, data) => {
      if (err) return res.status(500).json(err);
      return res.json(data);
    });
  });

  // Crear una nueva rifa
  router.post('/', (req, res) => {
    const { nombre, organizacion_id, rangoInicio, rangoFin, crearBonos, cantidadBonos, cuotas, valorCuota, mesInicio } = req.body;
    const numeros = rangoFin - rangoInicio + 1;
    const sql = `INSERT INTO rifas (nombre, organizacion_id, numeros, crearBonos, cantidadBonos, cuotas, valorCuota, mesInicio, rangoInicio) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [nombre, organizacion_id, numeros, crearBonos, cantidadBonos, Math.min(12, cuotas), valorCuota, mesInicio, rangoInicio], (err, result) => {
      if (err) return res.status(500).json(err);
      
      const rifaId = result.insertId;
      const numerosInsert = [];
      for (let i = rangoInicio; i <= rangoFin; i++) {
        numerosInsert.push([rifaId, i]);
      }
      
      const sqlNumeros = `INSERT INTO numeros_rifa (rifa_id, numero) VALUES ?`;
      db.query(sqlNumeros, [numerosInsert], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.status(200).send('Rifa created successfully');
      });
    });
  });

  // Obtener números de rifa
  router.get('/:rifaId/numeros', (req, res) => {
    const sql = `
      SELECT nr.*, v.nombre as vendedor_nombre 
      FROM numeros_rifa nr 
      LEFT JOIN vendedores v ON nr.vendedor_id = v.id 
      WHERE nr.rifa_id = ?
      ORDER BY nr.numero
    `;
    db.query(sql, [req.params.rifaId], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.json(data);
    });
  });

  // Actualizar asignación de vendedor
  router.post('/actualizarVendedor', (req, res) => {
    const { numeroRifaId, vendedorId } = req.body;
    const sql = 'UPDATE numeros_rifa SET vendedor_id = ? WHERE id = ?';
    
    db.query(sql, [vendedorId || null, numeroRifaId], (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json({ message: 'Vendor assignment updated successfully' });
    });
  });

  // Actualizar estado de pago de cuota
  router.post('/actualizarCuotaPagada', (req, res) => {
    const { numeroRifaId, cuotaIndex, estado } = req.body;
    
    const selectSql = 'SELECT cuotas_pagadas FROM numeros_rifa WHERE id = ?';
    db.query(selectSql, [numeroRifaId], (selectErr, selectResult) => {
      if (selectErr) {
        return res.status(500).json({ error: 'Error selecting cuotas_pagadas', details: selectErr.message });
      }

      let cuotasPagadas = {};
      if (selectResult[0] && selectResult[0].cuotas_pagadas) {
        try {
          cuotasPagadas = JSON.parse(selectResult[0].cuotas_pagadas);
        } catch (parseError) {
          return res.status(500).json({ error: 'Error parsing cuotas_pagadas', details: parseError.message });
        }
      }

      if (!estado) {
        Object.keys(cuotasPagadas).forEach(key => {
          if (Number(key) > cuotaIndex) {
            cuotasPagadas[key] = false;
          }
        });
      }

      cuotasPagadas[cuotaIndex] = estado;

      const updateSql = 'UPDATE numeros_rifa SET cuotas_pagadas = ? WHERE id = ?';
      db.query(updateSql, [JSON.stringify(cuotasPagadas), numeroRifaId], (updateErr, updateResult) => {
        if (updateErr) {
          return res.status(500).json({ error: 'Error updating cuotas_pagadas', details: updateErr.message });
        }
        return res.status(200).json({ message: 'Quota payment status updated successfully', cuotasPagadas });
      });
    });
  });

  return router;
};