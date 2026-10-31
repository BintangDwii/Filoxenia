import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, apiRequest } from '../lib/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearSession = useCallback(() => {
    setAdmin(null);
    setError(null);
  }, []);

  const login = useCallback(async ({ username, password }) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username, password },
    });

    setAdmin(data.admin);
    setError(null);

    return data.admin;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    let active = true;

    apiRequest('/auth/me')
      .then((data) => {
        if (active) setAdmin(data.admin);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) return;
        setError(err.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();

    window.addEventListener('filoxenia:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('filoxenia:unauthorized', handleUnauthorized);
    };
  }, [clearSession]);

  const value = useMemo(
    () => ({ admin, isLoading, error, login, logout, clearSession }),
    [admin, isLoading, error, login, logout, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  }

  return context;
};
