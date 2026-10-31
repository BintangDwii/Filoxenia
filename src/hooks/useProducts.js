import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const data = await apiRequest('/products');
      setProducts(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getDetail = useCallback(async (id) => {
    const data = await apiRequest(`/products/${encodeURIComponent(id)}`);
    return data;
  }, []);

  const createProduct = useCallback(
    async (payload) => {
      const data = await apiRequest('/products', {
        method: 'POST',
        body: payload,
      });
      await load({ silent: true });
      return data;
    },
    [load]
  );

  const updateProduct = useCallback(
    async (id, payload) => {
      const data = await apiRequest(`/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: payload,
      });
      await load({ silent: true });
      return data;
    },
    [load]
  );

  const deleteProduct = useCallback(
    async (id) => {
      await apiRequest(`/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      await load({ silent: true });
    },
    [load]
  );

  return {
    products,
    isLoading,
    error,
    reload: load,
    getDetail,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
