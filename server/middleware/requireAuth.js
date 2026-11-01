import { clearAuthCookie, verifyToken } from '../auth.js';
import { config } from '../config.js';
import { getAdminById } from '../db.js';

export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.[config.cookieName];

  if (!token) {
    return res.status(401).json({ error: 'Silakan login sebagai admin.' });
  }

  try {
    const payload = verifyToken(token);
    const admin = await getAdminById(Number(payload.sub));

    if (!admin) {
      throw new Error('Admin tidak ditemukan.');
    }

    req.admin = admin;
    return next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Sesi login tidak valid. Silakan login ulang.' });
  }
};
