import {
  BUKET_VARIANTS,
  CATEGORIES,
  ORDER_STATUSES,
  PRODUCT_COST_MODES,
  STOCK_MOVEMENT_TYPES,
} from './constants.js';
import { sumShoppingList } from '../shared/pricing.js';

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.status = 409;
  }
}

const toTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

const isValidDateString = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isValidOrderId = (value) => /^[A-Za-z0-9_-]{2,40}$/.test(value);

const parseNumber = (value, message) => {
  if (value === '' || value === null || value === undefined) {
    throw new ValidationError(message);
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new ValidationError(message);
  }

  return number;
};

const parseNonNegativeNumber = (value, message) => {
  const number = parseNumber(value, message);
  if (number < 0) throw new ValidationError(message);
  return number;
};

const parseNonNegativeInteger = (value, message) => {
  const number = parseNumber(value, message);
  if (!Number.isInteger(number) || number < 0) throw new ValidationError(message);
  return number;
};

const parsePositiveInteger = (value, message) => {
  const number = parseNumber(value, message);
  if (!Number.isInteger(number) || number < 1) throw new ValidationError(message);
  return number;
};

const parseOptionalId = (value, message) => {
  if (value === '' || value === null || value === undefined) return null;
  return parsePositiveInteger(value, message);
};

const parsePercentage = (value, fallback, message) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const number = parseNonNegativeNumber(value, message);
  if (number > 1000) throw new ValidationError(message);
  return number;
};

export const parseRouteId = (value, label = 'Data') => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError(`ID ${label} tidak valid.`);
  }
  return id;
};

export const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const validateOrderPayload = (input, options = {}) => {
  const { includeId = false, includeStatus = false, includeTanggal = false } = options;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('Data pesanan tidak valid.');
  }

  const nama = toTrimmedString(input.nama);
  if (!nama) {
    throw new ValidationError('Nama pelanggan wajib diisi.');
  }

  if (nama.length > 100) {
    throw new ValidationError('Nama pelanggan maksimal 100 karakter.');
  }

  const kategori = toTrimmedString(input.kategori);
  if (!CATEGORIES.includes(kategori)) {
    throw new ValidationError('Kategori produk tidak valid.');
  }

  const varian = toTrimmedString(input.varian);
  if (!varian) {
    throw new ValidationError('Detail atau varian produk wajib diisi.');
  }

  if (varian.length > 100) {
    throw new ValidationError('Detail produk maksimal 100 karakter.');
  }

  if (input.harga === '' || input.harga === null || input.harga === undefined) {
    throw new ValidationError('Harga satuan wajib diisi.');
  }

  const harga = Number(input.harga);
  if (!Number.isInteger(harga) || harga < 0) {
    throw new ValidationError('Harga satuan harus bilangan bulat minimal 0.');
  }

  if (input.qty === '' || input.qty === null || input.qty === undefined) {
    throw new ValidationError('Jumlah pesanan wajib diisi.');
  }

  const qty = Number(input.qty);
  if (!Number.isInteger(qty) || qty < 1) {
    throw new ValidationError('Jumlah pesanan harus bilangan bulat minimal 1.');
  }

  let tambahan = toTrimmedString(input.tambahan) || '-';
  if (kategori === 'Buket') {
    tambahan = BUKET_VARIANTS.includes(tambahan) ? tambahan : 'Tanpa Cokelat';
  } else {
    tambahan = '-';
  }

  const productId = parseOptionalId(
    input.productId ?? input.product_id,
    'Produk yang dipilih tidak valid.'
  );

  const order = {
    nama,
    kategori,
    varian,
    tambahan,
    harga,
    qty,
    total: harga * qty,
    productId,
  };

  if (includeId) {
    const id = toTrimmedString(input.id);
    if (!isValidOrderId(id)) {
      throw new ValidationError('ID pesanan tidak valid.');
    }
    order.id = id;
  }

  if (includeStatus) {
    const status = toTrimmedString(input.status) || 'Pending';
    if (!ORDER_STATUSES.includes(status)) {
      throw new ValidationError('Status pesanan tidak valid.');
    }
    order.status = status;
  }

  if (includeTanggal) {
    const tanggal = toTrimmedString(input.tanggal);
    if (!isValidDateString(tanggal)) {
      throw new ValidationError('Tanggal pesanan tidak valid.');
    }
    order.tanggal = tanggal;
  }

  return order;
};

