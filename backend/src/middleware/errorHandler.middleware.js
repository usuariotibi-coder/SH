const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: true, message: 'Ya existe un registro con ese valor único', code: 'DUPLICATE' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: true, message: 'Registro no encontrado', code: 'NOT_FOUND' });
    }
  }

  if (err.message === 'Tipo de archivo no permitido') {
    return res.status(400).json({ error: true, message: err.message, code: 'INVALID_FILE_TYPE' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: true, message: 'El archivo excede el límite de 10MB', code: 'FILE_TOO_LARGE' });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: true,
    message: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_ERROR',
  });
};

module.exports = { errorHandler };
