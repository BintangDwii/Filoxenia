import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';

const EMPTY_SUMMARY = {
  totalMaterials: 0,
  totalStockValue: 0,
  lowStockCount: 0,
};

export const useInventory = () => {
  const [materials, setMaterials] = useState([]);
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const [materialData, movementData] = await Promise.all([
        apiRequest('/inventory/materials'),
        apiRequest('/inventory/movements?limit=100'),
      ]);

      setMaterials(materialData.materials);
      setSummary(materialData.summary ?? EMPTY_SUMMARY);
      setMovements(movementData.movements);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createMaterial = useCallback(
    async (payload) => {
      const data = await apiRequest('/inventory/materials', {
        method: 'POST',
        body: payload,
      });
      await load({ silent: true });
      return data.material;
    },
    [load]
  );

  const updateMaterial = useCallback(
    async (id, payload) => {
      const data = await apiRequest(
        `/inventory/materials/${encodeURIComponent(id)}`,
        { method: 'PUT', body: payload }
      );
      await load({ silent: true });
      return data.material;
    },
    [load]
  );

  const deleteMaterial = useCallback(
    async (id) => {
      await apiRequest(`/inventory/materials/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      await load({ silent: true });
    },
    [load]
  );

  const adjustStock = useCallback(
    async (id, payload) => {
      const data = await apiRequest(
        `/inventory/materials/${encodeURIComponent(id)}/stock`,
        { method: 'POST', body: payload }
      );
      await load({ silent: true });
      return data.material;
    },
    [load]
  );

  return {
    materials,
    movements,
    summary,
    isLoading,
    error,
    reload: load,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    adjustStock,
  };
};
