const { authenticateToken } = require('./auth');

const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    
    // Check if the request has admin data
    if (!req.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  });
};

module.exports = { authenticateAdmin }; 