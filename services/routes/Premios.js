const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Obtener premios de una rifa
  router.get('/:rifaId', (req, res) => {
    const sql = 'SELECT premios FROM rifas WHERE id = ?';
    db.query(sql, [req.params.rifaId], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.json(data[0]?.premios ? JSON.parse(data[0].premios) : []);
    });
  });

  // Guardar premios de una rifa
  router.post('/guardar', (req, res) => {
    const { rifaId, premios } = req.body;
    const sql = 'UPDATE rifas SET premios = ? WHERE id = ?';
    db.query(sql, [JSON.stringify(premios), rifaId], (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json({ message: 'Premios guardados exitosamente' });
    });
  });

  return router;
};