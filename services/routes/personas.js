const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Rutas de Organizaciones
  // Obtener todas las organizaciones
  router.get('/organizaciones', (req, res) => {
    const sql = 'SELECT * FROM organizaciones';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json(err);
      return res.json(results);
    });
  });

  // Crear una nueva organización
  router.post('/organizaciones', (req, res) => {
    const { nombre, Cuit, direccion, localidad, telefono, comisiones, email } = req.body;
    const sql = 'INSERT INTO organizaciones (nombre, Cuit, direccion, localidad, telefono, comisiones, email) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [nombre, Cuit, direccion, localidad, telefono, comisiones, email], (err, result) => {
      if (err) return res.status(500).json({ message: 'Error al crear organización' });
      return res.status(200).json({ message: 'Organización creada con éxito' });
    });
  });

  // Actualizar una organización
  router.put('/organizaciones/:id', (req, res) => {
    const { nombre, Cuit, direccion, localidad, telefono, comisiones, email } = req.body;
    const sql = 'UPDATE organizaciones SET nombre = ?, Cuit = ?, direccion = ?, localidad = ?, telefono = ?, comisiones = ?, email = ? WHERE id = ?';
    
    db.query(sql, [nombre, Cuit, direccion, localidad, telefono, comisiones, email, req.params.id], (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(200).send('Organización actualizada con éxito');
    });
  });

  // Eliminar una organización
  router.delete('/organizaciones/:id', (req, res) => {
    const sql = 'DELETE FROM organizaciones WHERE id = ?';
    
    db.query(sql, [req.params.id], (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(200).send('Organización eliminada con éxito');
    });
  });

  // Rutas de Vendedores
  // Obtener vendedores por organización
  router.get('/vendedores/:organizacionId', (req, res) => {
    let sql = 'SELECT * FROM vendedores';
    let params = [];

    if (req.params.organizacionId === 'null') {
      sql += ' WHERE organizacion_id IS NULL';
    } else if (req.params.organizacionId) {
      sql += ' WHERE organizacion_id = ?';
      params.push(req.params.organizacionId);
    }

    db.query(sql, params, (err, results) => {
      if (err) return res.status(500).json(err);
      return res.json(results);
    });
  });

  // Crear un nuevo vendedor
  router.post('/vendedores', (req, res) => {
    const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
    const sql = 'INSERT INTO vendedores (nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id], (err, result) => {
      if (err) return res.status(500).json({ message: 'Error al crear vendedor' });
      return res.status(200).json({ message: 'Vendedor creado con éxito' });
    });
  });

  // Actualizar un vendedor
  router.put('/vendedores/:id', (req, res) => {
    const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
    const sql = 'UPDATE vendedores SET nombre = ?, dni = ?, direccion = ?, localidad = ?, telefono = ?, cargo = ?, comisiones = ?, email = ?, organizacion_id = ? WHERE id = ?';
    
    db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id, req.params.id], (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(200).send('Vendedor actualizado con éxito');
    });
  });

  // Eliminar un vendedor
  router.delete('/vendedores/:id', (req, res) => {
    const sql = 'DELETE FROM vendedores WHERE id = ?';
    
    db.query(sql, [req.params.id], (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(200).send('Vendedor eliminado con éxito');
    });
  });

  // Rutas de Cobradores
  // Obtener cobradores por organización
  router.get('/cobradores/:organizacionId', (req, res) => {
    let sql = 'SELECT * FROM cobradores';
    let params = [];

    if (req.params.organizacionId === 'null') {
      sql += ' WHERE organizacion_id IS NULL';
    } else if (req.params.organizacionId) {
      sql += ' WHERE organizacion_id = ?';
      params.push(req.params.organizacionId);
    }

    db.query(sql, params, (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener cobradores', details: err.message });
      return res.json(results);
    });
  });

  // Crear un nuevo cobrador
  router.post('/cobradores', (req, res) => {
    const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
    const sql = 'INSERT INTO cobradores (nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id], (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(200).send('Cobrador creado con éxito');
    });
  });

  // Actualizar un cobrador
  router.put('/cobradores/:id', (req, res) => {
    const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
    const sql = 'UPDATE cobradores SET nombre = ?, dni = ?, direccion = ?, localidad = ?, telefono = ?, cargo = ?, comisiones = ?, email = ?, organizacion_id = ? WHERE id = ?';
    
    db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id, req.params.id], (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(200).send('Cobrador actualizado con éxito');
    });
  });

  // Eliminar un cobrador
  router.delete('/cobradores/:id', (req, res) => {
    const sql = 'DELETE FROM cobradores WHERE id = ?';
    
    db.query(sql, [req.params.id], (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(200).send('Cobrador eliminado con éxito');
    });
  });

  return router;
};