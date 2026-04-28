// logika register, login, refresh, logout, OAuth

const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const axios     = require('axios');
const UserModel = require('../models/UserModel');

// access token 
const buatAccessToken = (user) => {
  return jwt.sign(
    { user_id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: parseInt(process.env.JWT_ACCESS_TTL) || 900 }
  );
};

// buat refresh token 
const buatRefreshToken = (user) => {
  return jwt.sign(
    { user_id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: parseInt(process.env.JWT_REFRESH_TTL) || 604800 }
  );
};

const AuthController = {

  // POST /register 
  async register(req, res) {
    try {
      const { nama, email, password } = req.body;

      if (!nama || !email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Nama, email, dan password wajib diisi',
        });
      }

      if (password.length < 6) {
        return res.status(422).json({
          status: 'error',
          message: 'Password minimal 6 karakter',
        });
      }

      // cek email dh daftar/blm
      const userLama = await UserModel.cariByEmail(email);
      if (userLama) {
        return res.status(409).json({
          status: 'error',
          message: 'Email sudah terdaftar',
        });
      }

      // hash pw 
      const passwordHash = await bcrypt.hash(password, 10);

      const userId = await UserModel.buat({ nama, email, password: passwordHash });
      const userBaru = await UserModel.cariById(userId);

      return res.status(201).json({
        status: 'success',
        message: 'Registrasi berhasil',
        data: userBaru,
      });
    } catch (err) {
      console.error('[Register]', err);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
    }
  },

  // POST /login 
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email dan password wajib diisi',
        });
      }

      const user = await UserModel.cariByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({
          status: 'error',
          message: 'Email atau password salah',
        });
      }

      const passwordCocok = await bcrypt.compare(password, user.password);
      if (!passwordCocok) {
        return res.status(401).json({
          status: 'error',
          message: 'Email atau password salah',
        });
      }

      // buat token
      const accessToken  = buatAccessToken(user);
      const refreshToken = buatRefreshToken(user);

      // hitung waktu expired refresh token
      const expiredAt = new Date();
      expiredAt.setSeconds(expiredAt.getSeconds() + (parseInt(process.env.JWT_REFRESH_TTL) || 604800));

      // simpan refresh token ke DB
      await UserModel.simpanRefreshToken(user.id, refreshToken, expiredAt);

      return res.status(200).json({
        status: 'success',
        message: 'Login berhasil',
        data: {
          access_token:  accessToken,
          refresh_token: refreshToken,
          token_type:    'Bearer',
          expires_in:    parseInt(process.env.JWT_ACCESS_TTL) || 900,
          user: {
            id:    user.id,
            nama:  user.nama,
            email: user.email,
            role:  user.role,
          },
        },
      });
    } catch (err) {
      console.error('[Login]', err);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
    }
  },

  // POST /refresh 
  async refresh(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          status: 'error',
          message: 'Refresh token wajib dikirim',
        });
      }

      const tokenDiDB = await UserModel.cariRefreshToken(refresh_token);
      if (!tokenDiDB) {
        return res.status(401).json({
          status: 'error',
          message: 'Refresh token tidak valid atau sudah expired',
        });
      }

      const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
      const user    = await UserModel.cariById(decoded.user_id);

      if (!user) {
        return res.status(401).json({ status: 'error', message: 'User tidak ditemukan' });
      }

      // access token baru
      const accessTokenBaru = buatAccessToken(user);

      return res.status(200).json({
        status: 'success',
        message: 'Token berhasil diperbarui',
        data: {
          access_token: accessTokenBaru,
          token_type:   'Bearer',
          expires_in:   parseInt(process.env.JWT_ACCESS_TTL) || 900,
        },
      });
    } catch (err) {
      console.error('[Refresh]', err);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
    }
  },

  // POST /logout 
  async logout(req, res) {
    try {
      const authHeader = req.headers['authorization'];
      const accessToken = authHeader && authHeader.split(' ')[1];
      const { refresh_token } = req.body;

      // blacklist access token 
      if (accessToken) {
        const decoded    = jwt.decode(accessToken);
        const expiredAt  = new Date(decoded.exp * 1000);
        await UserModel.blacklistToken(accessToken, expiredAt);
      }

      // hapus refresh token dari DB
      if (refresh_token) {
        await UserModel.hapusRefreshToken(refresh_token);
      }

      return res.status(200).json({
        status: 'success',
        message: 'Logout berhasil',
      });
    } catch (err) {
      console.error('[Logout]', err);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
    }
  },

  // GET /oauth/github
  githubRedirect(req, res) {
    const params = new URLSearchParams({
      client_id:    process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
      scope:        'user:email',
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  },

  // GET /oauth/github/callback 
  async githubCallback(req, res) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ status: 'error', message: 'Code OAuth tidak ditemukan' });
      }

      const tokenResp = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id:     process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        { headers: { Accept: 'application/json' } }
      );

      const githubAccessToken = tokenResp.data.access_token;

      const profileResp = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${githubAccessToken}` },
      });

      const githubUser = profileResp.data;

      // ambil email
      let email = githubUser.email;
      if (!email) {
        const emailResp = await axios.get('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${githubAccessToken}` },
        });
        const primaryEmail = emailResp.data.find(e => e.primary && e.verified);
        email = primaryEmail ? primaryEmail.email : null;
      }

      if (!email) {
        return res.status(400).json({
          status: 'error',
          message: 'Email GitHub tidak dapat diakses. Pastikan email kamu public di GitHub.',
        });
      }

      // cek oauth account sudah ada/ blm
      let oauthAccount = await UserModel.cariOauthAccount('github', String(githubUser.id));
      let user;

      if (oauthAccount) {
        // udh pernah login GitHub
        user = await UserModel.cariById(oauthAccount.user_id);
      } else {
        // blm pernah
        user = await UserModel.cariByEmail(email);

        if (!user) {
          const userId = await UserModel.buat({
            nama:           githubUser.name || githubUser.login,
            email:          email,
            password:       null,
            foto_profil:    githubUser.avatar_url,
            oauth_provider: 'github',
          });
          user = await UserModel.cariById(userId);
        }

        await UserModel.simpanOauthAccount({
          user_id:        user.id,
          provider:       'github',
          provider_id:    String(githubUser.id),
          provider_email: email,
          provider_nama:  githubUser.name || githubUser.login,
          foto_profil:    githubUser.avatar_url,
        });
      }

      const accessToken  = buatAccessToken(user);
      const refreshToken = buatRefreshToken(user);

      const expiredAt = new Date();
      expiredAt.setSeconds(expiredAt.getSeconds() + (parseInt(process.env.JWT_REFRESH_TTL) || 604800));
      await UserModel.simpanRefreshToken(user.id, refreshToken, expiredAt);

      return res.status(200).json({
        status: 'success',
        message: 'Login dengan GitHub berhasil',
        data: {
          access_token:  accessToken,
          refresh_token: refreshToken,
          token_type:    'Bearer',
          user: {
            id:          user.id,
            nama:        user.nama,
            email:       user.email,
            foto_profil: user.foto_profil,
            role:        user.role,
          },
        },
      });
    } catch (err) {
      console.error('[GitHub OAuth]', err.message);
      return res.status(500).json({ status: 'error', message: 'Gagal login dengan GitHub' });
    }
  },

  // GET /users/profile 
  async profile(req, res) {
    try {
      const user = await UserModel.cariById(req.user.user_id);
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
      }
      return res.status(200).json({ status: 'success', data: user });
    } catch (err) {
      console.error('[Profile]', err);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
    }
  },
};

module.exports = AuthController;