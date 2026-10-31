import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Header from './components/Header.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import LoginPage from './components/LoginPage.jsx';
import OrderFilters from './components/OrderFilters.jsx';
import OrderForm from './components/OrderForm.jsx';
import OrderTable from './components/OrderTable.jsx';
import SalesDashboard from './components/SalesDashboard.jsx';
import Toast from './components/Toast.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { useOrderFilters } from './hooks/useOrderFilters.js';
import { useOrders } from './hooks/useOrders.js';
import { useToast } from './hooks/useToast.js';
import { getOrderStats } from './utils/analytics.js';
import { downloadOrdersCsv } from './utils/exportCsv.js';

const InventoryApp = () => {
  const { admin, logout } = useAuth();
  const {
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
  } = useOrders();
  const { filters, filteredOrders, setFilter, resetFilters, hasActiveFilters } =
    useOrderFilters(orders);
  const { toast, showToast } = useToast();
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const stats = useMemo(() => getOrderStats(filteredOrders), [filteredOrders]);

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = setTimeout(clearNotice, 6000);
    return () => clearTimeout(timeout);
  }, [notice, clearNotice]);

  const handleSubmitOrder = async (formData) => {
    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, formData);
        setEditingOrder(null);
        showToast('Pesanan berhasil diperbarui! 🌺');
        return true;
      }

      await addOrder(formData);
      showToast('Pesanan berhasil ditambahkan! 🌺');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete || isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteOrder(orderToDelete.id);

      if (editingOrder?.id === orderToDelete.id) {
        setEditingOrder(null);
      }

      setOrderToDelete(null);
      showToast('Pesanan berhasil dihapus.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    if (updatingStatusId) return;

    setUpdatingStatusId(id);

    try {
      await toggleStatus(id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleExport = () => {
    if (filteredOrders.length === 0) {
      showToast('Tidak ada data untuk diekspor.', 'info');
      return;
    }

    downloadOrdersCsv(filteredOrders);
    showToast(
      hasActiveFilters
        ? 'CSV hasil filter berhasil diunduh! 🌊'
        : 'File CSV berhasil diunduh! 🌊'
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      return;
    }

  };

  if (isLoading) {
    return <LoadingScreen message="Memuat data pesanan..." />;
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
        <Toast toast={toast} />
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FCE9DF] text-[#D15B2D]">
            <i className="ph-fill ph-warning-circle text-2xl"></i>
          </span>
          <h1 className="mt-4 text-lg font-semibold text-[#2D2D2D]">Gagal memuat data</h1>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={reload}
              className="flex items-center gap-2 rounded bg-[#44A6F1] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-opacity-90"
            >
              <i className="ph ph-arrow-clockwise"></i>
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <i className="ph ph-sign-out"></i>
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Toast toast={toast} />

      <div className="max-w-7xl mx-auto space-y-8">
        <Header onExport={handleExport} admin={admin} onLogout={handleLogout} />

        {notice && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-[#44A6F1]/30 bg-[#D5F5F9] px-4 py-3 text-sm text-[#2B7DBA]">
            <div className="flex items-start gap-2">
              <i className="ph ph-database mt-0.5 text-base"></i>
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={clearNotice}
              aria-label="Tutup notifikasi"
              className="rounded p-1 transition-colors hover:bg-white/60"
            >
              <i className="ph ph-x"></i>
            </button>
          </div>
        )}

        <SalesDashboard
          stats={stats}
          hasActiveFilters={hasActiveFilters}
          resultCount={filteredOrders.length}
          totalCount={orders.length}
        />

        <OrderForm
          onSubmit={handleSubmitOrder}
          editingOrder={editingOrder}
          onCancelEdit={() => setEditingOrder(null)}
        />

        <OrderFilters
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
          resultCount={filteredOrders.length}
          totalCount={orders.length}
        />

        <OrderTable
          orders={filteredOrders}
          onToggleStatus={handleToggleStatus}
          onEdit={setEditingOrder}
          onDelete={setOrderToDelete}
          hasActiveFilters={hasActiveFilters}
          editingOrderId={editingOrder?.id}
          updatingStatusId={updatingStatusId}
        />
      </div>

      <ConfirmDialog
        open={Boolean(orderToDelete)}
        title="Hapus pesanan?"
        description={
          orderToDelete
            ? `Pesanan ${orderToDelete.id} milik ${orderToDelete.nama} akan dihapus permanen.`
            : ''
        }
        confirmLabel="Hapus Pesanan"
        isSubmitting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setOrderToDelete(null)}
      />
    </div>
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
