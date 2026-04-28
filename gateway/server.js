const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimiter = require('./middleware/rateLimiter');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 4000;

// middleware global
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(rateLimiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gateway',
    timestamp: new Date(),
  });
});

const publicPaths = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/oauth/github',
  '/api/auth/oauth/github/callback',
];

// yg wajib pake jwt
app.use((req, res, next) => {
  const isPublic = publicPaths.some(path => req.path.startsWith(path));
  if (isPublic) return next();
  return authMiddleware(req, res, next);
});

// auth-service 
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' },
  on: {
    error: (err, req, res) => {
      res.status(502).json({
        status: 'error',
        message: 'Auth service tidak tersedia',
      });
    },
  },
}));

// auth-service (users)
app.use('/api/users', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' },
}));

// event-service 
app.use('/api/events', createProxyMiddleware({
  target: process.env.EVENT_SERVICE_URL || 'http://event-service:8080',
  changeOrigin: true,
  pathRewrite: { '^/api/events': '/events' },
  on: {
    error: (err, req, res) => {
      res.status(502).json({
        status: 'error',
        message: 'Event service tidak tersedia',
      });
    },
  },
}));

// ticket-service 
app.use('/api/tickets', createProxyMiddleware({
  target: process.env.TICKET_SERVICE_URL || 'http://ticket-service:3000',
  changeOrigin: true,
  pathRewrite: { '^/api/tickets': '/tickets' },
  on: {
    error: (err, req, res) => {
      res.status(502).json({
        status: 'error',
        message: 'Ticket service tidak tersedia',
      });
    },
  },
}));

// 404 klo route gk dikenal
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.path} tidak ditemukan di gateway`,
  });
});

app.listen(PORT, () => {
  console.log(`[Gateway] Berjalan di port ${PORT}`);
});