
const db = require('../config/database');

const TicketModel = {

  // buat order baru
  async buatOrder(data) {
    const { kode_order, user_id, event_id, total_harga } = data;
    const [result] = await db.execute(
      `INSERT INTO orders 
       (kode_order, user_id, event_id, total_harga, status_order) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [kode_order, user_id, event_id, total_harga]
    );
    return result.insertId;
  },

  // buat order item
  async buatOrderItem(data) {
    const { order_id, category_id, nama_kategori, harga_satuan, jumlah, subtotal } = data;
    const [result] = await db.execute(
      `INSERT INTO order_items 
       (order_id, category_id, nama_kategori, harga_satuan, jumlah, subtotal) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, category_id, nama_kategori, harga_satuan, jumlah, subtotal]
    );
    return result.insertId;
  },

  // buat tiket individual
  async buatTiket(order_item_id, kode_tiket, qr_code) {
    const [result] = await db.execute(
      `INSERT INTO tickets (order_item_id, kode_tiket, qr_code) 
       VALUES (?, ?, ?)`,
      [order_item_id, kode_tiket, qr_code]
    );
    return result.insertId;
  },

  // update status order jadi paid
  async updateStatusOrder(order_id, status) {
    await db.execute(
      'UPDATE orders SET status_order = ? WHERE id = ?',
      [status, order_id]
    );
  },

  // ambil semua order milik 1 user
  async ambilOrderByUserId(user_id) {
    const [rows] = await db.execute(
      `SELECT o.*, 
              COUNT(t.id) as total_tiket
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN tickets t ON t.order_item_id = oi.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.dibuat_pada DESC`,
      [user_id]
    );
    return rows;
  },

  // ambil detail 1 order beserta tiket-tiketnya
  async ambilDetailOrder(order_id, user_id) {
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [order_id, user_id]
    );
    if (!orders[0]) return null;

    const order = orders[0];

    // ambil order items
    const [items] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order_id]
    );

    // ambil tiket per item
    for (const item of items) {
      const [tikets] = await db.execute(
        'SELECT id, kode_tiket, status_tiket, dibuat_pada FROM tickets WHERE order_item_id = ?',
        [item.id]
      );
      item.tikets = tikets;
    }

    order.items = items;
    return order;
  },

  // ambil detail 1 tiket beserta QR code-nya
  async ambilTiketById(tiket_id, user_id) {
    const [rows] = await db.execute(
      `SELECT t.*, oi.nama_kategori, oi.harga_satuan,
              o.kode_order, o.event_id, o.user_id
       FROM tickets t
       JOIN order_items oi ON oi.id = t.order_item_id
       JOIN orders o ON o.id = oi.order_id
       WHERE t.id = ? AND o.user_id = ?`,
      [tiket_id, user_id]
    );
    return rows[0] || null;
  },

  // ambil tiket berdasarkan kode (untuk validasi di pintu)
  async ambilTiketByKode(kode_tiket) {
    const [rows] = await db.execute(
      `SELECT t.*, oi.nama_kategori, o.event_id, o.user_id, o.kode_order
       FROM tickets t
       JOIN order_items oi ON oi.id = t.order_item_id
       JOIN orders o ON o.id = oi.order_id
       WHERE t.kode_tiket = ?`,
      [kode_tiket]
    );
    return rows[0] || null;
  },

  // update status tiket jadi 'digunakan'
  async gunakanTiket(tiket_id) {
    await db.execute(
      "UPDATE tickets SET status_tiket = 'digunakan' WHERE id = ?",
      [tiket_id]
    );
  },

  // simpan log validasi
  async simpanValidasi(tiket_id, divalidasi_oleh, keterangan) {
    await db.execute(
      `INSERT INTO ticket_validations 
       (ticket_id, divalidasi_oleh, keterangan) 
       VALUES (?, ?, ?)`,
      [tiket_id, divalidasi_oleh, keterangan]
    );
  },
};

module.exports = TicketModel;