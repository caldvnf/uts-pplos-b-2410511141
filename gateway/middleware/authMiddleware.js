// validasi JWT sblm req ke service

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Ambil token dari header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Akses ditolak. Token tidak ditemukan.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // info user ke service tujuan lewat header
    req.headers['x-user-id']    = String(decoded.user_id);
    req.headers['x-user-email'] = decoded.email;
    req.headers['x-user-role']  = decoded.role || 'user';

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token sudah kadaluarsa. Silakan refresh token.',
      });
    }
    return res.status(403).json({
      status: 'error',
      message: 'Token tidak valid.',
    });
  }
};

module.exports = authMiddleware;