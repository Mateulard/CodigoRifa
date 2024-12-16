const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000'
}));

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '', 
  database: 'rifas_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error occurred', details: err.message });
};

// Main route
app.get("/", (req, res) => {
  return res.json("This thing works");
});

// Save prizes for a raffle
app.post("/guardarPremios", (req, res) => {
  const { rifaId, premios } = req.body;
  
  if (!rifaId || !premios) {
    return res.status(400).json({ error: 'rifaId and premios are required' });
  }

  const sql = 'INSERT INTO premios (rifa_id, fecha, tipo, orden, numero_ganador, premio) VALUES ?';
  const values = premios.map(p => [rifaId, p.fecha, p.tipo, p.orden, p.numeroGanador, p.premio]);
  
  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('Error saving prizes:', err);
      return res.status(500).json({ error: 'Error saving prizes', details: err.message });
    }
    
    return res.status(200).json({ message: 'Prizes saved successfully' });
  });
});

// Get prizes for a raffle
app.get("/premios/:rifaId", (req, res) => {
  const { rifaId } = req.params;
  const sql = 'SELECT * FROM premios WHERE rifa_id = ? ORDER BY fecha, tipo, orden';
  
  db.query(sql, [rifaId], (err, result) => {
    if (err) {
      console.error('Error fetching prizes:', err);
      return res.status(500).json({ error: 'Error fetching prizes', details: err.message });
    }
    
    return res.status(200).json(result);
  });
});

