import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { ORDER_STATUSES } from './constants.js';
import { calculatePricing } from '../shared/pricing.js';
import { ConflictError, getTodayDate, ValidationError } from './validators.js';

/* ─── Client ─── */

if (!config.tursoUrl) {
  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
}

const dbUrl = config.tursoUrl ?? `file://${config.databasePath}`;

export const db = createClient({
  url: dbUrl,
  authToken: config.tursoToken ?? undefined,
});

/* ─── Helpers ─── */

const q = async (client, sql, args = []) => {
  const result = await client.execute({ sql, args });
  return result;
};

const queryAll = async (client, sql, args = []) => {
  const result = await q(client, sql, args);
  return result.rows.map(toObj);
};

const queryOne = async (client, sql, args = []) => {
  const result = await q(client, sql, args);
  return toObj(result.rows[0] ?? null);
};

const queryRun = async (client, sql, args = []) => {
  const result = await q(client, sql, args);
  return {
    changes: result.rowsAffected,
    lastInsertRowid: result.lastInsertRowid != null ? Number(result.lastInsertRowid) : null,
  };
};

// libsql Row objects are array-like; convert to plain JS objects for safe property access
const toObj = (row) => {
  if (!row) return null;
  // If it's already a plain object (e.g. in some libsql versions), return as-is
  if (Object.getPrototypeOf(row) === Object.prototype) return row;
  const obj = {};
  for (const key of Object.keys(row)) {
    obj[key] = row[key];
  }
  return obj;
};

