// middlewares/roles.js - Verificación de roles
const allowRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado: rol no autorizado' });
    }
    next();
  };
};

// Middlewares específicos para compatibilidad
const isAdmin = allowRoles(['gerente', 'admin']);
const isAlmacenistaOrAdmin = allowRoles(['gerente', 'admin', 'almacenista']);

module.exports = { allowRoles, isAdmin, isAlmacenistaOrAdmin };