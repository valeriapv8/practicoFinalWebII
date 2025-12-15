const express = require('express');
const cors = require('cors');
require('dotenv').config();
const initializeDatabase = require('./initializers');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas
app.use('/api', routes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Eventos funcionando correctamente',
    version: '1.0.0'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  // Manejar error de payload demasiado grande
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'El archivo es demasiado grande. Por favor, usa una imagen más pequeña.'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicializar base de datos y servidor
const startServer = async () => {
  try {
    // Inicializar base de datos y crear admin
    await initializeDatabase();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      // Servidor iniciado
    });
  } catch (error) {
    process.exit(1);
  }
};

startServer();

module.exports = app;

