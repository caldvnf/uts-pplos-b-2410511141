require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimiter    = require('./middleware/rateLimiter');
const authMiddleware = require('./middleware/authMiddleware');

const app  = express();
const PORT = process.env.PORT || 4000;

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gateway', timestamp: new Date() });
});

// Public paths
const publicPaths = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/oauth/github',
  '/api/auth/oauth/github/callback',
];

app.use((req, res, next) => {
  const isPublic = publicPaths.some(path => req.path.startsWith(path));
  if (isPublic) return next();
  return authMiddleware(req, res, next);
});

// Konfigurasi proxy — tanpa express.json() supaya body tidak dikonsumsi
const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  selfHandleResponse: false,
  proxyTimeout: 60000,
  timeout: 60000,
  on: {
    error: (err, req, res) => {
      console.error('[Proxy Error]', err.message);
      if (!res.headersSent) {
        res.status(502).json({ status: 'error', message: 'Service tidak tersedia' });
      }
    },
  },
});

// Routing
app.use('/api/auth', createProxyMiddleware({
  ...proxyOptions(process.env.AUTH_SERVICE_URL || 'http://auth-service:3000'),
  pathRewrite: { '^/api/auth': '' },
}));

app.use('/api/users', createProxyMiddleware({
  ...proxyOptions(process.env.AUTH_SERVICE_URL || 'http://auth-service:3000'),
  pathRewrite: { '^/api/users': '/users' },
}));

app.use('/api/events', createProxyMiddleware({
  ...proxyOptions(process.env.EVENT_SERVICE_URL || 'http://event-service:8080'),
  pathRewrite: { '^/api/events': '/events' },
}));

app.use('/api/tickets', createProxyMiddleware({
  ...proxyOptions(process.env.TICKET_SERVICE_URL || 'http://ticket-service:3000'),
  pathRewrite: { '^/api/tickets': '/tickets' },
}));

// 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.path} tidak ditemukan`,
  });
});

app.listen(PORT, () => {
  console.log(`[Gateway] Berjalan di port ${PORT}`);
});