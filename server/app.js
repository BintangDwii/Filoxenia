import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import orderRoutes from './routes/orders.js';
import pricingRoutes from './routes/pricing.js';
import productRoutes from './routes/products.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..');

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/pricing', pricingRoutes);

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
  });

  if (config.isProduction) {
    const distPath = path.join(projectRoot, 'dist');
    const indexPath = path.join(distPath, 'index.html');

    app.use(express.static(distPath));

    app.use((req, res, next) => {
      if (req.method !== 'GET' || !req.accepts('html')) {
        return next();
      }

      return res.sendFile(indexPath);
    });
  }

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    const status = err.status || err.statusCode || 500;

    if (status >= 500) {
      console.error(err);
    }

    return res.status(status).json({
      error: status >= 500 ? 'Terjadi kesalahan pada server.' : err.message,
    });
  });

  return app;
};