export const validateMaterialPayload = (input, options = {}) => {
  const { includeStock = false } = options;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('Data bahan baku tidak valid.');
  }

  const nama = toTrimmedString(input.nama);
  if (!nama) throw new ValidationError('Nama bahan wajib diisi.');
  if (nama.length > 100) {
    throw new ValidationError('Nama bahan maksimal 100 karakter.');
  }

  const satuan = toTrimmedString(input.satuan) || 'pcs';
  if (satuan.length > 20) {
    throw new ValidationError('Satuan maksimal 20 karakter.');
  }

  const stokMinimum = parseNonNegativeNumber(
    input.stokMinimum ?? input.stok_minimum ?? 0,
    'Stok minimum harus angka minimal 0.'
  );

  const hargaSatuan = parseNonNegativeInteger(
    input.hargaSatuan ?? input.harga_satuan ?? 0,
    'Harga satuan harus bilangan bulat minimal 0.'
  );

  const catatan = toTrimmedString(input.catatan);
  if (catatan.length > 500) {
    throw new ValidationError('Catatan bahan maksimal 500 karakter.');
  }

  const material = {
    nama,
    satuan,
    stokMinimum,
    hargaSatuan,
    catatan,
  };

  if (includeStock) {
    material.stok = parseNonNegativeNumber(
      input.stok ?? 0,
      'Stok awal harus angka minimal 0.'
    );
  }

  return material;
};

export const validateStockPayload = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('Data pergerakan stok tidak valid.');
  }

  const tipe = toTrimmedString(input.tipe);
  if (!STOCK_MOVEMENT_TYPES.includes(tipe)) {
    throw new ValidationError('Jenis pergerakan stok tidak valid.');
  }

  const jumlah = parseNonNegativeNumber(
    input.jumlah,
    tipe === 'penyesuaian'
      ? 'Stok baru harus angka minimal 0.'
      : 'Jumlah stok harus angka lebih dari 0.'
  );

  if (tipe !== 'penyesuaian' && jumlah <= 0) {
    throw new ValidationError('Jumlah stok harus lebih dari 0.');
  }

  const hargaSatuan =
    input.hargaSatuan === '' ||
    input.hargaSatuan === null ||
    input.hargaSatuan === undefined
      ? null
      : parseNonNegativeInteger(
          input.hargaSatuan ?? input.harga_satuan,
          'Harga satuan harus bilangan bulat minimal 0.'
        );

  const catatan = toTrimmedString(input.catatan);
  if (catatan.length > 200) {
    throw new ValidationError('Catatan stok maksimal 200 karakter.');
  }

  return { tipe, jumlah, hargaSatuan, catatan };
};

const validateProductMaterials = (value) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new ValidationError('Daftar bahan resep tidak valid.');
  }

  const seen = new Set();

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new ValidationError('Baris bahan resep tidak valid.');
    }

    const materialId = parsePositiveInteger(
      item.materialId ?? item.material_id,
      'Bahan pada resep tidak valid.'
    );
    const qty = parseNonNegativeNumber(
      item.qty,
      'Jumlah bahan pada resep harus lebih dari 0.'
    );

    if (qty <= 0) {
      throw new ValidationError('Jumlah bahan pada resep harus lebih dari 0.');
    }

    if (seen.has(materialId)) {
      throw new ValidationError('Bahan yang sama tidak boleh dipilih dua kali.');
    }

    seen.add(materialId);

    return { materialId, qty };
  });
};

