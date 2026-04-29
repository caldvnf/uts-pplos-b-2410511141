// server.js — Entry point ticket-service

require('dotenv').config();
const express = require('express');
const routes  = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route
app.use('/tickets', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ticket-service' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status:  'error',
    message: `Endpoint ${req.method} ${req.path} tidak ditemukan`,
  });
});

app.listen(PORT, () => {
  console.log(`[Ticket Service] Berjalan di port ${PORT}`);
});