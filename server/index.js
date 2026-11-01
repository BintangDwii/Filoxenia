import { assertConfig, config } from './config.js';
import { createApp } from './app.js';
import { initDb } from './db.js';

assertConfig();

const app = createApp();

initDb()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`[server] Berjalan di http://localhost:${config.port}`);
      console.log(`[server] Database: ${config.tursoUrl ?? config.databasePath}`);
    });
  })
  .catch((err) => {
    console.error('[server] Gagal inisialisasi database:', err);
    process.exit(1);
  });
