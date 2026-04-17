const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: true, message: 'No autenticado', code: 'UNAUTHORIZED' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: true, message: 'Permisos insuficientes', code: 'FORBIDDEN' });
    }
    next();
  };
};

// Verificar que el usuario accede solo a datos de su empresa
const requireCompanyAccess = (req, res, next) => {
  const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
  if (req.user.role !== 'ADMIN' && companyId && companyId !== req.user.companyId) {
    return res.status(403).json({ error: true, message: 'Acceso no autorizado a esta empresa', code: 'FORBIDDEN' });
  }
  next();
};

module.exports = { requireRole, requireCompanyAccess };
