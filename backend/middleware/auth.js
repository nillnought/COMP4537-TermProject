const jwt = require('jsonwebtoken');

class Auth {
  static verifyToken(req, res, next) {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  static requireRole(type) {
    return (req, res, next) => {
      if (!req.user || req.user.type !== type) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };
  }
}

module.exports = Auth;
