import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { assertConfig, config } from './config.js';
import { ORDER_STATUSES } from './constants.js';
import { calculatePricing } from '../shared/pricing.js';
import {
  ConflictError,
  getTodayDate,
  ValidationError,
} from './validators.js';

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
`);

const orderColumns = db.prepare('PRAGMA table_info(orders)').all();

if (!orderColumns.some((column) => column.name === 'product_id')) {
  db.exec('ALTER TABLE orders ADD COLUMN product_id INTEGER REFERENCES products(id)');
}

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

const inTransaction = (operation) => {
  db.exec('BEGIN');

  try {
    const result = operation();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};

const roundQuantity = (value) => Math.round(Number(value) * 1e6) / 1e6;

const formatQuantity = (value) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(
    roundQuantity(value)
  );

const ORDER_FIELDS = `
  o.id, o.nama, o.kategori, o.varian, o.tambahan, o.harga, o.qty, o.total,
  o.status, o.tanggal, o.product_id, p.nama AS product_nama
`;

const ORDER_FROM = 'orders o LEFT JOIN products p ON p.id = o.product_id';

const toPlainOrder = (row) =>
  row
    ? {
        ...row,
        productId: row.product_id,
        productNama: row.product_nama,
      }
    : null;

export const getAdminByUsername = (username) =>
  db
    .prepare('SELECT id, username, password_hash FROM admins WHERE username = ?')
    .get(username) ?? null;

export const getAdminById = (id) =>
  db.prepare('SELECT id, username FROM admins WHERE id = ?').get(id) ?? null;

const mapMaterial = (row) =>
  row
    ? {
        id: row.id,
        nama: row.nama,
        satuan: row.satuan,
        stok: row.stok,
        stokMinimum: row.stok_minimum,
        hargaSatuan: row.harga_satuan,
        catatan: row.catatan,
        nilaiStok: row.stok * row.harga_satuan,
        stokRendah: row.stok <= row.stok_minimum,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;

const mapMovement = (row) =>
  row
    ? {
        id: row.id,
        materialId: row.material_id,
        materialNama: row.material_nama,
        tipe: row.tipe,
        jumlah: row.jumlah,
        stokSebelum: row.stok_sebelum,
        stokSesudah: row.stok_sesudah,
        hargaSatuan: row.harga_satuan,
        catatan: row.catatan,
        referensi: row.referensi,
        createdAt: row.created_at,
      }
    : null;

export const getMaterialById = (id) =>
  mapMaterial(
    db.prepare('SELECT * FROM materials WHERE id = ?').get(Number(id)) ?? null
  );

export const listMaterials = () =>
  db
    .prepare(
      `SELECT * FROM materials
       ORDER BY CASE WHEN stok <= stok_minimum THEN 0 ELSE 1 END, nama COLLATE NOCASE`
    )
    .all()
    .map(mapMaterial);

export const getInventorySummary = () => {
  const materials = listMaterials();

  return {
    totalMaterials: materials.length,
    totalStockValue: materials.reduce((total, item) => total + item.nilaiStok, 0),
    lowStockCount: materials.filter((item) => item.stokRendah).length,
  };
};

export const listStockMovements = (limit = 100) =>
  db
    .prepare(
      `SELECT sm.*, m.nama AS material_nama
       FROM stock_movements sm
       JOIN materials m ON m.id = sm.material_id
       ORDER BY sm.created_at DESC, sm.id DESC
       LIMIT ?`
    )
    .all(Math.max(1, Math.min(Number(limit) || 100, 500)))
    .map(mapMovement);

const applyStockMovement = ({
  materialId,
  tipe,
  jumlah,
  hargaSatuan = null,
  catatan = '',
  referensi = '',
}) => {
  const material = getMaterialById(materialId);

  if (!material) {
    throw new ValidationError('Bahan baku tidak ditemukan.');
  }

  const delta =
    tipe === 'penyesuaian'
      ? Number(jumlah) - material.stok
      : tipe === 'masuk'
        ? Number(jumlah)
        : -Number(jumlah);
  const nextStock = roundQuantity(material.stok + delta);

  if (nextStock < 0) {
    throw new ConflictError(
      `Stok ${material.nama} tidak cukup. Tersedia ${formatQuantity(
        material.stok
      )} ${material.satuan}.`
    );
  }

  const nextPrice = hargaSatuan === null ? material.hargaSatuan : hargaSatuan;

  db.prepare(
    `UPDATE materials
     SET stok = ?, harga_satuan = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(nextStock, nextPrice, material.id);

  db.prepare(
    `INSERT INTO stock_movements
      (material_id, tipe, jumlah, stok_sebelum, stok_sesudah, harga_satuan, catatan, referensi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    material.id,
    tipe,
    delta,
    material.stok,
    nextStock,
    nextPrice,
    catatan,
    referensi
  );

  return getMaterialById(material.id);
};

export const createMaterial = (input) => {
  const id = inTransaction(() => {
    const result = db
      .prepare(
        `INSERT INTO materials
          (nama, satuan, stok, stok_minimum, harga_satuan, catatan)
         VALUES (?, ?, 0, ?, ?, ?)`
      )
      .run(
        input.nama,
        input.satuan,
        input.stokMinimum,
        input.hargaSatuan,
        input.catatan
      );

    const materialId = Number(result.lastInsertRowid);

    if (input.stok > 0) {
      applyStockMovement({
        materialId,
        tipe: 'masuk',
        jumlah: input.stok,
        hargaSatuan: input.hargaSatuan,
        catatan: 'Stok awal bahan',
        referensi: 'stok-awal',
      });
    }

    return materialId;
  });

  return getMaterialById(id);
};

export const updateMaterial = (id, input) => {
  const result = db
    .prepare(
      `UPDATE materials
       SET nama = ?, satuan = ?, stok_minimum = ?, harga_satuan = ?,
           catatan = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .run(
      input.nama,
      input.satuan,
      input.stokMinimum,
      input.hargaSatuan,
      input.catatan,
      Number(id)
    );

  if (Number(result.changes) === 0) return null;
  return getMaterialById(id);
};

