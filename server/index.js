import { assertConfig, config } from './config.js';
import { createApp } from './app.js';

assertConfig();

const app = createApp();

app.listen(config.port, () => {
  console.log(`[server] Berjalan di http://localhost:${config.port}`);
  console.log(`[server] Database: ${config.databasePath}`);
});
