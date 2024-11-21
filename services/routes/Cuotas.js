const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Obtener números de rifa por vendedor
  router.get('/numerosRifaPorVendedor/:rifaId/:vendedorId', (req, res) => {
    const { rifaId, vendedorId } = req.params;
    console.log(`Buscando números de rifa para rifa ${rifaId} y vendedor ${vendedorId}`);

    if (!rifaId || !vendedorId) {
      console.error("Faltan parámetros rifaId o vendedorId");
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const sql = `
      SELECT nr.id, nr.numero, nr.cuotas_pagadas
      FROM numeros_rifa nr
      WHERE nr.rifa_id = ? AND nr.vendedor_id = ?
      ORDER BY nr.numero
    `;

    db.query(sql, [rifaId, vendedorId], (err, data) => {
      if (err) {
        console.error("Error al buscar números de rifa:", err);
        return res.status(500).json({ error: 'Error en el servidor', details: err.message });
      }
      console.log("Números de rifa encontrados:", data.length);
      return res.json(data);
    });
  });

  // Actualizar estado de pago de cuota
  router.post('/actualizarCuotaPagada', (req, res) => {
    const { numeroRifaId, cuotaIndex, estado } = req.body;
    
    const selectSql = 'SELECT cuotas_pagadas FROM numeros_rifa WHERE id = ?';
    db.query(selectSql, [numeroRifaId], (selectErr, selectResult) => {
      if (selectErr) {
        console.error('Error selecting cuotas_pagadas:', selectErr);
        return res.status(500).json({ error: 'Error selecting cuotas_pagadas', details: selectErr.message });
      }

      let cuotasPagadas = {};
      if (selectResult[0] && selectResult[0].cuotas_pagadas) {
        try {
          cuotasPagadas = JSON.parse(selectResult[0].cuotas_pagadas);
        } catch (parseError) {
          console.error('Error parsing cuotas_pagadas:', parseError);
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
          console.error('Error updating cuotas_pagadas:', updateErr);
          return res.status(500).json({ error: 'Error updating cuotas_pagadas', details: updateErr.message });
        }
        return res.status(200).json({ message: 'Quota payment status updated successfully', cuotasPagadas });
      });
    });
  });

  return router;
};