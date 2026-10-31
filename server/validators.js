import { BUKET_VARIANTS, CATEGORIES, ORDER_STATUSES } from './constants.js';

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
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

  const order = {
    nama,
    kategori,
    varian,
    tambahan,
    harga,
    qty,
    total: harga * qty,
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
