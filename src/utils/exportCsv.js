import { getToday } from './format.js';
import { getBouquetVariantLabel } from './priceHint.js';

const CSV_HEADERS = [
  'ID Pesanan',
  'Nama Pelanggan',
  'Kategori',
  'Varian',
  'Varian Produk',
  'Harga Satuan',
  'Qty',
  'Total Harga',
  'Status',
  'Tanggal',
];

const getOrderRow = (order) => [
  order.id,
  order.nama,
  order.kategori,
  order.varian,
  order.kategori === 'Buket' ? getBouquetVariantLabel(order.tambahan) : order.tambahan,
  order.harga,
  order.qty,
  order.total,
  order.status,
  order.tanggal,
];

const escapeCsvValue = (value) => {
  const stringValue = String(value ?? '');
  const safeValue = /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;

  return `"${safeValue.replace(/"/g, '""')}"`;
};

const toCsvRow = (values) => values.map(escapeCsvValue).join(',');

export const downloadOrdersCsv = (orders, filename) => {
  const csvContent = [
    '\uFEFF' + toCsvRow(CSV_HEADERS),
    ...orders.map((order) => toCsvRow(getOrderRow(order))),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename ?? `Rekap_Preorder_Tropical_${getToday()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
