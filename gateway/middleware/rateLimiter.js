

const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: 60 * 1000, //1menit
  max: 60, //max req         
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Terlalu banyak request. Tunggu 1 menit lalu coba lagi.',
    });
  },
});

module.exports = rateLimiter;