export const deleteMaterial = (id) => {
  const materialId = Number(id);
  const recipeUsage = db
    .prepare('SELECT COUNT(*) AS total FROM product_materials WHERE material_id = ?')
    .get(materialId);

  if (Number(recipeUsage.total) > 0) {
    throw new ConflictError(
      'Bahan masih dipakai di resep produk. Hapus dulu dari resep sebelum menghapus bahan.'
    );
  }

  const orderUsage = db
    .prepare('SELECT COUNT(*) AS total FROM order_material_usage WHERE material_id = ?')
    .get(materialId);

  if (Number(orderUsage.total) > 0) {
    throw new ConflictError(
      'Bahan sudah pernah dipakai pesanan selesai. Riwayat stok harus dipertahankan.'
    );
  }

  const result = db.prepare('DELETE FROM materials WHERE id = ?').run(materialId);
  return Number(result.changes) > 0;
};

export const addStockMovement = (id, input) => {
  const material = getMaterialById(id);
  if (!material) return null;

  return inTransaction(() =>
    applyStockMovement({
      materialId: material.id,
      tipe: input.tipe,
      jumlah: input.jumlah,
      hargaSatuan: input.hargaSatuan,
      catatan: input.catatan,
      referensi: 'manual',
    })
  );
};

const mapProduct = (row) =>
  row
    ? {
        id: row.id,
        nama: row.nama,
        kategori: row.kategori,
        varian: row.varian,
        yieldQty: row.yield_qty,
        biayaKemasan: row.biaya_kemasan,
        marginPersen: row.margin_persen,
        tenagaKerjaPersen: row.tenaga_kerja_persen,
        overheadPersen: row.overhead_persen,
        pembulatan: row.pembulatan,
        modeBiaya: row.mode_biaya,
        biayaBahanManual: row.biaya_bahan_manual,
        aktif: Boolean(row.aktif),
        catatan: row.catatan,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;

const getProductRowById = (id) =>
  db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id)) ?? null;

