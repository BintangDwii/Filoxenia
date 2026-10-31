import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import OrderDetailDialog from '../components/OrderDetailDialog.jsx';
import OrderFilters from '../components/OrderFilters.jsx';
import OrderForm from '../components/OrderForm.jsx';
import OrderTable from '../components/OrderTable.jsx';
import PageGuide from '../components/PageGuide.jsx';
import SalesDashboard from '../components/SalesDashboard.jsx';
import Toast from '../components/Toast.jsx';
import { useOrderFilters } from '../hooks/useOrderFilters.js';
import { useOrders } from '../hooks/useOrders.js';
import { useProducts } from '../hooks/useProducts.js';
import { useToast } from '../hooks/useToast.js';
import { getOrderStats } from '../utils/analytics.js';
import { downloadOrdersCsv } from '../utils/exportCsv.js';

const OrdersPage = () => {
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
  const { products } = useProducts();
  const { filters, filteredOrders, setFilter, resetFilters, hasActiveFilters } =
    useOrderFilters(orders);
  const { toast, showToast } = useToast();
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [detailOrderId, setDetailOrderId] = useState(null);
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

      if (detailOrderId === orderToDelete.id) {
        setDetailOrderId(null);
      }

      setOrderToDelete(null);
      showToast(
        orderToDelete.status === 'Selesai'
          ? 'Pesanan dihapus. Stok bahan yang terpakai sudah dikembalikan.'
          : 'Pesanan berhasil dihapus.'
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    if (updatingStatusId) return;

    const previousOrder = orders.find((order) => order.id === id);
    setUpdatingStatusId(id);

    try {
      const updated = await toggleStatus(id);

      if (updated.status === 'Selesai') {
        showToast(
          updated.productId
            ? 'Pesanan selesai. Stok bahan sudah dipotong otomatis.'
            : 'Pesanan selesai. Produk ini tidak terhubung ke resep stok.'
        );
      } else if (previousOrder?.status === 'Selesai') {
        showToast('Status dikembalikan. Stok bahan pesanan sudah dipulihkan.');
      } else {
        showToast(`Status pesanan berubah menjadi ${updated.status}.`);
      }
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

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <i className="ph ph-circle-notch animate-spin text-3xl text-[#44A6F1]"></i>
          <p className="text-sm font-medium text-gray-600">
            Memuat data pesanan...
          </p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Toast toast={toast} />
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FCE9DF] text-[#D15B2D]">
            <i className="ph-fill ph-warning-circle text-2xl"></i>
          </span>
          <h1 className="mt-4 text-lg font-semibold text-[#2D2D2D]">
            Gagal memuat data
          </h1>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-5 inline-flex items-center gap-2 rounded bg-[#44A6F1] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-opacity-90"
          >
            <i className="ph ph-arrow-clockwise"></i>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Toast toast={toast} />

      <PageGuide
        icon="ph-clipboard-text"
        title="Alur pesanan yang mudah diikuti"
        description="Pesanan yang terhubung ke produk akan menyimpan snapshot HPP dan otomatis memotong stok bahan saat selesai."
        steps={[
          {
            title: 'Pilih produk',
            description:
              'Di form pesanan, pilih produk & resep agar harga jual rekomendasi terisi. Boleh juga hitung manual.',
          },
          {
            title: 'Simpan pesanan',
            description:
              'HPP saat itu ikut tersimpan sebagai snapshot, jadi harga tidak berubah walau bahan naik nanti.',
          },
          {
            title: 'Klik status',
            description:
              'Pending → Proses → Selesai. Saat Selesai, stok bahan pada resep dipotong dan bisa dilihat di detail.',
          },
          {
            title: 'Cek detail',
            description:
              'Tombol mata menampilkan rincian pelanggan, HPP, harga rekomendasi, dan bahan yang terpakai.',
          },
        ]}
      />

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
        products={products}
      />

      <OrderFilters
        filters={filters}
        onChange={setFilter}
        onReset={resetFilters}
        onExport={handleExport}
        hasActiveFilters={hasActiveFilters}
        resultCount={filteredOrders.length}
        totalCount={orders.length}
      />

      <OrderTable
        orders={filteredOrders}
        onToggleStatus={handleToggleStatus}
        onDetail={(order) => setDetailOrderId(order.id)}
        onEdit={setEditingOrder}
        onDelete={setOrderToDelete}
        hasActiveFilters={hasActiveFilters}
        editingOrderId={editingOrder?.id}
        updatingStatusId={updatingStatusId}
      />

      <ConfirmDialog
        open={Boolean(orderToDelete)}
        title="Hapus pesanan?"
        description={
          orderToDelete
            ? `Pesanan ${orderToDelete.id} milik ${orderToDelete.nama} akan dihapus permanen.${
                orderToDelete.status === 'Selesai'
                  ? ' Stok bahan yang sudah terpakai akan dikembalikan.'
                  : ''
              }`
            : ''
        }
        confirmLabel="Hapus Pesanan"
        isSubmitting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setOrderToDelete(null)}
      />

      <OrderDetailDialog
        orderId={detailOrderId}
        onClose={() => setDetailOrderId(null)}
      />
    </div>
  );
};

export default OrdersPage;
