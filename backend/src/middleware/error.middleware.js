/**
 * Middleware centralizado de manejo de errores
 */
export function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err.message);

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Error interno del servidor',
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
}