export const getProductMaterials = (productId) =>
  db
    .prepare(
      `SELECT pm.material_id, pm.qty, m.nama, m.satuan, m.stok,
              m.harga_satuan, m.stok_minimum
       FROM product_materials pm
       JOIN materials m ON m.id = pm.material_id
       WHERE pm.product_id = ?
       ORDER BY m.nama COLLATE NOCASE`
    )
    .all(Number(productId))
    .map((row) => ({
      materialId: row.material_id,
      nama: row.nama,
      satuan: row.satuan,
      stok: row.stok,
      stokMinimum: row.stok_minimum,
      qty: row.qty,
      hargaSatuan: row.harga_satuan,
      subtotal: row.qty * row.harga_satuan,
    }));

const calculateProductPricing = (product, materials = []) => {
  const materialCost =
    product.modeBiaya === 'manual'
      ? product.biayaBahanManual
      : materials.reduce((total, item) => total + item.qty * item.hargaSatuan, 0);

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

export const getProductById = (id) => mapProduct(getProductRowById(id));

export const listProducts = () =>
  db
    .prepare('SELECT * FROM products ORDER BY kategori, nama COLLATE NOCASE')
    .all()
    .map((row) => {
      const product = mapProduct(row);
      const materials = getProductMaterials(product.id);

      return {
        ...product,
        materials,
        materialCount: materials.length,
        pricing: calculateProductPricing(product, materials),
      };
    });

export const getProductDetail = (id) => {
  const product = getProductById(id);
  if (!product) return null;

  const materials = getProductMaterials(product.id);

  return {
    product,
    materials,
    pricing: calculateProductPricing(product, materials),
    maxProduction: getMaxProduction(product, materials),
  };
};

const validateRecipeMaterials = (materials) => {
  for (const item of materials) {
    if (!getMaterialById(item.materialId)) {
      throw new ValidationError('Salah satu bahan pada resep tidak ditemukan.');
    }
  }
};

const replaceProductMaterials = (productId, materials) => {
  validateRecipeMaterials(materials);
  db.prepare('DELETE FROM product_materials WHERE product_id = ?').run(productId);

  const insert = db.prepare(
    'INSERT INTO product_materials (product_id, material_id, qty) VALUES (?, ?, ?)'
  );

  for (const item of materials) {
    insert.run(productId, item.materialId, item.qty);
  }
};

export const createProduct = (input) => {
  const id = inTransaction(() => {
    const result = db
      .prepare(
        `INSERT INTO products
          (nama, kategori, varian, yield_qty, biaya_kemasan, margin_persen,
           tenaga_kerja_persen, overhead_persen, pembulatan, mode_biaya,
           biaya_bahan_manual, catatan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.nama,
        input.kategori,
        input.varian,
        input.yieldQty,
        input.biayaKemasan,
        input.marginPersen,
        input.tenagaKerjaPersen,
        input.overheadPersen,
        input.pembulatan,
        input.modeBiaya,
        input.biayaBahanManual,
        input.catatan
      );

    const productId = Number(result.lastInsertRowid);
    replaceProductMaterials(productId, input.materials);
    return productId;
  });

  return getProductDetail(id);
};

export const updateProduct = (id, input) => {
  const productId = Number(id);
  const updated = inTransaction(() => {
    const result = db
      .prepare(
        `UPDATE products
         SET nama = ?, kategori = ?, varian = ?, yield_qty = ?,
             biaya_kemasan = ?, margin_persen = ?, tenaga_kerja_persen = ?,
             overhead_persen = ?, pembulatan = ?, mode_biaya = ?,
             biaya_bahan_manual = ?, catatan = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .run(
        input.nama,
        input.kategori,
        input.varian,
        input.yieldQty,
        input.biayaKemasan,
        input.marginPersen,
        input.tenagaKerjaPersen,
        input.overheadPersen,
        input.pembulatan,
        input.modeBiaya,
        input.biayaBahanManual,
        input.catatan,
        productId
      );

    if (Number(result.changes) === 0) return false;

    replaceProductMaterials(productId, input.materials);
    return true;
  });

  return updated ? getProductDetail(productId) : null;
};

export const deleteProduct = (id) => {
  const productId = Number(id);

  const deleted = inTransaction(() => {
    db.prepare('UPDATE orders SET product_id = NULL WHERE product_id = ?').run(
      productId
    );
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    return Number(result.changes) > 0;
  });

  return deleted;
};

const getOrderById = (id) =>
  toPlainOrder(
    db
      .prepare(`SELECT ${ORDER_FIELDS} FROM ${ORDER_FROM} WHERE o.id = ?`)
      .get(id)
  );

const getOrderSnapshot = (id) => {
  const row = db
    .prepare('SELECT * FROM order_cost_snapshots WHERE order_id = ?')
    .get(id);

  return row
    ? {
        orderId: row.order_id,
        productId: row.product_id,
        productNama: row.product_nama,
        materialCost: row.material_cost,
        laborCost: row.labor_cost,
        overheadCost: row.overhead_cost,
        hppTotal: row.hpp_total,
        hppPerUnit: row.hpp_per_unit,
        packagingCost: row.packaging_cost,
        modalPerUnit: row.modal_per_unit,
        marginPercent: row.margin_percent,
        marginAmount: row.margin_amount,
        sellingPriceRaw: row.selling_price_raw,
        sellingPriceFinal: row.selling_price_final,
        bepRatio: row.bep_ratio,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;
};

const getOrderMaterialUsage = (orderId) =>
  db
    .prepare(
      `SELECT omu.material_id, omu.qty, omu.harga_satuan, m.nama, m.satuan
       FROM order_material_usage omu
       JOIN materials m ON m.id = omu.material_id
       WHERE omu.order_id = ?
       ORDER BY m.nama COLLATE NOCASE`
    )
    .all(orderId)
    .map((row) => ({
      materialId: row.material_id,
      nama: row.nama,
      satuan: row.satuan,
      qty: row.qty,
      hargaSatuan: row.harga_satuan,
      subtotal: row.qty * row.harga_satuan,
    }));

const upsertOrderSnapshot = (order) => {
  if (!order.productId) {
    db.prepare('DELETE FROM order_cost_snapshots WHERE order_id = ?').run(order.id);
    return;
  }

  const detail = getProductDetail(order.productId);

  if (!detail) {
    db.prepare('DELETE FROM order_cost_snapshots WHERE order_id = ?').run(order.id);
    return;
  }

  const { product, pricing } = detail;

  db.prepare(
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
       updated_at = CURRENT_TIMESTAMP`
  ).run(
    order.id,
    product.id,
    product.nama,
    pricing.materialCost,
    pricing.laborCost,
    pricing.overheadCost,
    pricing.hppTotal,
    pricing.hppPerUnit,
    pricing.packagingCost,
    pricing.modalPerUnit,
    pricing.marginPercent,
    pricing.marginAmount,
    pricing.sellingPriceRaw,
    pricing.sellingPriceFinal,
    pricing.bepRatio
  );
};

const ensureProductExists = (productId) => {
  if (productId === null || productId === undefined) return;
  if (!getProductById(productId)) {
    throw new ValidationError('Produk yang dipilih tidak ditemukan.');
  }
};

export const listOrders = () =>
  db
    .prepare(
      `SELECT ${ORDER_FIELDS} FROM ${ORDER_FROM}
       ORDER BY o.tanggal DESC, o.created_at DESC, o.id DESC`
    )
    .all()
    .map(toPlainOrder);

export const getOrderDetail = (id) => {
  const order = getOrderById(id);
  if (!order) return null;

  return {
    ...order,
    snapshot: getOrderSnapshot(id),
    materialsUsed: getOrderMaterialUsage(id),
  };
};

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
  const id = inTransaction(() => {
    ensureProductExists(orderInput.productId);
    const nextId = getNextOrderId();
    const status = orderInput.status || 'Pending';
    const tanggal = orderInput.tanggal || getTodayDate();

    db.prepare(
      `INSERT INTO orders
        (id, nama, kategori, varian, tambahan, harga, qty, total, status, tanggal, product_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      nextId,
      orderInput.nama,
      orderInput.kategori,
      orderInput.varian,
      orderInput.tambahan,
      orderInput.harga,
      orderInput.qty,
      orderInput.total,
      status,
      tanggal,
      orderInput.productId
    );

    const created = getOrderById(nextId);
    upsertOrderSnapshot(created);
    return nextId;
  });

  return getOrderById(id);
};

export const updateOrder = (id, orderInput) => {
  const updated = inTransaction(() => {
    const existing = getOrderById(id);
    if (!existing) return false;

    const usage = db
      .prepare('SELECT COUNT(*) AS total FROM order_material_usage WHERE order_id = ?')
      .get(id);

    if (Number(usage.total) > 0) {
      throw new ConflictError(
        'Pesanan ini sudah memotong stok. Klik status sampai kembali ke Pending sebelum mengedit.'
      );
    }

    ensureProductExists(orderInput.productId);

    db.prepare(
      `UPDATE orders
       SET nama = ?, kategori = ?, varian = ?, tambahan = ?,
           harga = ?, qty = ?, total = ?, product_id = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(
      orderInput.nama,
      orderInput.kategori,
      orderInput.varian,
      orderInput.tambahan,
      orderInput.harga,
      orderInput.qty,
      orderInput.total,
      orderInput.productId,
      id
    );

    upsertOrderSnapshot(getOrderById(id));
    return true;
  });

  return updated ? getOrderById(id) : null;
};

const consumeOrderMaterials = (order) => {
  if (!order.productId) return;

  const product = getProductById(order.productId);
  if (!product) return;

  const materials = getProductMaterials(order.productId);
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
          `${item.nama} butuh ${formatQuantity(item.needed)} ${item.satuan}, tersedia ${formatQuantity(
            item.stok
          )} ${item.satuan}`
      )
      .join('; ');

    throw new ConflictError(
      `Stok bahan belum cukup untuk menyelesaikan pesanan: ${detail}.`
    );
  }

  for (const item of lines) {
    applyStockMovement({
      materialId: item.materialId,
      tipe: 'keluar',
      jumlah: item.needed,
      catatan: `Pemakaian pesanan ${order.id}`,
      referensi: order.id,
    });

    db.prepare(
      `INSERT INTO order_material_usage (order_id, material_id, qty, harga_satuan)
       VALUES (?, ?, ?, ?)`
    ).run(order.id, item.materialId, item.needed, item.hargaSatuan);
  }
};

const restoreOrderMaterials = (orderId) => {
  const usage = getOrderMaterialUsage(orderId);

  for (const item of usage) {
    applyStockMovement({
      materialId: item.materialId,
      tipe: 'masuk',
      jumlah: item.qty,
      catatan: `Stok dikembalikan dari pesanan ${orderId}`,
      referensi: orderId,
    });
  }

  db.prepare('DELETE FROM order_material_usage WHERE order_id = ?').run(orderId);
};

export const cycleOrderStatus = (id) =>
  inTransaction(() => {
    const order = getOrderById(id);
    if (!order) return null;

    const currentIndex = ORDER_STATUSES.indexOf(order.status);
    const nextStatus = ORDER_STATUSES[(currentIndex + 1) % ORDER_STATUSES.length];

    if (nextStatus === 'Selesai') {
      consumeOrderMaterials(order);
    } else if (order.status === 'Selesai') {
      restoreOrderMaterials(id);
    }

    db.prepare(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(nextStatus, id);

    return getOrderById(id);
  });

export const deleteOrder = (id) =>
  inTransaction(() => {
    restoreOrderMaterials(id);
    const result = db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    return Number(result.changes) > 0;
  });

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

seedAdmin();

const seedProducts = () => {
  const count = db.prepare('SELECT COUNT(*) AS total FROM products').get();

  if (Number(count.total) > 0) return;

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
    createProduct(product);
  }

  console.log('[db] Contoh produk awal berhasil dibuat.');
};

seedProducts();
