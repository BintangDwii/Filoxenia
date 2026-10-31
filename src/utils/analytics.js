import { CATEGORIES, ORDER_STATUSES } from '../data/constants.js';

const createCategoryStats = () => {
  const map = new Map();

  CATEGORIES.forEach((category) => {
    map.set(category.value, {
      value: category.value,
      label: category.label,
      totalOrders: 0,
      items: 0,
      completedOrders: 0,
      completedRevenue: 0,
    });
  });

  return map;
};

const createStatusStats = () => {
  const map = new Map();

  ORDER_STATUSES.forEach((status) => {
    map.set(status, {
      status,
      count: 0,
      totalValue: 0,
    });
  });

  return map;
};

export const getOrderStats = (orders) => {
  const statusMap = createStatusStats();
  const categoryMap = createCategoryStats();

  const stats = orders.reduce(
    (result, order) => {
      const total = Number(order.total) || 0;
      const qty = Number(order.qty) || 0;

      result.totalOrders += 1;
      result.totalItems += qty;
      result.totalRevenue += total;

      if (order.status === 'Selesai') {
        result.completedOrders += 1;
        result.completedRevenue += total;
        result.soldItems += qty;
      } else {
        result.activeOrders += 1;
      }

      const status = statusMap.get(order.status);
      if (status) {
        status.count += 1;
        status.totalValue += total;
      }

      if (!categoryMap.has(order.kategori)) {
        categoryMap.set(order.kategori, {
          value: order.kategori,
          label: order.kategori,
          totalOrders: 0,
          items: 0,
          completedOrders: 0,
          completedRevenue: 0,
        });
      }

      const category = categoryMap.get(order.kategori);
      category.totalOrders += 1;
      category.items += qty;

      if (order.status === 'Selesai') {
        category.completedOrders += 1;
        category.completedRevenue += total;
      }

      return result;
    },
    {
      totalOrders: 0,
      totalItems: 0,
      totalRevenue: 0,
      completedOrders: 0,
      completedRevenue: 0,
      activeOrders: 0,
      soldItems: 0,
      averageOrderValue: 0,
      byCategory: [],
      byStatus: [],
    }
  );

  stats.averageOrderValue =
    stats.completedOrders > 0 ? stats.completedRevenue / stats.completedOrders : 0;
  stats.byCategory = Array.from(categoryMap.values());
  stats.byStatus = Array.from(statusMap.values());

  return stats;
};
