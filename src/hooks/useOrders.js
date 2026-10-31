import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import {
  hasMigratedLegacyOrders,
  markLegacyOrdersMigrated,
  readLegacyOrders,
} from '../utils/storage.js';

const migrateLegacyOrders = async () => {
  if (hasMigratedLegacyOrders()) {
    return { imported: 0, error: null };
  }

  const legacyOrders = readLegacyOrders();

  if (legacyOrders.length === 0) {
    markLegacyOrdersMigrated();
    return { imported: 0, error: null };
  }

  try {
    const result = await apiRequest('/orders/import', {
      method: 'POST',
      body: { orders: legacyOrders },
    });

    markLegacyOrdersMigrated();

    return { imported: result.imported || 0, error: null };
  } catch (error) {
    return { imported: 0, error: error.message };
  }
};

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiRequest('/orders');
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      setIsLoading(true);
      const migration = await migrateLegacyOrders();

      try {
        const data = await apiRequest('/orders');
        if (!active) return;

        setOrders(data.orders);

        if (migration.error) {
          setNotice(`Migrasi data lokal gagal: ${migration.error}`);
        } else if (migration.imported > 0) {
          setNotice(
            `${migration.imported} pesanan lokal berhasil dimigrasikan ke database.`
          );
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    init();

    return () => {
      active = false;
    };
  }, []);

  const addOrder = useCallback(async (orderData) => {
    const data = await apiRequest('/orders', {
      method: 'POST',
      body: orderData,
    });

    setOrders((current) => [data.order, ...current]);
    return data.order;
  }, []);

  const updateOrder = useCallback(async (id, orderData) => {
    const data = await apiRequest(`/orders/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: orderData,
    });

    setOrders((current) =>
      current.map((order) => (order.id === id ? data.order : order))
    );

    return data.order;
  }, []);

  const deleteOrder = useCallback(async (id) => {
    await apiRequest(`/orders/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    setOrders((current) => current.filter((order) => order.id !== id));
  }, []);

  const toggleStatus = useCallback(async (id) => {
    const data = await apiRequest(`/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
    });

    setOrders((current) =>
      current.map((order) => (order.id === id ? data.order : order))
    );

    return data.order;
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  return {
    orders,
    isLoading,
    error,
    notice,
    clearNotice,
    reload,
    addOrder,
    updateOrder,
    deleteOrder,
    toggleStatus,
  };
};
