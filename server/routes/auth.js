import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { clearAuthCookie, createToken, setAuthCookie, verifyPassword } from '../auth.js';
import { getAdminByUsername } from '../db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi nanti.' },
});

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const admin = await getAdminByUsername(username);

    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    const token = createToken(admin);
    setAuthCookie(res, token);

    return res.json({
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  })
);

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ admin: req.admin });
});

export default router;
