// query database

const db = require('../config/database');

const UserModel = {

  // cari berdasarkan email
  async cariByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND is_aktif = 1 LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  // cari berdasarkan ID
  async cariById(id) {
    const [rows] = await db.execute(
      'SELECT id, nama, email, role, foto_profil, oauth_provider, dibuat_pada FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  // buat user baru
  async buat(data) {
    const { nama, email, password, role, foto_profil, oauth_provider } = data;
    const [result] = await db.execute(
      'INSERT INTO users (nama, email, password, role, foto_profil, oauth_provider) VALUES (?, ?, ?, ?, ?, ?)',
      [nama, email, password || null, role || 'user', foto_profil || null, oauth_provider || null]
    );
    return result.insertId;
  },

  // simpan refresh token
  async simpanRefreshToken(user_id, token, expired_at) {
    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token, expired_at) VALUES (?, ?, ?)',
      [user_id, token, expired_at]
    );
  },

  // cari refresh token
  async cariRefreshToken(token) {
    const [rows] = await db.execute(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expired_at > NOW() LIMIT 1',
      [token]
    );
    return rows[0] || null;
  },

  // hapus refresh token (logout)
  async hapusRefreshToken(token) {
    await db.execute(
      'DELETE FROM refresh_tokens WHERE token = ?',
      [token]
    );
  },

  // blacklist access token (logout)
  async blacklistToken(token, expired_at) {
    await db.execute(
      'INSERT INTO token_blacklist (token, expired_at) VALUES (?, ?)',
      [token, expired_at]
    );
  },

  // cek apakah access token sudah di-blacklist
  async cekBlacklist(token) {
    const [rows] = await db.execute(
      'SELECT id FROM token_blacklist WHERE token = ? LIMIT 1',
      [token]
    );
    return rows.length > 0;
  },

  // cari atau buat user oauth
  async cariOauthAccount(provider, provider_id) {
    const [rows] = await db.execute(
      'SELECT * FROM oauth_accounts WHERE provider = ? AND provider_id = ? LIMIT 1',
      [provider, provider_id]
    );
    return rows[0] || null;
  },

  // simpan akun oauth baru
  async simpanOauthAccount(data) {
    const { user_id, provider, provider_id, provider_email, provider_nama, foto_profil } = data;
    await db.execute(
      `INSERT INTO oauth_accounts 
       (user_id, provider, provider_id, provider_email, provider_nama, foto_profil) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, provider, provider_id, provider_email, provider_nama, foto_profil]
    );
  },
};

module.exports = UserModel;