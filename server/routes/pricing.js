import { Router } from 'express';
import { calculatePricing } from '../../shared/pricing.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateCalculatorPayload } from '../validators.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/calculate',
  asyncHandler(async (req, res) => {
    const result = calculatePricing(validateCalculatorPayload(req.body));
    res.json({ pricing: result });
  })
);

export default router;