const inTransaction = async (fn) => {
  const tx = await db.transaction('write');
  try {
    const result = await fn(tx);
    await tx.commit();
    return result;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
};

const roundQuantity = (value) => Math.round(Number(value) * 1e6) / 1e6;

const formatQuantity = (value) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(
    roundQuantity(value)
  );

/* ─── Schema ─── */

const SCHEMA_SQL = `
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

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    satuan TEXT NOT NULL DEFAULT 'pcs',
    stok REAL NOT NULL DEFAULT 0 CHECK (stok >= 0),
    stok_minimum REAL NOT NULL DEFAULT 0 CHECK (stok_minimum >= 0),
    harga_satuan INTEGER NOT NULL DEFAULT 0 CHECK (harga_satuan >= 0),
    catatan TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL,
    varian TEXT NOT NULL DEFAULT '',
    yield_qty REAL NOT NULL DEFAULT 1 CHECK (yield_qty > 0),
    biaya_kemasan INTEGER NOT NULL DEFAULT 0 CHECK (biaya_kemasan >= 0),
    margin_persen REAL NOT NULL DEFAULT 0 CHECK (margin_persen >= 0),
    tenaga_kerja_persen REAL NOT NULL DEFAULT 20 CHECK (tenaga_kerja_persen >= 0),
    overhead_persen REAL NOT NULL DEFAULT 10 CHECK (overhead_persen >= 0),
    pembulatan INTEGER NOT NULL DEFAULT 1000 CHECK (pembulatan > 0),
    mode_biaya TEXT NOT NULL DEFAULT 'manual'
      CHECK (mode_biaya IN ('bom', 'manual')),
    biaya_bahan_manual INTEGER NOT NULL DEFAULT 0 CHECK (biaya_bahan_manual >= 0),
    aktif INTEGER NOT NULL DEFAULT 1 CHECK (aktif IN (0, 1)),
    catatan TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    qty REAL NOT NULL CHECK (qty > 0),
    UNIQUE (product_id, material_id)
  );

  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    tipe TEXT NOT NULL CHECK (tipe IN ('masuk', 'keluar', 'penyesuaian')),
    jumlah REAL NOT NULL,
    stok_sebelum REAL NOT NULL,
    stok_sesudah REAL NOT NULL,
    harga_satuan INTEGER,
    catatan TEXT NOT NULL DEFAULT '',
    referensi TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_cost_snapshots (
    order_id TEXT PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER,
    product_nama TEXT NOT NULL,
    material_cost REAL NOT NULL,
    labor_cost REAL NOT NULL,
    overhead_cost REAL NOT NULL,
    hpp_total REAL NOT NULL,
    hpp_per_unit REAL NOT NULL,
    packaging_cost REAL NOT NULL,
    modal_per_unit REAL NOT NULL,
    margin_percent REAL NOT NULL,
    margin_amount REAL NOT NULL,
    selling_price_raw REAL NOT NULL,
    selling_price_final INTEGER NOT NULL,
    bep_ratio REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_material_usage (
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    qty REAL NOT NULL CHECK (qty > 0),
    harga_satuan INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (order_id, material_id)
  );

  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_tanggal ON orders(tanggal);
  CREATE INDEX IF NOT EXISTS idx_materials_nama ON materials(nama);
  CREATE INDEX IF NOT EXISTS idx_stock_movements_material ON stock_movements(material_id);
  CREATE INDEX IF NOT EXISTS idx_product_materials_product ON product_materials(product_id);
`;

/* ─── Mappers ─── */

const mapMaterial = (row) =>
  row
    ? {
      id: Number(row.id),
      nama: row.nama,
      satuan: row.satuan,
      stok: Number(row.stok),
      stokMinimum: Number(row.stok_minimum),
      hargaSatuan: Number(row.harga_satuan),
      catatan: row.catatan,
      nilaiStok: Number(row.stok) * Number(row.harga_satuan),
      stokRendah: Number(row.stok) <= Number(row.stok_minimum),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
    : null;

const mapMovement = (row) =>
  row
    ? {
      id: Number(row.id),
      materialId: Number(row.material_id),
      materialNama: row.material_nama,
      tipe: row.tipe,
      jumlah: Number(row.jumlah),
      stokSebelum: Number(row.stok_sebelum),
      stokSesudah: Number(row.stok_sesudah),
      hargaSatuan: row.harga_satuan != null ? Number(row.harga_satuan) : null,
      catatan: row.catatan,
      referensi: row.referensi,
      createdAt: row.created_at,
    }
    : null;

const mapProduct = (row) =>
  row
    ? {
      id: Number(row.id),
      nama: row.nama,
      kategori: row.kategori,
      varian: row.varian,
      yieldQty: Number(row.yield_qty),
      biayaKemasan: Number(row.biaya_kemasan),
      marginPersen: Number(row.margin_persen),
      tenagaKerjaPersen: Number(row.tenaga_kerja_persen),
      overheadPersen: Number(row.overhead_persen),
      pembulatan: Number(row.pembulatan),
      modeBiaya: row.mode_biaya,
      biayaBahanManual: Number(row.biaya_bahan_manual),
      aktif: Boolean(Number(row.aktif)),
      catatan: row.catatan,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
    : null;

const toPlainOrder = (row) =>
  row
    ? {
      id: row.id,
      nama: row.nama,
      kategori: row.kategori,
      varian: row.varian,
      tambahan: row.tambahan,
      harga: Number(row.harga),
      qty: Number(row.qty),
      total: Number(row.total),
      status: row.status,
      tanggal: row.tanggal,
      productId: row.product_id != null ? Number(row.product_id) : null,
      productNama: row.product_nama ?? null,
    }
    : null;

/* ─── Admin ─── */

export const getAdminByUsername = async (username) => {
  const row = await queryOne(
    db,
    'SELECT id, username, password_hash FROM admins WHERE username = ?',
    [username]
  );
  return row ? { id: Number(row.id), username: row.username, password_hash: row.password_hash } : null;
};

export const getAdminById = async (id) => {
  const row = await queryOne(
    db,
    'SELECT id, username FROM admins WHERE id = ?',
    [Number(id)]
  );
  return row ? { id: Number(row.id), username: row.username } : null;
};

/* ─── Materials ─── */

const _getMaterialById = async (client, id) => {
  const row = await queryOne(
    client,
    'SELECT * FROM materials WHERE id = ?',
    [Number(id)]
  );
  return mapMaterial(row);
};

export const getMaterialById = (id) => _getMaterialById(db, id);

export const listMaterials = async () => {
  const rows = await queryAll(
    db,
    `SELECT * FROM materials
     ORDER BY CASE WHEN stok <= stok_minimum THEN 0 ELSE 1 END, nama COLLATE NOCASE`
  );
  return rows.map(mapMaterial);
};

export const getInventorySummary = async () => {
  const materials = await listMaterials();
  return {
    totalMaterials: materials.length,
    totalStockValue: materials.reduce((t, m) => t + m.nilaiStok, 0),
    lowStockCount: materials.filter((m) => m.stokRendah).length,
  };
};

export const listStockMovements = async (limit = 100) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  const rows = await queryAll(
    db,
    `SELECT sm.*, m.nama AS material_nama
     FROM stock_movements sm
     JOIN materials m ON m.id = sm.material_id
     ORDER BY sm.created_at DESC, sm.id DESC
     LIMIT ?`,
    [safeLimit]
  );
  return rows.map(mapMovement);
};

const _applyStockMovement = async (client, { materialId, tipe, jumlah, hargaSatuan = null, catatan = '', referensi = '' }) => {
  const material = await _getMaterialById(client, materialId);
  if (!material) throw new ValidationError('Bahan baku tidak ditemukan.');

  const delta =
    tipe === 'penyesuaian'
      ? Number(jumlah) - material.stok
      : tipe === 'masuk'
        ? Number(jumlah)
        : -Number(jumlah);

  const nextStock = roundQuantity(material.stok + delta);

  if (nextStock < 0) {
    throw new ConflictError(
      `Stok ${material.nama} tidak cukup. Tersedia ${formatQuantity(material.stok)} ${material.satuan}.`
    );
  }

  const nextPrice = hargaSatuan === null ? material.hargaSatuan : hargaSatuan;

  await queryRun(
    client,
    `UPDATE materials SET stok = ?, harga_satuan = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [nextStock, nextPrice, material.id]
  );

  await queryRun(
    client,
    `INSERT INTO stock_movements
      (material_id, tipe, jumlah, stok_sebelum, stok_sesudah, harga_satuan, catatan, referensi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [material.id, tipe, delta, material.stok, nextStock, nextPrice, catatan, referensi]
  );

  return _getMaterialById(client, material.id);
};

export const createMaterial = async (input) => {
  return inTransaction(async (tx) => {
    const { lastInsertRowid: materialId } = await queryRun(
      tx,
      `INSERT INTO materials (nama, satuan, stok, stok_minimum, harga_satuan, catatan) VALUES (?, ?, 0, ?, ?, ?)`,
      [input.nama, input.satuan, input.stokMinimum, input.hargaSatuan, input.catatan]
    );

    if (input.stok > 0) {
      await _applyStockMovement(tx, {
        materialId,
        tipe: 'masuk',
        jumlah: input.stok,
        hargaSatuan: input.hargaSatuan,
        catatan: 'Stok awal bahan',
        referensi: 'stok-awal',
      });
    }

    return _getMaterialById(tx, materialId);
  });
};

export const updateMaterial = async (id, input) => {
  const { changes } = await queryRun(
    db,
    `UPDATE materials
     SET nama = ?, satuan = ?, stok_minimum = ?, harga_satuan = ?,
         catatan = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [input.nama, input.satuan, input.stokMinimum, input.hargaSatuan, input.catatan, Number(id)]
  );
  if (changes === 0) return null;
  return getMaterialById(id);
};

export const deleteMaterial = async (id) => {
  const materialId = Number(id);

  const recipeUsage = await queryOne(
    db,
    'SELECT COUNT(*) AS total FROM product_materials WHERE material_id = ?',
    [materialId]
  );
  if (Number(recipeUsage.total) > 0) {
    throw new ConflictError('Bahan masih dipakai di resep produk. Hapus dulu dari resep sebelum menghapus bahan.');
  }

  const orderUsage = await queryOne(
    db,
    'SELECT COUNT(*) AS total FROM order_material_usage WHERE material_id = ?',
    [materialId]
  );
  if (Number(orderUsage.total) > 0) {
    throw new ConflictError('Bahan sudah pernah dipakai pesanan selesai. Riwayat stok harus dipertahankan.');
  }

  const { changes } = await queryRun(db, 'DELETE FROM materials WHERE id = ?', [materialId]);
  return changes > 0;
};

export const addStockMovement = async (id, input) => {
  const material = await getMaterialById(id);
  if (!material) return null;

  return inTransaction((tx) =>
    _applyStockMovement(tx, {
      materialId: material.id,
      tipe: input.tipe,
      jumlah: input.jumlah,
      hargaSatuan: input.hargaSatuan,
      catatan: input.catatan,
      referensi: 'manual',
    })
  );
};

/* ─── Products ─── */

const _getProductMaterials = async (client, productId) => {
  const rows = await queryAll(
    client,
    `SELECT pm.material_id, pm.qty, m.nama, m.satuan, m.stok,
            m.harga_satuan, m.stok_minimum
     FROM product_materials pm
     JOIN materials m ON m.id = pm.material_id
     WHERE pm.product_id = ?
     ORDER BY m.nama COLLATE NOCASE`,
    [Number(productId)]
  );
  return rows.map((row) => ({
    materialId: Number(row.material_id),
    nama: row.nama,
    satuan: row.satuan,
    stok: Number(row.stok),
    stokMinimum: Number(row.stok_minimum),
    qty: Number(row.qty),
    hargaSatuan: Number(row.harga_satuan),
    subtotal: Number(row.qty) * Number(row.harga_satuan),
  }));
};

export const getProductMaterials = (productId) => _getProductMaterials(db, productId);

const calculateProductPricing = (product, materials = []) => {
  const materialCost =
    product.modeBiaya === 'manual'
      ? product.biayaBahanManual
      : materials.reduce((t, item) => t + item.qty * item.hargaSatuan, 0);

  return calculatePricing({
    materialCost,
    yieldQty: product.yieldQty,
    packagingCost: product.biayaKemasan,
    laborPercent: product.tenagaKerjaPersen,
    overheadPercent: product.overheadPersen,
    marginPercent: product.marginPersen,
    roundingStep: product.pembulatan,
  });
};

const getMaxProduction = (product, materials = []) => {
  if (product.modeBiaya !== 'bom' || materials.length === 0) return null;
  const limits = materials.map((item) => {
    const batches = item.qty > 0 ? item.stok / item.qty : 0;
    return Math.floor(batches * product.yieldQty);
  });
  return Math.max(0, Math.min(...limits));
};

const _getProductById = async (client, id) => {
  const row = await queryOne(client, 'SELECT * FROM products WHERE id = ?', [Number(id)]);
  return mapProduct(row);
};

export const getProductById = (id) => _getProductById(db, id);

export const listProducts = async () => {
  const rows = await queryAll(
    db,
    'SELECT * FROM products ORDER BY kategori, nama COLLATE NOCASE'
  );
  return Promise.all(
    rows.map(async (row) => {
      const product = mapProduct(row);
      const materials = await _getProductMaterials(db, product.id);
      return {
        ...product,
        materials,
        materialCount: materials.length,
        pricing: calculateProductPricing(product, materials),
      };
    })
  );
};

export const getProductDetail = async (id) => {
  const product = await _getProductById(db, id);
  if (!product) return null;
  const materials = await _getProductMaterials(db, product.id);
  return {
    product,
    materials,
    pricing: calculateProductPricing(product, materials),
    maxProduction: getMaxProduction(product, materials),
  };
};

const _validateRecipeMaterials = async (client, materials) => {
  for (const item of materials) {
    if (!(await _getMaterialById(client, item.materialId))) {
      throw new ValidationError('Salah satu bahan pada resep tidak ditemukan.');
    }
  }
};

const _replaceProductMaterials = async (client, productId, materials) => {
  await _validateRecipeMaterials(client, materials);
  await queryRun(client, 'DELETE FROM product_materials WHERE product_id = ?', [productId]);
  for (const item of materials) {
    await queryRun(
      client,
      'INSERT INTO product_materials (product_id, material_id, qty) VALUES (?, ?, ?)',
      [productId, item.materialId, item.qty]
    );
  }
};

export const createProduct = async (input) => {
  const productId = await inTransaction(async (tx) => {
    const { lastInsertRowid } = await queryRun(
      tx,
      `INSERT INTO products
        (nama, kategori, varian, yield_qty, biaya_kemasan, margin_persen,
         tenaga_kerja_persen, overhead_persen, pembulatan, mode_biaya,
         biaya_bahan_manual, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.nama, input.kategori, input.varian, input.yieldQty,
        input.biayaKemasan, input.marginPersen, input.tenagaKerjaPersen,
        input.overheadPersen, input.pembulatan, input.modeBiaya,
        input.biayaBahanManual, input.catatan,
      ]
    );
    await _replaceProductMaterials(tx, lastInsertRowid, input.materials);
    return lastInsertRowid;
  });
  return getProductDetail(productId);
};

export const updateProduct = async (id, input) => {
  const productId = Number(id);
  const updated = await inTransaction(async (tx) => {
    const { changes } = await queryRun(
      tx,
      `UPDATE products
       SET nama = ?, kategori = ?, varian = ?, yield_qty = ?,
           biaya_kemasan = ?, margin_persen = ?, tenaga_kerja_persen = ?,
           overhead_persen = ?, pembulatan = ?, mode_biaya = ?,
           biaya_bahan_manual = ?, catatan = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        input.nama, input.kategori, input.varian, input.yieldQty,
        input.biayaKemasan, input.marginPersen, input.tenagaKerjaPersen,
        input.overheadPersen, input.pembulatan, input.modeBiaya,
        input.biayaBahanManual, input.catatan, productId,
      ]
    );
    if (changes === 0) return false;
    await _replaceProductMaterials(tx, productId, input.materials);
    return true;
  });
  return updated ? getProductDetail(productId) : null;
};

export const deleteProduct = async (id) => {
  const productId = Number(id);
  return inTransaction(async (tx) => {
    await queryRun(tx, 'UPDATE orders SET product_id = NULL WHERE product_id = ?', [productId]);
    const { changes } = await queryRun(tx, 'DELETE FROM products WHERE id = ?', [productId]);
    return changes > 0;
  });
};

/* ─── Orders ─── */

const ORDER_FIELDS = `
  o.id, o.nama, o.kategori, o.varian, o.tambahan, o.harga, o.qty, o.total,
  o.status, o.tanggal, o.product_id, p.nama AS product_nama
`;
const ORDER_FROM = 'orders o LEFT JOIN products p ON p.id = o.product_id';

const _getOrderById = async (client, id) => {
  const row = await queryOne(
    client,
    `SELECT ${ORDER_FIELDS} FROM ${ORDER_FROM} WHERE o.id = ?`,
    [id]
  );
  return toPlainOrder(row);
};

const _getOrderSnapshot = async (client, id) => {
  const row = await queryOne(
    client,
    'SELECT * FROM order_cost_snapshots WHERE order_id = ?',
    [id]
  );
  return row
    ? {
      orderId: row.order_id,
      productId: row.product_id != null ? Number(row.product_id) : null,
      productNama: row.product_nama,
      materialCost: Number(row.material_cost),
      laborCost: Number(row.labor_cost),
      overheadCost: Number(row.overhead_cost),
      hppTotal: Number(row.hpp_total),
      hppPerUnit: Number(row.hpp_per_unit),
      packagingCost: Number(row.packaging_cost),
      modalPerUnit: Number(row.modal_per_unit),
      marginPercent: Number(row.margin_percent),
      marginAmount: Number(row.margin_amount),
      sellingPriceRaw: Number(row.selling_price_raw),
      sellingPriceFinal: Number(row.selling_price_final),
      bepRatio: Number(row.bep_ratio),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
    : null;
};

const _getOrderMaterialUsage = async (client, orderId) => {
  const rows = await queryAll(
    client,
    `SELECT omu.material_id, omu.qty, omu.harga_satuan, m.nama, m.satuan
     FROM order_material_usage omu
     JOIN materials m ON m.id = omu.material_id
     WHERE omu.order_id = ?
     ORDER BY m.nama COLLATE NOCASE`,
    [orderId]
  );
  return rows.map((row) => ({
    materialId: Number(row.material_id),
    nama: row.nama,
    satuan: row.satuan,
    qty: Number(row.qty),
    hargaSatuan: Number(row.harga_satuan),
    subtotal: Number(row.qty) * Number(row.harga_satuan),
  }));
};

const _upsertOrderSnapshot = async (client, order) => {
  if (!order.productId) {
    await queryRun(client, 'DELETE FROM order_cost_snapshots WHERE order_id = ?', [order.id]);
    return;
  }

  const product = await _getProductById(client, order.productId);
  if (!product) {
    await queryRun(client, 'DELETE FROM order_cost_snapshots WHERE order_id = ?', [order.id]);
    return;
  }

  const materials = await _getProductMaterials(client, order.productId);
  const pricing = calculateProductPricing(product, materials);
  await queryRun(
    client,
    `INSERT INTO order_cost_snapshots
      (order_id, product_id, product_nama, material_cost, labor_cost,
       overhead_cost, hpp_total, hpp_per_unit, packaging_cost, modal_per_unit,
       margin_percent, margin_amount, selling_price_raw, selling_price_final, bep_ratio)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(order_id) DO UPDATE SET
       product_id = excluded.product_id,
       product_nama = excluded.product_nama,
       material_cost = excluded.material_cost,
       labor_cost = excluded.labor_cost,
       overhead_cost = excluded.overhead_cost,
       hpp_total = excluded.hpp_total,
       hpp_per_unit = excluded.hpp_per_unit,
       packaging_cost = excluded.packaging_cost,
       modal_per_unit = excluded.modal_per_unit,
       margin_percent = excluded.margin_percent,
       margin_amount = excluded.margin_amount,
       selling_price_raw = excluded.selling_price_raw,
       selling_price_final = excluded.selling_price_final,
       bep_ratio = excluded.bep_ratio,
       updated_at = CURRENT_TIMESTAMP`,
    [
      order.id, product.id, product.nama,
      pricing.materialCost, pricing.laborCost, pricing.overheadCost,
      pricing.hppTotal, pricing.hppPerUnit, pricing.packagingCost,
      pricing.modalPerUnit, pricing.marginPercent, pricing.marginAmount,
      pricing.sellingPriceRaw, pricing.sellingPriceFinal, pricing.bepRatio,
    ]
  );
};

const _ensureProductExists = async (client, productId) => {
  if (productId === null || productId === undefined) return;
  const product = await _getProductById(client, productId);
  if (!product) throw new ValidationError('Produk yang dipilih tidak ditemukan.');
};

const _getNextOrderId = async (client) => {
  const row = await queryOne(
    client,
    "SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) AS maxNumber FROM orders WHERE id LIKE 'ORD-%'"
  );
  const nextNumber = Number(row?.maxNumber ?? 0) + 1;
  return `ORD-${String(nextNumber).padStart(3, '0')}`;
};

export const listOrders = async () => {
  const rows = await queryAll(
    db,
    `SELECT ${ORDER_FIELDS} FROM ${ORDER_FROM} ORDER BY o.tanggal DESC, o.created_at DESC, o.id DESC`
  );
  return rows.map(toPlainOrder);
};

export const getOrderDetail = async (id) => {
  const order = await _getOrderById(db, id);
  if (!order) return null;
  return {
    ...order,
    snapshot: await _getOrderSnapshot(db, id),
    materialsUsed: await _getOrderMaterialUsage(db, id),
  };
};

export const createOrder = async (orderInput) => {
  const id = await inTransaction(async (tx) => {
    await _ensureProductExists(tx, orderInput.productId);
    const nextId = await _getNextOrderId(tx);
    const status = orderInput.status || 'Pending';
    const tanggal = orderInput.tanggal || getTodayDate();

    await queryRun(
      tx,
      `INSERT INTO orders
        (id, nama, kategori, varian, tambahan, harga, qty, total, status, tanggal, product_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nextId, orderInput.nama, orderInput.kategori, orderInput.varian,
        orderInput.tambahan, orderInput.harga, orderInput.qty, orderInput.total,
        status, tanggal, orderInput.productId ?? null]
    );

    const created = await _getOrderById(tx, nextId);
    await _upsertOrderSnapshot(tx, created);
    return nextId;
  });
  return _getOrderById(db, id);
};

export const updateOrder = async (id, orderInput) => {
  const updated = await inTransaction(async (tx) => {
    const existing = await _getOrderById(tx, id);
    if (!existing) return false;

    const usage = await queryOne(
      tx,
      'SELECT COUNT(*) AS total FROM order_material_usage WHERE order_id = ?',
      [id]
    );
    if (Number(usage.total) > 0) {
      throw new ConflictError(
        'Pesanan ini sudah memotong stok. Klik status sampai kembali ke Pending sebelum mengedit.'
      );
    }

    await _ensureProductExists(tx, orderInput.productId);
    await queryRun(
      tx,
      `UPDATE orders
       SET nama = ?, kategori = ?, varian = ?, tambahan = ?,
           harga = ?, qty = ?, total = ?, product_id = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [orderInput.nama, orderInput.kategori, orderInput.varian, orderInput.tambahan,
      orderInput.harga, orderInput.qty, orderInput.total,
      orderInput.productId ?? null, id]
    );

    const updatedOrder = await _getOrderById(tx, id);
    await _upsertOrderSnapshot(tx, updatedOrder);
    return true;
  });
  return updated ? _getOrderById(db, id) : null;
};

const _consumeOrderMaterials = async (client, order) => {
  if (!order.productId) return;
  const product = await _getProductById(client, order.productId);
  if (!product) return;
  const materials = await _getProductMaterials(client, order.productId);
  if (product.modeBiaya !== 'bom' || materials.length === 0) return;

  const batches = order.qty / product.yieldQty;
  const lines = materials.map((item) => ({
    ...item,
    needed: roundQuantity(item.qty * batches),
  }));

  const shortages = lines.filter((item) => item.stok + 1e-9 < item.needed);
  if (shortages.length > 0) {
    const detail = shortages
      .map(
        (item) =>
          `${item.nama} butuh ${formatQuantity(item.needed)} ${item.satuan}, tersedia ${formatQuantity(item.stok)} ${item.satuan}`
      )
      .join('; ');
    throw new ConflictError(`Stok bahan belum cukup untuk menyelesaikan pesanan: ${detail}.`);
  }

  for (const item of lines) {
    await _applyStockMovement(client, {
      materialId: item.materialId,
      tipe: 'keluar',
      jumlah: item.needed,
      catatan: `Pemakaian pesanan ${order.id}`,
      referensi: order.id,
    });
    await queryRun(
      client,
      `INSERT INTO order_material_usage (order_id, material_id, qty, harga_satuan) VALUES (?, ?, ?, ?)`,
      [order.id, item.materialId, item.needed, item.hargaSatuan]
    );
  }
};

const _restoreOrderMaterials = async (client, orderId) => {
  const usage = await _getOrderMaterialUsage(client, orderId);
  for (const item of usage) {
    await _applyStockMovement(client, {
      materialId: item.materialId,
      tipe: 'masuk',
      jumlah: item.qty,
      catatan: `Stok dikembalikan dari pesanan ${orderId}`,
      referensi: orderId,
    });
  }
  await queryRun(client, 'DELETE FROM order_material_usage WHERE order_id = ?', [orderId]);
};

export const cycleOrderStatus = async (id) =>
  inTransaction(async (tx) => {
    const order = await _getOrderById(tx, id);
    if (!order) return null;

    const currentIndex = ORDER_STATUSES.indexOf(order.status);
    const nextStatus = ORDER_STATUSES[(currentIndex + 1) % ORDER_STATUSES.length];

    if (nextStatus === 'Selesai') {
      await _consumeOrderMaterials(tx, order);
    } else if (order.status === 'Selesai') {
      await _restoreOrderMaterials(tx, id);
    }

    await queryRun(
      tx,
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nextStatus, id]
    );

    return _getOrderById(tx, id);
  });

export const deleteOrder = async (id) =>
  inTransaction(async (tx) => {
    await _restoreOrderMaterials(tx, id);
    const { changes } = await queryRun(tx, 'DELETE FROM orders WHERE id = ?', [id]);
    return changes > 0;
  });

export const importOrders = async (orders) => {
  let imported = 0;
  await inTransaction(async (tx) => {
    for (const order of orders) {
      const { changes } = await queryRun(
        tx,
        `INSERT OR IGNORE INTO orders
          (id, nama, kategori, varian, tambahan, harga, qty, total, status, tanggal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [order.id, order.nama, order.kategori, order.varian, order.tambahan,
        order.harga, order.qty, order.total, order.status, order.tanggal]
      );
      if (changes > 0) imported += 1;
    }
  });
  return imported;
};

/* ─── Seed ─── */

const seedAdmin = async () => {
  const existing = await queryOne(
    db,
    'SELECT id, username, password_hash FROM admins ORDER BY id LIMIT 1'
  );

  if (!existing) {
    const passwordHash = bcrypt.hashSync(config.adminPassword, 12);
    await queryRun(
      db,
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      [config.adminUsername, passwordHash]
    );
    console.log(`[db] Admin "${config.adminUsername}" berhasil dibuat.`);
    return;
  }

  await queryRun(db, 'DELETE FROM admins WHERE id <> ?', [Number(existing.id)]);

  const usernameChanged = existing.username !== config.adminUsername;
  const passwordChanged = !bcrypt.compareSync(config.adminPassword, existing.password_hash);

  if (usernameChanged || passwordChanged) {
    const passwordHash = passwordChanged
      ? bcrypt.hashSync(config.adminPassword, 12)
      : existing.password_hash;
    await queryRun(
      db,
      `UPDATE admins SET username = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [config.adminUsername, passwordHash, Number(existing.id)]
    );
    console.log('[db] Kredensial admin disinkronkan dari .env.');
  }
};

const seedProducts = async () => {
  const row = await queryOne(db, 'SELECT COUNT(*) AS total FROM products');
  if (Number(row.total) > 0) return;

  const products = [
    {
      nama: 'Buket Bunga Matahari & Lily',
      kategori: 'Buket',
      varian: 'Bunga Matahari & Lily',
      yieldQty: 1,
      biayaKemasan: 0,
      marginPersen: 48,
      tenagaKerjaPersen: 20,
      overheadPersen: 10,
      pembulatan: 1000,
      modeBiaya: 'manual',
      biayaBahanManual: 9121,
      catatan: 'Contoh awal dari parameter RAB.',
      materials: [],
    },
    {
      nama: 'Gelang Tropical Vibes',
      kategori: 'Gelang',
      varian: 'Tropical Vibes',
      yieldQty: 50,
      biayaKemasan: 500,
      marginPersen: 185,
      tenagaKerjaPersen: 20,
      overheadPersen: 10,
      pembulatan: 1000,
      modeBiaya: 'manual',
      biayaBahanManual: 114000,
      catatan: 'Contoh awal produksi batch 50 gelang.',
      materials: [],
    },
  ];

  for (const product of products) {
    await createProduct(product);
  }
  console.log('[db] Contoh produk awal berhasil dibuat.');
};

/* ─── Init (called once from server/index.js) ─── */

export const initDb = async () => {
  // Set foreign keys (skip WAL as Turso handles that server-side)
  if (!config.tursoUrl) {
    await db.executeMultiple('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  } else {
    await db.execute('PRAGMA foreign_keys = ON');
  }

  // Create schema
  await db.executeMultiple(SCHEMA_SQL);

  // Add product_id column to orders if missing (migration)
  try {
    const cols = await queryAll(db, 'PRAGMA table_info(orders)');
    if (!cols.some((c) => c.name === 'product_id')) {
      await db.execute('ALTER TABLE orders ADD COLUMN product_id INTEGER REFERENCES products(id)');
    }
  } catch {
    // Column already exists or PRAGMA not supported — safe to ignore
  }

  await seedAdmin();
  await seedProducts();

  console.log(`[db] Terhubung ke: ${config.tursoUrl ? 'Turso cloud' : 'SQLite lokal'}`);
};
