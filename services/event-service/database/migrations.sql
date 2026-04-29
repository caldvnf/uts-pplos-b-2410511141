CREATE DATABASE IF NOT EXISTS event_db;
USE event_db;

-- ── Tabel 1: organizers ───────────────────────────────
CREATE TABLE IF NOT EXISTS organizers (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  nama        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL,
  telepon     VARCHAR(20) NULL,
  deskripsi   TEXT NULL,
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_categories (
  id        INT PRIMARY KEY AUTO_INCREMENT,
  nama      VARCHAR(50) NOT NULL UNIQUE,
  deskripsi VARCHAR(200) NULL
);

--  Tabel 3: events 
CREATE TABLE IF NOT EXISTS events (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  organizer_id    INT NOT NULL,
  category_id     INT NULL,
  judul           VARCHAR(200) NOT NULL,
  deskripsi       TEXT NULL,
  lokasi          VARCHAR(200) NOT NULL,
  tanggal_mulai   DATETIME NOT NULL,
  tanggal_selesai DATETIME NOT NULL,
  banner_url      VARCHAR(255) NULL,
  status          ENUM('draft','published','cancelled','selesai') DEFAULT 'draft',
  dibuat_oleh     INT NOT NULL,
  dibuat_pada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  diubah_pada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES event_categories(id) ON DELETE SET NULL
);

--  ticket_categories 
CREATE TABLE IF NOT EXISTS ticket_categories (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  event_id    INT NOT NULL,
  nama        VARCHAR(100) NOT NULL,
  deskripsi   TEXT NULL,
  harga       DECIMAL(12,2) NOT NULL DEFAULT 0,
  kuota       INT NOT NULL DEFAULT 0,
  terjual     INT NOT NULL DEFAULT 0,
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Data dummy 

INSERT IGNORE INTO event_categories (nama, deskripsi) VALUES
('Konser',    'Pertunjukan musik live'),
('Seminar',   'Acara presentasi dan diskusi'),
('Workshop',  'Pelatihan praktis'),
('Festival',  'Acara besar multi-hari'),
('Pameran',   'Acara pameran produk atau karya');

INSERT IGNORE INTO organizers (nama, email, telepon) VALUES
('Autobot Event Corp',   'autobot@transformers.com',     '08111111111'),
('Decepticon Creative',  'decepticon@transformers.com',  '08222222222');

INSERT IGNORE INTO events 
  (organizer_id, category_id, judul, deskripsi, lokasi, tanggal_mulai, tanggal_selesai, status, dibuat_oleh) 
VALUES
(1, 1, 'Konser One Direction Reunion', 'Konser reuni spektakuler One Direction', 'GBK Jakarta',       '2026-06-10 19:00:00', '2026-06-10 23:00:00', 'published', 1),
(2, 2, 'Seminar PJM Aspirasi',         'Seminar Pendidikan Jurnalistik Mahasiswa', 'UPNVJ',           '2026-07-11 08:00:00', '2026-07-12 16:00:00', 'published', 1),
(1, 1, 'SparkTix SMA 26',             'Event konser SMA 26', 'SMA Negeri 26 Jakarta',                 '2026-08-20 09:00:00', '2026-08-20 15:00:00', 'published', 1);

INSERT IGNORE INTO ticket_categories (event_id, nama, harga, kuota) VALUES
(1, 'Regular',     500000,  1000),
(1, 'VIP',        1200000,   300),
(2, 'Peserta',     150000,   500),
(2, 'VIP Seminar', 300000,   100),
(3, 'Early Bird',   50000,   200),
(3, 'Normal',      100000,   400);