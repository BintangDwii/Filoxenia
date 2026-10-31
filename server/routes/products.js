import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductDetail,
  listProducts,
  updateProduct,
} from '../db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  parseRouteId,
  validateProductPayload,
} from '../validators.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  res.json({ products: listProducts() });
});

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseRouteId(req.params.id, 'produk');
    const detail = getProductDetail(id);

    if (!detail) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    return res.json(detail);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const detail = createProduct(validateProductPayload(req.body));
    res.status(201).json(detail);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseRouteId(req.params.id, 'produk');
    const detail = updateProduct(id, validateProductPayload(req.body));

    if (!detail) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    return res.json(detail);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseRouteId(req.params.id, 'produk');
    const deleted = deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    return res.json({ success: true });
  })
);

export default router;
