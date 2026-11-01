import { Router } from 'express';
import {
  createOrder,
  cycleOrderStatus,
  deleteOrder,
  getOrderDetail,
  importOrders,
  listOrders,
  updateOrder,
} from '../db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateOrderPayload, ValidationError } from '../validators.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ orders: await listOrders() });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const detail = await getOrderDetail(req.params.id);

    if (!detail) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    return res.json({ order: detail });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const order = await createOrder(validateOrderPayload(req.body));
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

    const imported = await importOrders(orders);

    res.json({
      imported,
      total: orders.length,
    });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await updateOrder(req.params.id, validateOrderPayload(req.body));

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    return res.json({ order });
  })
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const order = await cycleOrderStatus(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    return res.json({ order });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await deleteOrder(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    return res.json({ success: true });
  })
);

export default router;
