import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { assertConfig, config } from './config.js';
import { ORDER_STATUSES } from './constants.js';
import { getTodayDate } from './validators.js';

assertConfig();

fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });

export const db = new DatabaseSync(config.databasePath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL,
    varian TEXT NOT NULL,
    tambahan TEXT NOT NULL DEFAULT '-',
    harga INTEGER NOT NULL CHECK (harga >= 0),
    qty INTEGER NOT NULL CHECK (qty >= 1),
    total INTEGER NOT NULL CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'Pending'
      CHECK (status IN ('Pending', 'Proses', 'Selesai')),
    tanggal TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_tanggal ON orders(tanggal);
`);

const seedAdmin = () => {
  const existing = db
    .prepare('SELECT id, username, password_hash FROM admins ORDER BY id LIMIT 1')
    .get();

  if (!existing) {
    const passwordHash = bcrypt.hashSync(config.adminPassword, 12);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(
      config.adminUsername,
      passwordHash
    );
    console.log(`[db] Admin "${config.adminUsername}" berhasil dibuat.`);
    return;
  }

  db.prepare('DELETE FROM admins WHERE id <> ?').run(existing.id);

  const usernameChanged = existing.username !== config.adminUsername;
  const passwordChanged = !bcrypt.compareSync(
    config.adminPassword,
    existing.password_hash
  );

  if (usernameChanged || passwordChanged) {
    const passwordHash = passwordChanged
      ? bcrypt.hashSync(config.adminPassword, 12)
      : existing.password_hash;

    db.prepare(
      `UPDATE admins
       SET username = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(config.adminUsername, passwordHash, existing.id);
    console.log('[db] Kredensial admin disinkronkan dari .env.');
  }
};

seedAdmin();

const ORDER_FIELDS =
  'id, nama, kategori, varian, tambahan, harga, qty, total, status, tanggal';

const toPlainOrder = (row) => (row ? { ...row } : null);

export const getAdminByUsername = (username) =>
  db
    .prepare('SELECT id, username, password_hash FROM admins WHERE username = ?')
    .get(username) ?? null;

export const getAdminById = (id) =>
  db.prepare('SELECT id, username FROM admins WHERE id = ?').get(id) ?? null;

const getOrderById = (id) =>
  toPlainOrder(db.prepare(`SELECT ${ORDER_FIELDS} FROM orders WHERE id = ?`).get(id));

export const listOrders = () =>
  db
    .prepare(
      `SELECT ${ORDER_FIELDS} FROM orders ORDER BY tanggal DESC, created_at DESC, id DESC`
    )
    .all()
    .map((row) => ({ ...row }));

const getNextOrderId = () => {
  const row = db
    .prepare(
      "SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) AS maxNumber FROM orders WHERE id LIKE 'ORD-%'"
    )
    .get();

  const nextNumber = Number(row?.maxNumber ?? 0) + 1;
  return `ORD-${String(nextNumber).padStart(3, '0')}`;
};

export const createOrder = (orderInput) => {
  const id = getNextOrderId();
  const status = orderInput.status || 'Pending';
  const tanggal = orderInput.tanggal || getTodayDate();

  db.prepare(
    `INSERT INTO orders
      (id, nama, kategori, varian, tambahan, harga, qty, total, status, tanggal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    orderInput.nama,
    orderInput.kategori,
    orderInput.varian,
    orderInput.tambahan,
    orderInput.harga,
    orderInput.qty,
    orderInput.total,
    status,
    tanggal
  );

  return getOrderById(id);
};

export const updateOrder = (id, orderInput) => {
  const result = db
    .prepare(
      `UPDATE orders
       SET nama = ?, kategori = ?, varian = ?, tambahan = ?,
           harga = ?, qty = ?, total = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .run(
      orderInput.nama,
      orderInput.kategori,
      orderInput.varian,
      orderInput.tambahan,
      orderInput.harga,
      orderInput.qty,
      orderInput.total,
      id
    );

  if (Number(result.changes) === 0) return null;

  return getOrderById(id);
};

export const cycleOrderStatus = (id) => {
  const order = getOrderById(id);
  if (!order) return null;

  const currentIndex = ORDER_STATUSES.indexOf(order.status);
  const nextStatus = ORDER_STATUSES[(currentIndex + 1) % ORDER_STATUSES.length];

  db.prepare(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(nextStatus, id);

  return getOrderById(id);
};

export const deleteOrder = (id) => {
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  return Number(result.changes) > 0;
};

export const importOrders = (orders) => {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO orders
      (id, nama, kategori, varian, tambahan, harga, qty, total, status, tanggal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let imported = 0;

  db.exec('BEGIN');

  try {
    for (const order of orders) {
      const result = insert.run(
        order.id,
        order.nama,
        order.kategori,
        order.varian,
        order.tambahan,
        order.harga,
        order.qty,
        order.total,
        order.status,
        order.tanggal
      );

      if (Number(result.changes) > 0) imported += 1;
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return imported;
};
