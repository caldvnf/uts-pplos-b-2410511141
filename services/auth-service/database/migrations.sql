CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

-- users
CREATE TABLE IF NOT EXISTS users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  nama          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password      VARCHAR(255) NULL,        -- NULL kalau user OAuth (tidak punya password)
  role          ENUM('user', 'admin') DEFAULT 'user',
  foto_profil   VARCHAR(255) NULL,
  oauth_provider VARCHAR(50) NULL,        -- contoh: 'github', NULL kalau login manual
  is_aktif      TINYINT(1) DEFAULT 1,
  dibuat_pada   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  diubah_pada   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- oauth_accounts
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  user_id         INT NOT NULL,
  provider        VARCHAR(50) NOT NULL,   -- 'github'
  provider_id     VARCHAR(100) NOT NULL,  -- ID user di GitHub
  provider_email  VARCHAR(100) NULL,
  provider_nama   VARCHAR(100) NULL,
  foto_profil     VARCHAR(255) NULL,
  dibuat_pada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider (provider, provider_id)
);

-- refresh_tokens 
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  token       TEXT NOT NULL,
  expired_at  TIMESTAMP NOT NULL,
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- token_blacklist
CREATE TABLE IF NOT EXISTS token_blacklist (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  token       TEXT NOT NULL,
  expired_at  TIMESTAMP NOT NULL,
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);s

-- insert admin default 
INSERT IGNORE INTO users (nama, email, password, role)
VALUES ('Admin', 'admin@tiket.com', 'pswaddmin123', 'admin');
