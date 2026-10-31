import { useCallback, useEffect, useState } from 'react';
import AppShell from './components/layout/AppShell.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import LoginPage from './components/LoginPage.jsx';
import { VIEW_ITEMS } from './data/constants.js';
import { useAuth } from './context/AuthContext.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';

const VIEW_VALUES = VIEW_ITEMS.map((item) => item.value);

const getViewFromHash = () => {
  const value = window.location.hash.replace(/^#\/?/, '');
  return VIEW_VALUES.includes(value) ? value : 'orders';
};

const InventoryApp = () => {
  const { admin, logout } = useAuth();
  const [view, setView] = useState(getViewFromHash);

  useEffect(() => {
    const handleHashChange = () => setView(getViewFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = useCallback((nextView) => {
    if (!VIEW_VALUES.includes(nextView)) return;
    window.location.hash = `/${nextView}`;
    setView(nextView);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const currentItem = VIEW_ITEMS.find((item) => item.value === view);

  return (
    <AppShell
      admin={admin}
      onLogout={handleLogout}
      currentView={view}
      onNavigate={handleNavigate}
      pageTitle={currentItem?.label}
      pageSubtitle={currentItem?.description}
    >
      <div className="animate-fade-in">
        {view === 'orders' && <OrdersPage />}
        {view === 'inventory' && <InventoryPage />}
        {view === 'products' && <ProductsPage />}
      </div>
    </AppShell>
  );
};

const App = () => {
  const { admin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Memeriksa sesi login..." />;
  }

  if (!admin) {
    return <LoginPage />;
  }

  return <InventoryApp />;
};

export default App;
