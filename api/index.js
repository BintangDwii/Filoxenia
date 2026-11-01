import { assertConfig } from '../server/config.js';
import { createApp } from '../server/app.js';
import { initDb } from '../server/db.js';

assertConfig();

const app = createApp();

let ready;

const ensureReady = () => {
  if (!ready) {
    ready = initDb();
  }
  return ready;
};

export default async function handler(req, res) {
  await ensureReady();
  return app(req, res);
}
