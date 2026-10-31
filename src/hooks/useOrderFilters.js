import { useMemo, useState } from 'react';
import { DEFAULT_FILTERS } from '../data/constants.js';
import { getBouquetVariantLabel } from '../utils/priceHint.js';

const getDateRangeStart = (dateRange) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (dateRange === '7days') {
    start.setDate(start.getDate() - 6);
  }

  if (dateRange === '30days') {
    start.setDate(start.getDate() - 29);
  }

  return start;
};

const matchesDateRange = (order, dateRange) => {
  if (dateRange === 'all') return true;

  const orderDate = new Date(`${order.tanggal}T00:00:00`);
  if (Number.isNaN(orderDate.getTime())) return false;

  const start = getDateRangeStart(dateRange);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return orderDate >= start && orderDate <= end;
};

const matchesSearch = (order, keyword) => {
  if (!keyword) return true;

  const variantLabel =
    order.kategori === 'Buket' ? getBouquetVariantLabel(order.tambahan) : order.tambahan;

  return [order.id, order.nama, order.kategori, order.varian, order.tambahan, variantLabel].some(
    (value) => String(value ?? '').toLowerCase().includes(keyword)
  );
};

const sortOrders = (orders, sortBy) => {
  const sorted = [...orders];

  switch (sortBy) {
    case 'oldest':
      return sorted.sort(
        (a, b) => a.tanggal.localeCompare(b.tanggal) || a.id.localeCompare(b.id)
      );
    case 'highest':
      return sorted.sort((a, b) => b.total - a.total);
    case 'lowest':
      return sorted.sort((a, b) => a.total - b.total);
    case 'newest':
    default:
      return sorted.sort(
        (a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id)
      );
  }
};

export const useOrderFilters = (orders) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const setFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const filteredOrders = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();

    const result = orders.filter((order) => {
      const statusMatches = filters.status === 'all' || order.status === filters.status;
      const categoryMatches =
        filters.kategori === 'all' || order.kategori === filters.kategori;

      return (
        matchesSearch(order, keyword) &&
        statusMatches &&
        categoryMatches &&
        matchesDateRange(order, filters.dateRange)
      );
    });

    return sortOrders(result, filters.sortBy);
  }, [orders, filters]);

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.kategori !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.sortBy !== 'newest';

  return { filters, filteredOrders, setFilter, resetFilters, hasActiveFilters };
};
