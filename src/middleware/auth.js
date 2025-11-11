const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided, authorization denied' 
      });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user info in request object
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };



    //role not identify as instructer issue, in postman autherization key set to student key so throug changing that solved, so to check this only this code is added
    console.log('Decoded token:', decoded);
    console.log('User role in request:', decoded.role);
    console.log("AUTH PASSED ", req.user);
    next();
      } catch (error) {
        return res.status(401).json({ 
          message: 'Token is invalid or expired' 
        });
      }
};

module.exports = auth;