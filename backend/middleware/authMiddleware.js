/**
 * Authentication Middleware for AlumniConnect Backend
 */

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  // Token verification placeholder for Phase 4
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  req.user = { id: 'user-token', role: req.headers['x-user-role'] || 'student' };
  next();
}

module.exports = {
  verifyToken
};
