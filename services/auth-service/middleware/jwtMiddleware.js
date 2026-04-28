const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

const jwtMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Token tidak ditemukan',
    });
  }

  try {
    // cek token sudah diblacklist /blm
    const sudahLogout = await UserModel.cekBlacklist(token);
    if (sudahLogout) {
      return res.status(401).json({
        status: 'error',
        message: 'Token sudah tidak berlaku. Silakan login ulang.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token kadaluarsa. Silakan refresh token.',
      });
    }
    return res.status(403).json({
      status: 'error',
      message: 'Token tidak valid.',
    });
  }
};

module.exports = jwtMiddleware;