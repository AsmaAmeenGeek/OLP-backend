// Middleware to check user role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ 
        message: `Access denied. ${role} role required` 
      });
    }
console.log("ROLE CHECK found:", req.user.role, "| expected:", role);

    next();
  };
};

module.exports = { requireRole };