// Create a raffle
app.post('/crearRifa', (req, res) => {
  console.log('Received request to create raffle:', req.body);
  const { nombre, organizacion_id, rangoInicio, rangoFin, crearBonos, cantidadBonos, cuotas, valorCuota, mesInicio, tiposPremios } = req.body;
  const numeros = rangoFin - rangoInicio + 1;
  const sql = `INSERT INTO rifas (nombre, organizacion_id, numeros, crearBonos, cantidadBonos, cuotas, valorCuota, mesInicio, rangoInicio, rangoFin, tiposPremios) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [nombre, organizacion_id, numeros, crearBonos, cantidadBonos, Math.min(12, cuotas), valorCuota, mesInicio, rangoInicio, rangoFin, JSON.stringify(tiposPremios)], (err, result) => {
    if (err) {
      console.error('Error inserting into rifas table:', err);
      return res.status(500).json({error: err.message, sqlMessage: err.sqlMessage});
    }
    
    console.log('Raffle inserted successfully. ID:', result.insertId);
    const rifaId = result.insertId;
    const numerosInsert = [];
    for (let i = rangoInicio; i <= rangoFin; i++) {
      numerosInsert.push([rifaId, i]);
    }
    
    const sqlNumeros = `INSERT INTO numeros_rifa (rifa_id, numero) VALUES ?`;
    db.query(sqlNumeros, [numerosInsert], (err, result) => {
      if (err) {
        console.error('Error inserting raffle numbers:', err);
        return res.status(500).json({error: err.message, sqlMessage: err.sqlMessage});
      }
      console.log('Raffle numbers inserted successfully');
      return res.status(200).json({ message: 'Raffle created successfully', rifaId: rifaId });
    });
  });
});

// Modificación en la ruta para obtener rifas
app.get('/rifas', (req, res) => {
  const sql = 'SELECT r.*, o.nombre as organizacion_nombre FROM rifas r LEFT JOIN organizaciones o ON r.organizacion_id = o.id';
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching rifas:', err);
      return res.status(500).json({ error: 'Error getting rifas', details: err.message });
    }
    console.log('Rifas found:', data.length);
    return res.json(data);
  });
});

// Modificación en la ruta para obtener números de rifa
app.get('/numerosRifa/:rifaId', (req, res) => {
  const sql = `
    SELECT nr.*, v.nombre as vendedor_nombre, c.nombre as cobrador_nombre
    FROM numeros_rifa nr 
    LEFT JOIN vendedores v ON nr.vendedor_id = v.id 
    LEFT JOIN cobradores c ON nr.cobrador_id = c.id
    WHERE nr.rifa_id = ?
    ORDER BY nr.numero
  `;
  
  db.query(sql, [req.params.rifaId], (err, data) => {
    if (err) {
      console.error('Error getting raffle numbers:', err);
      return res.status(500).json({ error: 'Error getting raffle numbers', details: err.message });
    }
    console.log('Raffle numbers found:', data.length);
    return res.json(data);
  });
});
// Update vendor assignment
app.post('/actualizarVendedor', (req, res) => {
  const { numeroRifaId, vendedorId } = req.body;
  const sql = 'UPDATE numeros_rifa SET vendedor_id = ? WHERE id = ?';
  
  db.query(sql, [vendedorId || null, numeroRifaId], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json({ message: 'Vendor assignment updated successfully' });
  });
});

// Update quota payment status
app.post('/actualizarCuotaPagada', (req, res) => {
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

// Modificación en la ruta para obtener cobradores por organización
app.get('/cobradoresPorOrganizacion/:organizacionId', (req, res) => {
  const { organizacionId } = req.params;
  console.log('Fetching cobradores for organizacion:', organizacionId);
  const sql = 'SELECT * FROM cobradores WHERE organizacion_id = ?';
  db.query(sql, [organizacionId], (err, data) => {
    if (err) {
      console.error('Error fetching cobradores:', err);
      return res.status(500).json({ error: 'Error getting cobradores', details: err.message });
    }
    console.log('Cobradores found:', data.length);
    return res.json(data);
  });
});

// Assign vendor to a range
app.post('/asignarVendedorRango', (req, res) => {
  const { rifaId, vendedorId, rangoInicio, rangoFin } = req.body;
  const sql = 'UPDATE numeros_rifa SET vendedor_id = ? WHERE rifa_id = ? AND numero BETWEEN ? AND ?';
  db.query(sql, [vendedorId, rifaId, rangoInicio, rangoFin], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error assigning vendor to range', details: err.message });
    return res.json({ message: 'Vendor assigned to range successfully', affectedRows: result.affectedRows });
  });
});

// Assign collector to a range
app.post('/asignarCobradorRango', (req, res) => {
  const { rifaId, cobradorId, rangoInicio, rangoFin } = req.body;
  const sql = 'UPDATE numeros_rifa SET cobrador_id = ? WHERE rifa_id = ? AND numero BETWEEN ? AND ?';
  db.query(sql, [cobradorId, rifaId, rangoInicio, rangoFin], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error assigning collector to range', details: err.message });
    return res.json({ message: 'Collector assigned to range successfully', affectedRows: result.affectedRows });
  });
});

// Modificación en la ruta para actualizar el cobrador
app.post('/actualizarCobrador', (req, res) => {
  const { numeroRifaId, cobradorId } = req.body;
  console.log('Updating collector:', { numeroRifaId, cobradorId });

  const sql = 'UPDATE numeros_rifa SET cobrador_id = ? WHERE id = ?';
  db.query(sql, [cobradorId || null, numeroRifaId], (err, result) => {
    if (err) {
      console.error('Error updating collector:', err);
      return res.status(500).json({ error: 'Error updating collector', details: err.message });
    }
    console.log('Collector updated successfully:', result);
    return res.status(200).json({ message: 'Collector updated successfully', affectedRows: result.affectedRows });
  });
});
// Modificación en la ruta para obtener vendedores por organización
app.get('/vendedoresPorOrganizacion/:organizacionId', (req, res) => {
  const { organizacionId } = req.params;
  console.log('Fetching vendedores for organizacion:', organizacionId);
  const sql = 'SELECT * FROM vendedores WHERE organizacion_id = ?';
  db.query(sql, [organizacionId], (err, data) => {
    if (err) {
      console.error('Error fetching vendedores:', err);
      return res.status(500).json({ error: 'Error getting vendedores', details: err.message });
    }
    console.log('Vendedores found:', data.length);
    return res.json(data);
  });
});

// Modificar este endpoint para incluir el método de pago en la respuesta
app.get('/numerosRifaPorCobrador/:rifaId/:cobradorId', (req, res) => {
  const { rifaId, cobradorId } = req.params;
  console.log(`Buscando números de rifa para la rifa ${rifaId} y cobrador ${cobradorId}`);

  const sql = `
    SELECT nr.id, nr.numero, nr.cuotas_pagadas, nr.metodo_pago, v.nombre as vendedor_nombre
    FROM numeros_rifa nr
    LEFT JOIN vendedores v ON nr.vendedor_id = v.id
    WHERE nr.rifa_id = ? AND nr.cobrador_id = ?
    ORDER BY nr.numero
  `;

  db.query(sql, [rifaId, cobradorId], (err, data) => {
    if (err) {
      console.error("Error buscando números de rifa:", err);
      return res.status(500).json({ error: 'Error del servidor', details: err.message });
    }
    console.log("Números de rifa encontrados:", data.length);
    if (data.length === 0) {
      console.log("No se encontraron números de rifa para esta combinación de rifa y cobrador");
    }
    return res.json(data);
  });
});

// Calculate commission for a collector
app.get('/calcularComisionCobrador/:rifaId/:cobradorId', (req, res) => {
  const { rifaId, cobradorId } = req.params;

  const sqlRifaCobrador = `
    SELECT r.valorCuota, r.cuotas, c.comisiones, r.nombre as rifa_nombre, c.nombre as cobrador_nombre
    FROM rifas r
    JOIN cobradores c ON c.organizacion_id = r.organizacion_id
    WHERE r.id = ? AND c.id = ?
  `;

  db.query(sqlRifaCobrador, [rifaId, cobradorId], (err, rifaCobradorData) => {
    if (err) {
      console.error('Error getting rifa and cobrador data:', err);
      return res.status(500).json({ error: 'Error getting rifa and cobrador data', details: err.message });
    }
    
    if (rifaCobradorData.length === 0) {
      return res.status(404).json({ error: 'Rifa or cobrador not found' });
    }

    const { valorCuota, cuotas, comisiones, rifa_nombre, cobrador_nombre } = rifaCobradorData[0];

    const sqlNumerosRifa = `
      SELECT nr.cuotas_pagadas, v.nombre as vendedor_nombre
      FROM numeros_rifa nr
      LEFT JOIN vendedores v ON nr.vendedor_id = v.id
      WHERE nr.rifa_id = ? AND nr.cobrador_id = ?
    `;

    db.query(sqlNumerosRifa, [rifaId, cobradorId], (err, numerosRifaData) => {
      if (err) {
        console.error('Error getting raffle numbers:', err);
        return res.status(500).json({ error: 'Error getting raffle numbers', details: err.message });
      }

      let totalCuotasPagadas = 0;
      let vendedoresUnicos = new Set();
      numerosRifaData.forEach(numero => {
        if (numero.cuotas_pagadas) {
          const cuotasPagadas = JSON.parse(numero.cuotas_pagadas);
          totalCuotasPagadas += Object.values(cuotasPagadas).filter(Boolean).length;
        }
        if (numero.vendedor_nombre) {
          vendedoresUnicos.add(numero.vendedor_nombre);
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
          rifa_nombre,
          cobrador_nombre,
          numerosTotales,
          cuotasPagadas: totalCuotasPagadas,
          cuotasComisionables,
          valorCuota,
          porcentajeComision: comisiones,
          vendedoresUnicos: Array.from(vendedoresUnicos)
        }
      });
    });
  });
});

// Calculate commission for a vendor
app.get('/calcularComision/:rifaId/:vendedorId', (req, res) => {
  const { rifaId, vendedorId } = req.params;

  const sqlRifaVendedor = `
    SELECT r.valorCuota, r.cuotas, v.comisiones, r.nombre as rifa_nombre, v.nombre as vendedor_nombre
    FROM rifas r
    JOIN vendedores v ON v.organizacion_id = r.organizacion_id
    WHERE r.id = ? AND v.id = ?
  `;

  db.query(sqlRifaVendedor, [rifaId, vendedorId], (err, rifaVendedorData) => {
    if (err) {
      console.error('Error getting rifa and vendedor data:', err);
      return res.status(500).json({ error: 'Error getting rifa and vendedor data', details: err.message });
    }
    
    if (rifaVendedorData.length === 0) {
      return res.status(404).json({ error: 'Rifa or vendedor not found' });
    }

    const { valorCuota, cuotas, comisiones, rifa_nombre, vendedor_nombre } = rifaVendedorData[0];

    const sqlNumerosRifa = `
      SELECT nr.cuotas_pagadas
      FROM numeros_rifa nr
      WHERE nr.rifa_id = ? AND nr.vendedor_id = ?
    `;

    db.query(sqlNumerosRifa, [rifaId, vendedorId], (err, numerosRifaData) => {
      if (err) {
        console.error('Error getting raffle numbers:', err);
        return res.status(500).json({ error: 'Error getting raffle numbers', details: err.message });
      }

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
      const comisionTotal = totalVentas * (comisiones / 100);

      res.json({
        totalVentas,
        comisionTotal,
        detalles: {
          rifa_nombre,
          vendedor_nombre,
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

// Get vendors
app.get('/vendedores', (req, res) => {
  let sql = 'SELECT * FROM vendedores';
  let params = [];

  if (req.query.organizacion_id === 'null') {
    sql += ' WHERE organizacion_id IS NULL';
  } else if (req.query.organizacion_id) {
    sql += ' WHERE organizacion_id = ?';
    params.push(req.query.organizacion_id);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    return res.json(results);
  });
});

// Get collectors
app.get('/cobradores', (req, res) => {
  let sql = 'SELECT * FROM cobradores';
  let params = [];

  if (req.query.organizacion_id === 'null') {
    sql += ' WHERE organizacion_id IS NULL';
  } else if (req.query.organizacion_id) {
    sql += ' WHERE organizacion_id = ?';
    params.push(req.query.organizacion_id);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    return res.json(results);
  });
});

// Get organizations
app.get('/organizaciones', (req, res) => {
  const sql = 'SELECT * FROM organizaciones';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    return res.json(results);
  });
});

// Create a collector
app.post('/cobradores', (req, res) => {
  const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
  const sql = 'INSERT INTO cobradores (nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Collector created successfully');
  });
});

// Update a collector
app.put('/cobradores/:id', (req, res) => {
  const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
  const sql = 'UPDATE cobradores SET nombre = ?, dni = ?, direccion = ?, localidad = ?, telefono = ?, cargo = ?, comisiones = ?, email = ?, organizacion_id = ? WHERE id = ?';
  
  db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id, req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Collector updated successfully');
  });
});

// Delete a collector
app.delete('/cobradores/:id', (req, res) => {
  const sql = 'DELETE FROM cobradores WHERE id = ?';
  
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Collector deleted successfully');
  });
});

// Create a vendor
app.post('/vendedores', (req, res) => {
  const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
  const sql = 'INSERT INTO vendedores (nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error creating vendor' });
    return res.status(200).json({ message: 'Vendor created successfully' });
  });
});

// Update a vendor
app.put('/vendedores/:id', (req, res) => {
  const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
  const sql = 'UPDATE vendedores SET nombre = ?, dni = ?, direccion = ?, localidad = ?, telefono = ?, cargo = ?, comisiones = ?, email = ?, organizacion_id = ? WHERE id = ?';
  
  db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id, req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Vendor updated successfully');
  });
});

// Delete a vendor
app.delete('/vendedores/:id', (req, res) => {
  const sql = 'DELETE FROM vendedores WHERE id = ?';
  
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Vendor deleted successfully');
  });
});

// Create an organization
app.post('/organizaciones', (req, res) => {
  const { nombre, Cuit, direccion, localidad, telefono, comisiones, email } = req.body;
  const sql = 'INSERT INTO organizaciones (nombre, Cuit, direccion, localidad, telefono, comisiones, email) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [nombre, Cuit, direccion, localidad, telefono, comisiones, email], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error creating organization' });
    return res.status(200).json({ message: 'Organization created successfully' });
  });
});

// Update an organization
app.put('/organizaciones/:id', (req, res) => {
  const { nombre, Cuit, direccion, localidad, telefono, comisiones, email } = req.body;
  const sql = 'UPDATE organizaciones SET nombre = ?, Cuit = ?, direccion = ?, localidad = ?, telefono = ?, comisiones = ?, email = ? WHERE id = ?';
  
  db.query(sql, [nombre, Cuit, direccion, localidad, telefono, comisiones, email, req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Organization updated successfully');
  });
});

// Delete an organization
app.delete('/organizaciones/:id', (req, res) => {
  const sql = 'DELETE FROM organizaciones WHERE id = ?';
  
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Organization deleted successfully');
  });
});

// Modificar este endpoint para incluir el método de pago en la respuesta
app.get('/numerosRifaPorVendedor/:rifaId/:vendedorId', (req, res) => {
  const { rifaId, vendedorId } = req.params;
  console.log(`Buscando números de rifa para la rifa ${rifaId} y vendedor ${vendedorId}`);

  const sql = `
    SELECT nr.id, nr.numero, nr.cuotas_pagadas, nr.metodo_pago
    FROM numeros_rifa nr
    WHERE nr.rifa_id = ? AND nr.vendedor_id = ?
    ORDER BY nr.numero
  `;

  db.query(sql, [rifaId, vendedorId], (err, data) => {
    if (err) {
      console.error("Error buscando números de rifa:", err);
      return res.status(500).json({ error: 'Error del servidor', details: err.message });
    }
    console.log("Números de rifa encontrados:", data.length);
    if (data.length === 0) {
      console.log("No se encontraron números de rifa para esta combinación de rifa y vendedor");
    }
    return res.json(data);
  });
});

// Update raffle number information
app.put('/actualizarNumeroRifa/:id', (req, res) => {
  const { id } = req.params;
  const { 
    nombre_comprador,
    fecha_suscripcion,
    direccion,
    barrio,
    localidad,
    telefono,
    fecha_cobro,
    mail
  } = req.body;

  const sql = `
    UPDATE numeros_rifa 
    SET 
      nombre_comprador = ?,
      fecha_suscripcion = ?,
      direccion = ?,
      barrio = ?,
      localidad = ?,
      telefono = ?,
      fecha_cobro = ?,
      mail = ?
    WHERE id = ?
  `;

  db.query(
    sql, 
    [nombre_comprador, fecha_suscripcion, direccion, barrio, localidad, telefono, fecha_cobro, mail, id],
    (err, result) => {
      if (err) {
        console.error('Error updating raffle number:', err);
        return res.status(500).json({ error: 'Error updating raffle number', details: err.message });
      }
      return res.json({ message: 'Raffle number updated successfully' });
    }
  );
});

app.post('/consignarCuota', (req, res) => {
  const { numeroRifaId, cuotaIndex } = req.body;
  
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

    cuotasPagadas[cuotaIndex] = true;

    const updateSql = 'UPDATE numeros_rifa SET cuotas_pagadas = ? WHERE id = ?';
    db.query(updateSql, [JSON.stringify(cuotasPagadas), numeroRifaId], (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Error updating cuotas_pagadas:', updateErr);
        return res.status(500).json({ error: 'Error updating cuotas_pagadas', details: updateErr.message });
      }
      return res.status(200).json({ message: 'Cuota consignada exitosamente', cuotasPagadas });
    });
  });
});

// Delete a raffle
app.delete('/eliminarRifa/:id', (req, res) => {
  const { id } = req.params;
  
  // First, delete all associated raffle numbers
  const deleteNumbersSql = 'DELETE FROM numeros_rifa WHERE rifa_id = ?';
  db.query(deleteNumbersSql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting raffle numbers:', err);
      return res.status(500).json({ error: 'Error deleting raffle numbers', details: err.message });
    }
    
    // Then, delete the raffle itself
    const deleteRaffaSql = 'DELETE FROM rifas WHERE id = ?';
    db.query(deleteRaffaSql, [id], (err, result) => {
      if (err) {
        console.error('Error deleting raffle:', err);
        return res.status(500).json({ error: 'Error deleting raffle', details: err.message });
      }
      return res.json({ message: 'Raffle and associated numbers deleted successfully' });
    });
  });
});


app.post('/actualizarMetodoPago', (req, res) => {
  const { numeroRifaId, metodoPago } = req.body;
  
  if (!numeroRifaId || metodoPago === undefined) {
    console.error('Faltan parámetros requeridos para actualizarMetodoPago');
    return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos.' });
  }

  const query = 'UPDATE numeros_rifa SET metodo_pago = ? WHERE id = ?';
  db.query(query, [metodoPago, numeroRifaId], (err, result) => {
    if (err) {
      console.error('Error al actualizar método de pago:', err);
      return res.status(500).json({ success: false, message: 'Error al actualizar método de pago.' });
    }
    
    if (result.affectedRows === 0) {
      console.warn(`No se encontró el número de rifa con ID ${numeroRifaId}`);
      return res.status(404).json({ success: false, message: 'Número de rifa no encontrado.' });
    }

    console.log(`Método de pago actualizado para el número de rifa ${numeroRifaId}`);
    res.json({ success: true, message: 'Método de pago actualizado con éxito.' });
  });
});
// Get raffle details
app.get('/detallesRifa/:rifaId', (req, res) => {
  const { rifaId } = req.params;
  const sql = `
    SELECT r.*, o.nombre as organizacion_nombre FROM rifas r LEFT JOIN organizaciones o ON r.organizacion_id = o.id WHERE r.id = ?`;

  db.query(sql, [rifaId], (err, result) => {
    if (err) {
      console.error('Error fetching raffle details:', err);
      return res.status(500).json({ error: 'Error fetching raffle details', details: err.message });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: 'Raffle not found' });
    }
    const raffle = result[0];
    if (raffle.tiposPremios) {
      try {
        raffle.tiposPremios = JSON.parse(raffle.tiposPremios);
      } catch (parseError) {
        console.error('Error parsing tiposPremios:', parseError);
        raffle.tiposPremios = {};
      }
    }
    return res.json(raffle);
  });
});
// Modificar este endpoint para devolver los métodos de pago
app.get('/metodosPago/:rifaId', (req, res) => {
  const { rifaId } = req.params;
  console.log(`Obteniendo métodos de pago para la rifa ID: ${rifaId}`);
  const sql = `
    SELECT DISTINCT metodo_pago
    FROM numeros_rifa
    WHERE rifa_id = ? AND metodo_pago IS NOT NULL AND metodo_pago != ''
  `;
  
  db.query(sql, [rifaId], (err, result) => {
    if (err) {
      console.error('Error al obtener métodos de pago:', err);
      return res.status(500).json({ error: 'Error al obtener métodos de pago', details: err.message });
    }
    const metodosPago = result.map(row => row.metodo_pago);
    console.log(`Métodos de pago encontrados:`, metodosPago);
    return res.json(metodosPago);
  });
});
// Search for a winner by raffle number
app.get('/buscarGanador/:rifaId/:numero', (req, res) => {
  const { rifaId, numero } = req.params;
  const sql = `
    SELECT nr.*, v.nombre as vendedor_nombre, c.nombre as cobrador_nombre
    FROM numeros_rifa nr 
    LEFT JOIN vendedores v ON nr.vendedor_id = v.id 
    LEFT JOIN cobradores c ON nr.cobrador_id = c.id
    WHERE nr.rifa_id = ? AND nr.numero = ?
  `;
  
  db.query(sql, [rifaId, numero], (err, result) => {
    if (err) {
      console.error('Error searching for winner:', err);
      return res.status(500).json({ error: 'Error searching for winner', details: err.message });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: 'Number not found' });
    }
    return res.json(result[0]);
  });
});


app.use(errorHandler);

// Start the server
app.listen(4000, () => {
  console.log("Server running on port 4000");
});

