const LEGACY_STORAGE_KEY = 'filoxenia-orders-v1';
const MIGRATION_KEY = 'filoxenia-db-migrated-v1';

const isValidOrder = (order) =>
  order &&
  typeof order === 'object' &&
  typeof order.id === 'string' &&
  typeof order.nama === 'string' &&
  typeof order.kategori === 'string' &&
  typeof order.status === 'string' &&
  Number.isFinite(Number(order.harga)) &&
  Number.isFinite(Number(order.qty)) &&
  Number.isFinite(Number(order.total));

export const readLegacyOrders = () => {
  try {
    const stored = window.localStorage.getItem(LEGACY_STORAGE_KEY);

    if (!stored) return [];

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidOrder);
  } catch {
    return [];
  }
};

export const hasMigratedLegacyOrders = () => {
  try {
    return window.localStorage.getItem(MIGRATION_KEY) === '1';
  } catch {
    return true;
  }
};

export const markLegacyOrdersMigrated = () => {
  try {
    window.localStorage.setItem(MIGRATION_KEY, '1');
  } catch {
    return;
  }
};
