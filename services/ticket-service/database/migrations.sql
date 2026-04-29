CREATE DATABASE IF NOT EXISTS ticket_db;
USE ticket_db;

-- Tabel 1: orders 
CREATE TABLE IF NOT EXISTS orders (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  kode_order      VARCHAR(50) NOT NULL UNIQUE,
  user_id         INT NOT NULL,        -- dari auth-service
  event_id        INT NOT NULL,        -- dari event-service
  total_harga     DECIMAL(12,2) NOT NULL DEFAULT 0,
  status_order    ENUM('pending','paid','cancelled') DEFAULT 'pending',
  dibuat_pada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  diubah_pada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel 2: order_items 
CREATE TABLE IF NOT EXISTS order_items (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  order_id        INT NOT NULL,
  category_id     INT NOT NULL,        -- dari event-service
  nama_kategori   VARCHAR(100) NOT NULL,
  harga_satuan    DECIMAL(12,2) NOT NULL,
  jumlah          INT NOT NULL DEFAULT 1,
  subtotal        DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Tabel 3: tickets 
CREATE TABLE IF NOT EXISTS tickets (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  order_item_id   INT NOT NULL,
  kode_tiket      VARCHAR(100) NOT NULL UNIQUE,  -- kode unik tiap tiket
  qr_code         TEXT NULL,                     -- base64 QR code
  status_tiket    ENUM('aktif','digunakan','dibatalkan') DEFAULT 'aktif',
  dibuat_pada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
);

-- Tabel 4: ticket_validations
CREATE TABLE IF NOT EXISTS ticket_validations (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id       INT NOT NULL,
  divalidasi_oleh INT NOT NULL,   -- user_id petugas
  divalidasi_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  keterangan      VARCHAR(200) NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);