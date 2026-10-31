import { Router } from 'express';
import {
  createOrder,
  cycleOrderStatus,
  deleteOrder,
  importOrders,
  listOrders,
  updateOrder,
} from '../db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateOrderPayload, ValidationError } from '../validators.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  res.json({ orders: listOrders() });
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const order = createOrder(validateOrderPayload(req.body));
    res.status(201).json({ order });
  })
);

router.post(
  '/import',
  asyncHandler(async (req, res) => {
    const input = req.body?.orders;

    if (!Array.isArray(input)) {
      throw new ValidationError('Data migrasi harus berupa array pesanan.');
    }

    if (input.length > 5000) {
      throw new ValidationError('Maksimal 5000 pesanan dalam sekali migrasi.');
    }

    const orders = input.map((item) =>
      validateOrderPayload(item, {
        includeId: true,
        includeStatus: true,
        includeTanggal: true,
      })
    );

    const imported = importOrders(orders);

    res.json({
      imported,
      total: orders.length,
    });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = updateOrder(req.params.id, validateOrderPayload(req.body));

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    return res.json({ order });
  })
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const order = cycleOrderStatus(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    return res.json({ order });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = deleteOrder(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    return res.json({ success: true });
  })
);

export default router;
