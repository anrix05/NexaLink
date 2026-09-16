/**
 * Role-Based Access Control (RBAC) Middleware for AlumniConnect
 */

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role || req.headers['x-user-role'];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Access forbidden. Required role: ${allowedRoles.join(' or ')}. Current role: ${userRole || 'none'}`
      });
    }
    next();
  };
}

module.exports = {
  requireRole
};
