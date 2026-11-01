import 'dotenv/config';
import path from 'node:path';

export const config = {
  port: Number(process.env.PORT) || 3001,
  adminUsername: (process.env.ADMIN_USERNAME || '').trim(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  jwtSecret: process.env.JWT_SECRET || '',
  databasePath: process.env.VERCEL
    ? '/tmp/filoxenia.db'
    : path.resolve(process.env.DATABASE_PATH || 'data/filoxenia.db'),
  isProduction: process.env.NODE_ENV === 'production',
  cookieName: 'filoxenia_admin',
  sessionDays: 7,
};

export const assertConfig = () => {
  const missing = [];

  if (!config.adminUsername) {
    missing.push('ADMIN_USERNAME');
  }

  if (!config.adminPassword || config.adminPassword.length < 8) {
    missing.push('ADMIN_PASSWORD (minimal 8 karakter)');
  }

  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    missing.push('JWT_SECRET (minimal 32 karakter)');
  }

  if (missing.length > 0) {
    throw new Error(`Konfigurasi .env belum lengkap: ${missing.join(', ')}`);
  }
};
