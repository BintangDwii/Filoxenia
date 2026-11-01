export const COLOR_OPTIONS = [
  { name: 'Pink Soft', hex: '#FFB6C1' },
  { name: 'Pink', hex: '#FF69B4' },
  { name: 'Ungu Soft', hex: '#D8BFD8' },
  { name: 'Ungu', hex: '#9333EA' },
  { name: 'Kuning', hex: '#FDE047' },
  { name: 'Putih', hex: '#FFFFFF' },
  { name: 'Biru', hex: '#60A5FA' },
  { name: 'Hijau', hex: '#4ADE80' },
  { name: 'Merah', hex: '#EF4444' },
  { name: 'Coklat', hex: '#A0522D' },
];

export const CATEGORIES = [
  { value: 'Headband', label: 'Headband Bunga/Buah' },
  { value: 'Gelang', label: 'Gelang Manik Tropical' },
  { value: 'Buket', label: 'Buket Bunga Handmade' },
];

export const BUKET_VARIANTS = [
  {
    value: 'Tanpa Cokelat',
    label: 'Tanpa Cokelat',
    defaultPrice: 15000,
  },
  {
    value: 'Pakai Cokelat',
    label: 'Dengan Cokelat',
    defaultPrice: 35000,
  },
];

export const ORDER_STATUSES = ['Pending', 'Proses', 'Selesai'];

export const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'Semua Tanggal' },
  { value: 'today', label: 'Hari Ini' },
  { value: '7days', label: '7 Hari Terakhir' },
  { value: '30days', label: '30 Hari Terakhir' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'highest', label: 'Total Tertinggi' },
  { value: 'lowest', label: 'Total Terendah' },
];

export const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  kategori: 'all',
  dateRange: 'all',
  sortBy: 'newest',
};

export const INITIAL_FORM = {
  nama: '',
  kategori: 'Headband',
  varian: '',
  tambahan: '-',
  harga: '',
  qty: 1,
  productId: '',
};

export const VIEW_ITEMS = [
  {
    value: 'orders',
    label: 'Pesanan',
    description: 'Pre-order & status',
    icon: 'ph-clipboard-text',
  },
  {
    value: 'inventory',
    label: 'Inventory',
    description: 'Bahan & stok',
    icon: 'ph-package',
  },
  {
    value: 'products',
    label: 'Produk & HPP',
    description: 'Resep, harga & kalkulator',
    icon: 'ph-calculator',
  },
];

export const MATERIAL_UNITS = [
  'pcs',
  'pack',
  'set',
  'meter',
  'cm',
  'gram',
  'kg',
  'ml',
  'liter',
  'lembar',
  'roll',
];

export const STOCK_TYPE_OPTIONS = [
  {
    value: 'masuk',
    label: 'Stok Masuk / Restock',
    description: 'Menambah stok karena pembelian bahan.',
  },
  {
    value: 'keluar',
    label: 'Stok Keluar',
    description: 'Mengurangi stok untuk pemakaian di luar pesanan.',
  },
  {
    value: 'penyesuaian',
    label: 'Sesuaikan Stok',
    description: 'Mengganti stok menjadi angka hasil hitung fisik.',
  },
];

export const PRODUCT_MODE_OPTIONS = [
  {
    value: 'manual',
    label: 'Manual',
    description: 'Total biaya bahan diisi langsung.',
  },
  {
    value: 'bom',
    label: 'Resep Bahan',
    description: 'HPP dihitung dari daftar bahan dan stok otomatis terpotong.',
  },
];
