const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API operativa' });
});

app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now;');
    res.json({
      message: 'Conexión exitosa con Amazon RDS PostgreSQL',
      now: result.rows[0].now
    });
  } catch (err) {
    console.error('Error al consultar PostgreSQL:', err);
    res.status(500).json({ error: 'Error de conexión a la base de datos', details: err.message });
  }
});

// Obtener visitas
app.get('/api/visitas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM visitas ORDER BY creado_en DESC LIMIT 15;');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Agregar visita personalizada
app.post('/api/visitas', async (req, res) => {
  const { origen } = req.body;
  const textoOrigen = origen && origen.trim() ? origen.trim() : 'Visitante Web';
  try {
    const result = await pool.query(
      'INSERT INTO visitas (origen) VALUES ($1) RETURNING *;',
      [textoOrigen]
    );
    res.json({ success: true, nuevo_registro: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor activo en el puerto ${port}`);
});
