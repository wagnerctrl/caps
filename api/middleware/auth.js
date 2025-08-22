const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'capacita-tg-secret-key-2025';
const JWT_EXPIRES_IN = '7d';

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = { id: decoded.userId, tipo: decoded.userType };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Gerar token JWT
const generateToken = (userId, userType) => {
  return jwt.sign(
    { userId, userType },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verificar token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  generateToken,
  verifyToken,
  JWT_SECRET
};