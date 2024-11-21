const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000'
}));

// Conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '', 
  database: 'rifas_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos MySQL');
  }
});

// Middleware para manejar errores
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ocurrió un error en el servidor', details: err.message });
};

// Ruta principal
app.get("/", (req, res) => {
  return res.json("Esta porquería anda");
});


app.get("/premios/:rifaId", (req, res) => {
  const sql = 'SELECT premios FROM rifas WHERE id = ?';
  db.query(sql, [req.params.rifaId], (err, data) => {
    if (err) return res.json(err);
    return res.json(data[0]?.premios ? JSON.parse(data[0].premios) : []);
  });
});

app.post("/guardarPremios", (req, res) => {
  const { rifaId, premios } = req.body;
  const sql = 'UPDATE rifas SET premios = ? WHERE id = ?';
  db.query(sql, [JSON.stringify(premios), rifaId], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json({ message: 'Premios guardados exitosamente' });
  });
});


app.post('/crearRifa', (req, res) => {
  console.log('Recibida solicitud para crear rifa:', req.body);
  const { nombre, organizacion_id, rangoInicio, rangoFin, crearBonos, cantidadBonos, cuotas, valorCuota, mesInicio } = req.body;
  const numeros = rangoFin - rangoInicio + 1;
  const sql = `INSERT INTO rifas (nombre, organizacion_id, numeros, crearBonos, cantidadBonos, cuotas, valorCuota, mesInicio, rangoInicio, rangoFin) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [nombre, organizacion_id, numeros, crearBonos, cantidadBonos, Math.min(12, cuotas), valorCuota, mesInicio, rangoInicio, rangoFin], (err, result) => {
    if (err) {
      console.error('Error al insertar en la tabla rifas:', err);
      return res.status(500).json({error: err.message, sqlMessage: err.sqlMessage});
    }
    
    console.log('Rifa insertada con éxito. ID:', result.insertId);
    const rifaId = result.insertId;
    const numerosInsert = [];
    for (let i = rangoInicio; i <= rangoFin; i++) {
      numerosInsert.push([rifaId, i]);
    }
    
    const sqlNumeros = `INSERT INTO numeros_rifa (rifa_id, numero) VALUES ?`;
    db.query(sqlNumeros, [numerosInsert], (err, result) => {
      if (err) {
        console.error('Error al insertar números de rifa:', err);
        return res.status(500).json({error: err.message, sqlMessage: err.sqlMessage});
      }
      console.log('Números de rifa insertados con éxito');
      return res.status(200).json({ message: 'Rifa created successfully', rifaId: rifaId });
    });
  });
});

app.get('/rifas', (req, res) => {
  const sql = 'SELECT r.*, o.nombre as organizacion_nombre FROM rifas r LEFT JOIN organizaciones o ON r.organizacion_id = o.id';
  db.query(sql, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});


// Create a new raffle
app.post('/crearRifa', (req, res) => {
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

app.get('/numerosRifa/:rifaId', (req, res) => {
  const sql = `
    SELECT nr.*, v.nombre as vendedor_nombre 
    FROM numeros_rifa nr 
    LEFT JOIN vendedores v ON nr.vendedor_id = v.id 
    WHERE nr.rifa_id = ?
    ORDER BY nr.numero
  `;
  db.query(sql, [req.params.rifaId], (err, data) => {
    if (err) return res.json(err);
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
  
  // First, get the current cuotas_pagadas value
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


    // If unpaying a quota, ensure all following quotas are unpaid
    if (!estado) {
      Object.keys(cuotasPagadas).forEach(key => {
        if (Number(key) > cuotaIndex) {
          cuotasPagadas[key] = false;
        }
      });
    }

    // Update the cuotasPagadas object
    cuotasPagadas[cuotaIndex] = estado;

    // Now update the database with the new cuotas_pagadas value
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


// Agregar este nuevo endpoint para obtener cobradores por organización
app.get('/cobradoresPorOrganizacion/:organizacionId', (req, res) => {
  const sql = 'SELECT * FROM cobradores WHERE organizacion_id = ?';
  db.query(sql, [req.params.organizacionId], (err, data) => {
    if (err) return res.status(500).json({ error: 'Error al obtener cobradores', details: err.message });
    return res.json(data);
  });
});

// Modificar el endpoint existente para asignar vendedores a un rango
app.post('/asignarVendedorRango', (req, res) => {
  const { rifaId, vendedorId, rangoInicio, rangoFin } = req.body;
  const sql = 'UPDATE numeros_rifa SET vendedor_id = ? WHERE rifa_id = ? AND numero BETWEEN ? AND ?';
  db.query(sql, [vendedorId, rifaId, rangoInicio, rangoFin], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al asignar vendedor al rango', details: err.message });
    return res.json({ message: 'Vendedor asignado al rango con éxito', affectedRows: result.affectedRows });
  });
});

// Agregar este nuevo endpoint para asignar cobradores a un rango
app.post('/asignarCobradorRango', (req, res) => {
  const { rifaId, cobradorId, rangoInicio, rangoFin } = req.body;
  const sql = 'UPDATE numeros_rifa SET cobrador_id = ? WHERE rifa_id = ? AND numero BETWEEN ? AND ?';
  db.query(sql, [cobradorId, rifaId, rangoInicio, rangoFin], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al asignar cobrador al rango', details: err.message });
    return res.json({ message: 'Cobrador asignado al rango con éxito', affectedRows: result.affectedRows });
  });
});

// Agregar este nuevo endpoint para actualizar el cobrador de un número de rifa
app.post('/actualizarCobrador', (req, res) => {
  const { numeroRifaId, cobradorId } = req.body;
  const sql = 'UPDATE numeros_rifa SET cobrador_id = ? WHERE id = ?';
  db.query(sql, [cobradorId, numeroRifaId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar cobrador', details: err.message });
    return res.json({ message: 'Cobrador actualizado con éxito', affectedRows: result.affectedRows });
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


// Add these new routes to your existing api.js file

// Get collectors by organization
app.get('/cobradores/:organizacionId', (req, res) => {
  const sql = 'SELECT * FROM cobradores WHERE organizacion_id = ?';
  db.query(sql, [req.params.organizacionId], (err, data) => {
    if (err) return res.status(500).json({ error: 'Error al obtener cobradores', details: err.message });
    return res.json(data);
  });
});

// Get raffle numbers by collector
app.get('/numerosRifaPorCobrador/:rifaId/:cobradorId', (req, res) => {
  const { rifaId, cobradorId } = req.params;
  const sql = `
    SELECT nr.id, nr.numero, nr.cuotas_pagadas
    FROM numeros_rifa nr
    JOIN vendedores v ON nr.vendedor_id = v.id
    WHERE nr.rifa_id = ? AND v.cobrador_id = ?
    ORDER BY nr.numero
  `;
  db.query(sql, [rifaId, cobradorId], (err, data) => {
    if (err) return res.status(500).json({ error: 'Error al obtener números de rifa', details: err.message });
    return res.json(data);
  });
});

// Calculate commission for a collector
app.get('/calcularComisionCobrador/:rifaId/:cobradorId', (req, res) => {
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

// Modify the existing calcularComision endpoint to handle vendors
app.get('/calcularComision/:rifaId/:vendedorId', (req, res) => {
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


// Obtener vendedores
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

// Obtener cobradores
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

// Obtener instituciones
app.get('/organizaciones', (req, res) => {
  const sql = 'SELECT * FROM organizaciones';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    return res.json(results);
  });
});

app.post('/cobradores', (req, res) => {
  const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
  const sql = 'INSERT INTO cobradores (nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Cobrador creado con éxito');
  });
});

app.put('/cobradores/:id', (req, res) => {
  const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
  const sql = 'UPDATE cobradores SET nombre = ?, dni = ?, direccion = ?, localidad = ?, telefono = ?, cargo = ?, comisiones = ?, email = ?, organizacion_id = ? WHERE id = ?';
  
  db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id, req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Cobrador actualizado con éxito');
  });
});

app.delete('/cobradores/:id', (req, res) => {
  const sql = 'DELETE FROM cobradores WHERE id = ?';
  
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Cobrador eliminado con éxito');
  });
});

app.post('/vendedores', (req, res) => {
  const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
  const sql = 'INSERT INTO vendedores (nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error al crear vendedor' });
    return res.status(200).json({ message: 'Vendedor creado con éxito' });
  });
});

app.put('/vendedores/:id', (req, res) => {
  const { nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id } = req.body;
  const sql = 'UPDATE vendedores SET nombre = ?, dni = ?, direccion = ?, localidad = ?, telefono = ?, cargo = ?, comisiones = ?, email = ?, organizacion_id = ? WHERE id = ?';
  
  db.query(sql, [nombre, dni, direccion, localidad, telefono, cargo, comisiones, email, organizacion_id, req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Vendedor actualizado con éxito');
  });
});

app.delete('/vendedores/:id', (req, res) => {
  const sql = 'DELETE FROM vendedores WHERE id = ?';
  
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Vendedor eliminado con éxito');
  });
});

app.post('/organizaciones', (req, res) => {
  const { nombre, Cuit, direccion, localidad, telefono, comisiones, email } = req.body;
  const sql = 'INSERT INTO organizaciones (nombre, Cuit, direccion, localidad, telefono, comisiones, email) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [nombre, Cuit, direccion, localidad, telefono, comisiones, email], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error al crear organización' });
    return res.status(200).json({ message: 'Organización creada con éxito' });
  });
});

app.put('/organizaciones/:id', (req, res) => {
  const { nombre, Cuit, direccion, localidad, telefono, comisiones, email } = req.body;
  const sql = 'UPDATE organizaciones SET nombre = ?, Cuit = ?, direccion = ?, localidad = ?, telefono = ?, comisiones = ?, email = ? WHERE id = ?';
  
  db.query(sql, [nombre, Cuit, direccion, localidad, telefono, comisiones, email, req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Organización actualizada con éxito');
  });
});

app.delete('/organizaciones/:id', (req, res) => {
  const sql = 'DELETE FROM organizaciones WHERE id = ?';
  
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).send('Organización eliminada con éxito');
  });
});

app.use(errorHandler);

// Obtener números de rifa por vendedor y rifa
app.get('/numerosRifaPorVendedor/:rifaId/:vendedorId', (req, res) => {
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
    if (data.length === 0) {
      console.log("No se encontraron números de rifa para esta combinación de rifa y vendedor");
    }
    return res.json(data);
  });
});
// Iniciar el servidor
app.listen(4000, () => {
  console.log("Servidor corriendo en el puerto 4000");
});
