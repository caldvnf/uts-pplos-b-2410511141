const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  database: process.env.DB_NAME     || 'auth_db',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  waitForConnections: true,
  connectionLimit: 10,  
  queueLimit: 0,
});

pool.getConnection()
  .then(conn => {
    console.log('[Auth DB] Koneksi ke MySQL berhasil');
    conn.release();
  })
  .catch(err => {
    console.error('[Auth DB] Gagal konek ke MySQL:', err.message);
  });

module.exports = pool;