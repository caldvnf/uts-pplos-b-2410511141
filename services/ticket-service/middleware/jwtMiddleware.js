const jwt = require('jsonwebtoken');

const jwtMiddleware = (req, res, next) => {
  const userIdFromGateway = req.headers['x-user-id'];

  if (userIdFromGateway) {
    req.user = {
      user_id: parseInt(userIdFromGateway),
      email:   req.headers['x-user-email'],
      role:    req.headers['x-user-role'] || 'user',
    };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Token tidak ditemukan',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token kadaluarsa',
      });
    }
    return res.status(403).json({
      status: 'error',
      message: 'Token tidak valid',
    });
  }
};

module.exports = jwtMiddleware;