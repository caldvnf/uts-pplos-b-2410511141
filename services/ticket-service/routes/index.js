const express          = require('express');
const TicketController = require('../controllers/TicketController');
const jwtMiddleware    = require('../middleware/jwtMiddleware');

const router = express.Router();

router.use(jwtMiddleware);

router.post('/order',          TicketController.pesanTiket);
router.get('/my',              TicketController.tiketSaya);
router.get('/order/:id',       TicketController.detailOrder);
router.get('/:id/eticket',     TicketController.etiket);
router.post('/validate',       TicketController.validasiTiket);

module.exports = router;