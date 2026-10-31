import { Router } from 'express';
import {
  addStockMovement,
  createMaterial,
  deleteMaterial,
  getInventorySummary,
  listMaterials,
  listStockMovements,
  updateMaterial,
} from '../db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  parseRouteId,
  validateMaterialPayload,
  validateStockPayload,
} from '../validators.js';

const router = Router();

router.use(requireAuth);

router.get('/materials', (req, res) => {
  res.json({
    materials: listMaterials(),
    summary: getInventorySummary(),
  });
});

router.get('/movements', (req, res) => {
  res.json({
    movements: listStockMovements(Number(req.query.limit) || 100),
  });
});

router.post(
  '/materials',
  asyncHandler(async (req, res) => {
    const material = createMaterial(
      validateMaterialPayload(req.body, { includeStock: true })
    );

    res.status(201).json({ material });
  })
);

router.put(
  '/materials/:id',
  asyncHandler(async (req, res) => {
    const id = parseRouteId(req.params.id, 'bahan');
    const material = updateMaterial(id, validateMaterialPayload(req.body));

    if (!material) {
      return res.status(404).json({ error: 'Bahan baku tidak ditemukan.' });
    }

    return res.json({ material });
  })
);

router.delete(
  '/materials/:id',
  asyncHandler(async (req, res) => {
    const id = parseRouteId(req.params.id, 'bahan');
    const deleted = deleteMaterial(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Bahan baku tidak ditemukan.' });
    }

    return res.json({ success: true });
  })
);

router.post(
  '/materials/:id/stock',
  asyncHandler(async (req, res) => {
    const id = parseRouteId(req.params.id, 'bahan');
    const material = addStockMovement(id, validateStockPayload(req.body));

    if (!material) {
      return res.status(404).json({ error: 'Bahan baku tidak ditemukan.' });
    }

    return res.json({ material });
  })
);

export default router;
