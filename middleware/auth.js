const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Check if it's an admin token or user token
    if (decoded.adminId) {
      req.admin = decoded;
    } else if (decoded.userId) {
      req.user = decoded;
    } else {
      return res.status(403).json({ error: 'Invalid token format' });
    }
    
    next();
  });
};

module.exports = { authenticateToken }; 