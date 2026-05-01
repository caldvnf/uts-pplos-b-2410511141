require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const QRCode         = require('qrcode');
const axios          = require('axios');
const TicketModel    = require('../models/TicketModel');

const TicketController = {

  // POST /tickets/order 
  async pesanTiket(req, res) {
    try {
      const userId  = req.user.user_id;
      const { event_id, items } = req.body;

      if (!event_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'event_id dan items wajib diisi',
        });
      }

      for (const item of items) {
        if (!item.category_id || !item.jumlah || item.jumlah < 1) {
          return res.status(422).json({
            status: 'error',
            message: 'Setiap item harus punya category_id dan jumlah minimal 1',
          });
        }
      }

      const eventServiceUrl = process.env.EVENT_SERVICE_URL || 'http://event-service:8080';
      let kategoriData;

      try {
        const response = await axios.get(
          `${eventServiceUrl}/events/${event_id}/categories`,
          {
            headers: {
              Authorization: req.headers.authorization
            }
          }
        );
        kategoriData = response.data.data;
      } catch (err) {
        return res.status(502).json({
          status: 'error',
          message: 'Gagal mengambil data event. Event mungkin tidak ditemukan.',
        });
      }

      let totalHarga = 0;
      const itemsProses = [];

      for (const item of items) {
        const kategori = kategoriData.find(
          k => String(k.id) === String(item.category_id)
        );

        if (!kategori) {
          return res.status(404).json({
            status: 'error',
            message: `Kategori tiket ID ${item.category_id} tidak ditemukan`,
          });
        }

        const sisaKuota = kategori.kuota - kategori.terjual;
        if (sisaKuota < item.jumlah) {
          return res.status(409).json({
            status: 'error',
            message: `Kuota tidak mencukupi untuk kategori ${kategori.nama}. Sisa: ${sisaKuota}`,
          });
        }

        const subtotal = kategori.harga * item.jumlah;
        totalHarga += subtotal;

        itemsProses.push({
          category_id:   kategori.id,
          nama_kategori: kategori.nama,
          harga_satuan:  kategori.harga,
          jumlah:        item.jumlah,
          subtotal,
        });
      }

      const kodeOrder = `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

      const orderId = await TicketModel.buatOrder({
        kode_order:  kodeOrder,
        user_id:     userId,
        event_id,
        total_harga: totalHarga,
      });

      const hasilItems = [];

      for (const item of itemsProses) {
        const orderItemId = await TicketModel.buatOrderItem({
          order_id: orderId,
          ...item,
        });

        const tiketList = [];
        for (let i = 0; i < item.jumlah; i++) {
          const kodeTiket = `TKT-${uuidv4().substring(0, 12).toUpperCase()}`;

          const qrCode = await QRCode.toDataURL(kodeTiket, {
            width: 300,
            margin: 2,
          });

          const tiketId = await TicketModel.buatTiket(orderItemId, kodeTiket, qrCode);
          tiketList.push({
            id: tiketId,
            kode_tiket: kodeTiket,
            qr_code: qrCode
          });
        }

        hasilItems.push({ ...item, tikets: tiketList });
      }

      for (const item of itemsProses) {
        try {
          await axios.post(
            `${eventServiceUrl}/events/internal/kurangi-kuota`,
            {
              category_id: item.category_id,
              jumlah:      item.jumlah,
            },
            {
              headers: {
                Authorization: req.headers.authorization
              }
            }
          );
        } catch (err) {
          console.error('[Kurangi Kuota] Gagal:', err.message);
        }
      }

      await TicketModel.updateStatusOrder(orderId, 'paid');

      return res.status(201).json({
        status:  'success',
        message: 'Tiket berhasil dipesan',
        data: {
          order_id:    orderId,
          kode_order:  kodeOrder,
          total_harga: totalHarga,
          status:      'paid',
          items:       hasilItems,
        },
      });
    } catch (err) {
      console.error('[Pesan Tiket]', err);
      return res.status(500).json({
        status:  'error',
        message: 'Terjadi kesalahan saat memproses pesanan',
      });
    }
  },

  // GET /tickets/my 
  async tiketSaya(req, res) {
    try {
      const userId = req.user.user_id;
      const orders = await TicketModel.ambilOrderByUserId(userId);

      return res.status(200).json({
        status: 'success',
        data:   orders,
      });
    } catch (err) {
      console.error('[Tiket Saya]', err);
      return res.status(500).json({
        status:  'error',
        message: 'Terjadi kesalahan server',
      });
    }
  },

  // GET /tickets/order/:id 
  async detailOrder(req, res) {
    try {
      const userId  = req.user.user_id;
      const orderId = parseInt(req.params.id);

      const order = await TicketModel.ambilDetailOrder(orderId, userId);

      if (!order) {
        return res.status(404).json({
          status:  'error',
          message: 'Order tidak ditemukan',
        });
      }

      return res.status(200).json({
        status: 'success',
        data:   order,
      });
    } catch (err) {
      console.error('[Detail Order]', err);
      return res.status(500).json({
        status:  'error',
        message: 'Terjadi kesalahan server',
      });
    }
  },

  // GET /tickets/:id/eticket
  async etiket(req, res) {
    try {
      const userId   = req.user.user_id;
      const tiketId  = parseInt(req.params.id);

      const tiket = await TicketModel.ambilTiketById(tiketId, userId);

      if (!tiket) {
        return res.status(404).json({
          status:  'error',
          message: 'Tiket tidak ditemukan',
        });
      }

      return res.status(200).json({
        status: 'success',
        data:   tiket,
      });
    } catch (err) {
      console.error('[E-ticket]', err);
      return res.status(500).json({
        status:  'error',
        message: 'Terjadi kesalahan server',
      });
    }
  },

  // POST /tickets/validate 
  async validasiTiket(req, res) {
    try {
      const petugasId  = req.user.user_id;
      const { kode_tiket } = req.body;

      if (!kode_tiket) {
        return res.status(400).json({
          status:  'error',
          message: 'kode_tiket wajib diisi',
        });
      }

      const tiket = await TicketModel.ambilTiketByKode(kode_tiket);

      if (!tiket) {
        return res.status(404).json({
          status:  'error',
          message: 'Tiket tidak ditemukan',
        });
      }

      // status tiket
      if (tiket.status_tiket === 'digunakan') {
        return res.status(409).json({
          status:  'error',
          message: 'Tiket sudah pernah digunakan',
          data:    { kode_tiket, status: 'digunakan' },
        });
      }

      if (tiket.status_tiket === 'dibatalkan') {
        return res.status(409).json({
          status:  'error',
          message: 'Tiket sudah dibatalkan',
          data:    { kode_tiket, status: 'dibatalkan' },
        });
      }

      // validasi tiket
      await TicketModel.gunakanTiket(tiket.id);

      await TicketModel.simpanValidasi(
        tiket.id,
        petugasId,
        'Validasi berhasil di pintu masuk'
      );

      return res.status(200).json({
        status:  'success',
        message: 'Tiket valid! Silakan masuk.',
        data: {
          kode_tiket:    tiket.kode_tiket,
          nama_kategori: tiket.nama_kategori,
          event_id:      tiket.event_id,
          status:        'digunakan',
        },
      });
    } catch (err) {
      console.error('[Validasi Tiket]', err);
      return res.status(500).json({
        status:  'error',
        message: 'Terjadi kesalahan server',
      });
    }
  },
};

module.exports = TicketController;