export const validateProductPayload = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('Data produk tidak valid.');
  }

  const nama = toTrimmedString(input.nama);
  if (!nama) throw new ValidationError('Nama produk wajib diisi.');
  if (nama.length > 120) {
    throw new ValidationError('Nama produk maksimal 120 karakter.');
  }

  const kategori = toTrimmedString(input.kategori);
  if (!CATEGORIES.includes(kategori)) {
    throw new ValidationError('Kategori produk tidak valid.');
  }

  const varian = toTrimmedString(input.varian);
  if (varian.length > 100) {
    throw new ValidationError('Varian produk maksimal 100 karakter.');
  }

  const yieldQty = parseNonNegativeNumber(
    input.yieldQty ?? input.yield_qty ?? 1,
    'Target hasil produksi harus lebih dari 0.'
  );
  if (yieldQty <= 0) {
    throw new ValidationError('Target hasil produksi harus lebih dari 0.');
  }

  const biayaKemasan = parseNonNegativeInteger(
    input.biayaKemasan ?? input.biaya_kemasan ?? 0,
    'Biaya kemasan harus bilangan bulat minimal 0.'
  );

  const tenagaKerjaPersen = parsePercentage(
    input.tenagaKerjaPersen ?? input.tenaga_kerja_persen,
    20,
    'Persentase tenaga kerja harus antara 0 dan 1000.'
  );

  const overheadPersen = parsePercentage(
    input.overheadPersen ?? input.overhead_persen,
    10,
    'Persentase overhead harus antara 0 dan 1000.'
  );

  const marginPersen = parsePercentage(
    input.marginPersen ?? input.margin_persen,
    0,
    'Persentase margin harus antara 0 dan 1000.'
  );

  const pembulatan = parsePositiveInteger(
    input.pembulatan ?? 1000,
    'Pembulatan harga harus bilangan bulat lebih dari 0.'
  );

  if (pembulatan > 100000) {
    throw new ValidationError('Pembulatan harga maksimal 100000.');
  }

  const modeBiaya = toTrimmedString(input.modeBiaya ?? input.mode_biaya ?? 'manual');
  if (!PRODUCT_COST_MODES.includes(modeBiaya)) {
    throw new ValidationError('Mode biaya produk tidak valid.');
  }

  const biayaBahanManual = parseNonNegativeInteger(
    input.biayaBahanManual ?? input.biaya_bahan_manual ?? 0,
    'Biaya bahan manual harus bilangan bulat minimal 0.'
  );

  const catatan = toTrimmedString(input.catatan);
  if (catatan.length > 500) {
    throw new ValidationError('Catatan produk maksimal 500 karakter.');
  }

  return {
    nama,
    kategori,
    varian,
    yieldQty,
    biayaKemasan,
    tenagaKerjaPersen,
    overheadPersen,
    marginPersen,
    pembulatan,
    modeBiaya,
    biayaBahanManual,
    catatan,
    materials: validateProductMaterials(input.materials),
  };
};

export const validateCalculatorPayload = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('Data kalkulasi tidak valid.');
  }

  let materialCost;

  if (Array.isArray(input.items)) {
    const items = input.items.map((item) => {
      if (!item || typeof item !== 'object') {
        throw new ValidationError('Baris daftar belanja tidak valid.');
      }

      return {
        qty: parseNonNegativeNumber(item.qty, 'Jumlah belanja harus minimal 0.'),
        hargaSatuan: parseNonNegativeNumber(
          item.hargaSatuan ?? item.harga_satuan,
          'Harga satuan harus minimal 0.'
        ),
      };
    });

    materialCost = sumShoppingList(items);
  } else {
    materialCost = parseNonNegativeNumber(
      input.materialCost ?? input.biayaBahan,
      'Total biaya bahan harus minimal 0.'
    );
  }

  const yieldQty = parseNonNegativeNumber(
    input.yieldQty ?? 1,
    'Target hasil produksi harus lebih dari 0.'
  );
  if (yieldQty <= 0) {
    throw new ValidationError('Target hasil produksi harus lebih dari 0.');
  }

  const packagingCost = parseNonNegativeNumber(
    input.packagingCost ?? 0,
    'Biaya kemasan harus minimal 0.'
  );

  const roundingStep = parsePositiveInteger(
    input.roundingStep ?? 1000,
    'Pembulatan harga harus bilangan bulat lebih dari 0.'
  );

  return {
    materialCost,
    yieldQty,
    packagingCost,
    laborPercent: parsePercentage(input.laborPercent, 20, 'Persentase tenaga kerja tidak valid.'),
    overheadPercent: parsePercentage(input.overheadPercent, 10, 'Persentase overhead tidak valid.'),
    marginPercent: parsePercentage(input.marginPercent, 0, 'Persentase margin tidak valid.'),
    roundingStep,
  };
};
