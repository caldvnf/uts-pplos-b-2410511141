require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const routes       = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes 
app.use('/', routes);

// 404 
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint ${req.method} ${req.path} tidak ditemukan`,
  });
});

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server',
  });
});

app.listen(PORT, () => {
  console.log(`[Auth Service] Berjalan di port ${PORT}`);
});