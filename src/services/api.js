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

// Get prizes for a raffle
app.get("/premios/:rifaId", (req, res) => {
  const sql = 'SELECT premios FROM rifas WHERE id = ?';
  db.query(sql, [req.params.rifaId], (err, data) => {
    if (err) {
      console.error('Error fetching prizes:', err);
      return res.status(500).json({ error: 'Error fetching prizes', details: err.message });
    }
    if (data.length === 0) {
      return res.status(404).json({ error: 'Raffle not found' });
    }
    try {
      const premios = JSON.parse(data[0].premios || '{}');
      return res.json(premios);
    } catch (parseError) {
      console.error('Error parsing prizes JSON:', parseError);
      return res.status(500).json({ error: 'Error parsing prizes data', details: parseError.message });
    }
  });
});

// Save prizes for a raffle
app.post("/guardarPremios", (req, res) => {
  const { rifaId, premios } = req.body;
  
  if (!rifaId || !premios) {
    return res.status(400).json({ error: 'rifaId and premios are required' });
  }

  const sql = 'UPDATE rifas SET premios = ? WHERE id = ?';
  
  db.query(sql, [JSON.stringify(premios), rifaId], (err, result) => {
    if (err) {
      console.error('Error saving prizes:', err);
      return res.status(500).json({ error: 'Error saving prizes', details: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Raffle not found' });
    }
    
    return res.status(200).json({ message: 'Prizes saved successfully' });
  });
});

// Create a new raffle
app.post('/crearRifa', (req, res) => {
  console.log('Received request to create raffle:', req.body);
  const { nombre, organizacion_id, rangoInicio, rangoFin, crearBonos, cantidadBonos, cuotas, valorCuota, mesInicio } = req.body;
  const numeros = rangoFin - rangoInicio + 1;
  const sql = `INSERT INTO rifas (nombre, organizacion_id, numeros, crearBonos, cantidadBonos, cuotas, valorCuota, mesInicio, rangoInicio, rangoFin) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [nombre, organizacion_id, numeros, crearBonos, cantidadBonos, Math.min(12, cuotas), valorCuota, mesInicio, rangoInicio, rangoFin], (err, result) => {
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

// Get all raffles
app.get('/rifas', (req, res) => {
  const sql = 'SELECT r.*, o.nombre as organizacion_nombre FROM rifas r LEFT JOIN organizaciones o ON r.organizacion_id = o.id';
  db.query(sql, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

// Get raffle numbers
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

// Get collectors by organization
app.get('/cobradoresPorOrganizacion/:organizacionId', (req, res) => {
  console.log('Fetching collectors for organization:', req.params.organizacionId);
  const sql = 'SELECT * FROM cobradores WHERE organizacion_id = ?';
  db.query(sql, [req.params.organizacionId], (err, data) => {
    if (err) {
      console.error('Error fetching collectors:', err);
      return res.status(500).json({ error: 'Error getting collectors', details: err.message });
    }
    console.log('Collectors found:', data.length);
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

// Update collector
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

// Get vendors by organization
app.get('/vendedoresPorOrganizacion/:organizacionId', (req, res) => {
  const sql = 'SELECT * FROM vendedores WHERE organizacion_id = ?';
  db.query(sql, [req.params.organizacionId], (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

// Get raffle numbers by collector
app.get('/numerosRifaPorCobrador/:rifaId/:cobradorId', (req, res) => {
  const { rifaId, cobradorId } = req.params;
  const sql = `
    SELECT nr.id, nr.numero, nr.cuotas_pagadas, v.nombre as vendedor_nombre
    FROM numeros_rifa nr
    LEFT JOIN vendedores v ON nr.vendedor_id = v.id
    WHERE nr.rifa_id = ? AND nr.cobrador_id = ?
    ORDER BY nr.numero
  `;
  
  db.query(sql, [rifaId, cobradorId], (err, data) => {
    if (err) {
      console.error('Error getting raffle numbers for collector:', err);
      return res.status(500).json({ error: 'Error getting raffle numbers', details: err.message });
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

// Get raffle numbers by vendor and raffle
app.get('/numerosRifaPorVendedor/:rifaId/:vendedorId', (req, res) => {
  const { rifaId, vendedorId } = req.params;
  console.log(`Searching for raffle numbers for raffle ${rifaId} and vendor ${vendedorId}`);

  if (!rifaId || !vendedorId) {
    console.error("Missing rifaId or vendedorId parameters");
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const sql = `
    SELECT nr.id, nr.numero, nr.cuotas_pagadas
    FROM numeros_rifa nr
    WHERE nr.rifa_id = ? AND nr.vendedor_id = ?
    ORDER BY nr.numero
  `;

  db.query(sql, [rifaId, vendedorId], (err, data) => {
    if (err) {
      console.error("Error searching for raffle numbers:", err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
    console.log("Raffle numbers found:", data.length);
    if (data.length === 0) {
      console.log("No raffle numbers found for this combination of raffle and vendor");
    }
    return res.json(data);
  });
});

app.use(errorHandler);

// Start the server
app.listen(4000, () => {
  console.log("Server running on port 4000");
});