import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import PageGuide from '../components/PageGuide.jsx';
import StatCard from '../components/StatCard.jsx';
import Toast from '../components/Toast.jsx';
import InventoryTable from '../components/inventory/InventoryTable.jsx';
import MaterialForm from '../components/inventory/MaterialForm.jsx';
import MovementHistory from '../components/inventory/MovementHistory.jsx';
import StockForm from '../components/inventory/StockForm.jsx';
import { useInventory } from '../hooks/useInventory.js';
import { useToast } from '../hooks/useToast.js';
import { formatNumber, formatRupiah } from '../utils/format.js';

const InventoryPage = () => {
  const {
    materials,
    movements,
    summary,
    isLoading,
    error,
    reload,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    adjustStock,
  } = useInventory();
  const { toast, showToast } = useToast();
  const [materialModal, setMaterialModal] = useState(null);
  const [stockTarget, setStockTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveMaterial = async (payload) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);

    try {
      if (materialModal?.material) {
        await updateMaterial(materialModal.material.id, payload);
        showToast('Data bahan berhasil diperbarui.');
      } else {
        await createMaterial(payload);
        showToast('Bahan baru berhasil ditambahkan.');
      }

      setMaterialModal(null);
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStock = async (payload) => {
    if (!stockTarget || isSubmitting) return false;
    setIsSubmitting(true);

    try {
      await adjustStock(stockTarget.id, payload);
      showToast(`Stok ${stockTarget.nama} berhasil diperbarui.`);
      setStockTarget(null);
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await deleteMaterial(deleteTarget.id);
      showToast('Bahan berhasil dihapus.');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <i className="ph ph-circle-notch animate-spin text-3xl text-[#44A6F1]"></i>
          <p className="text-sm font-medium text-gray-600">
            Memuat inventory bahan...
          </p>
        </div>
      </div>
    );
  }

  if (error && materials.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Toast toast={toast} />
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FCE9DF] text-[#D15B2D]">
            <i className="ph-fill ph-warning-circle text-2xl"></i>
          </span>
          <h1 className="mt-4 text-lg font-semibold text-[#2D2D2D]">
            Gagal memuat inventory
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
        icon="ph-package"
        title="Alur inventory yang mudah dipahami"
        description="Catat bahan sekali, lalu semua perubahan stok akan tersimpan sebagai riwayat. HPP produk memakai harga bahan terbaru."
        steps={[
          {
            title: 'Tambah bahan',
            description:
              'Isi nama, satuan, harga per satuan, dan stok minimum. Stok awal otomatis tercatat.',
          },
          {
            title: 'Restock / sesuaikan',
            description:
              'Saat membeli bahan, gunakan tombol Stok. Perbarui harga jika harga beli berubah.',
          },
          {
            title: 'Pakai di resep',
            description:
              'Buka Produk & HPP, pilih mode Resep Bahan, lalu masukkan bahan dan qty per batch.',
          },
          {
            title: 'Stok terpotong otomatis',
            description:
              'Stok berkurang ketika pesanan yang terhubung ke produk berubah menjadi Selesai.',
          },
        ]}
      />

      {error && materials.length > 0 && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-[#D15B2D]/30 bg-[#FCE9DF] px-4 py-3 text-sm text-[#D15B2D]">
          <span>{error}</span>
          <button
            type="button"
            onClick={reload}
            className="font-medium underline underline-offset-2"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon="ph-fill ph-package"
          tone="blue"
          label="Total Bahan"
          value={formatNumber(summary.totalMaterials, 0)}
          hint="jenis bahan tercatat"
        />
        <StatCard
          icon="ph-fill ph-coins"
          tone="green"
          label="Nilai Stok"
          value={formatRupiah(summary.totalStockValue)}
          hint="stok × harga per satuan"
        />
        <StatCard
          icon="ph-fill ph-warning"
          tone="orange"
          label="Perlu Restock"
          value={formatNumber(summary.lowStockCount, 0)}
          hint="stok menyentuh batas minimum"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#2D2D2D]">
              <i className="ph ph-list-dashes text-[#44A6F1]"></i>
              Daftar Bahan Baku
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Klik <strong>Stok</strong> untuk restock, sesuaikan, atau
              memperbarui harga bahan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMaterialModal({ material: null })}
            className="inline-flex items-center justify-center gap-2 rounded bg-[#44A6F1] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-opacity-90"
          >
            <i className="ph ph-plus-circle text-lg"></i>
            Tambah Bahan
          </button>
        </div>

        {materials.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="ph-package"
              title="Belum ada bahan baku"
              description="Mulai dengan menambahkan bahan yang biasa dibeli. Setelah itu bahan bisa dipakai di resep produk."
              action={
                <button
                  type="button"
                  onClick={() => setMaterialModal({ material: null })}
                  className="inline-flex items-center gap-2 rounded bg-[#44A6F1] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-opacity-90"
                >
                  <i className="ph ph-plus"></i>
                  Tambah Bahan Pertama
                </button>
              }
            />
          </div>
        ) : (
          <InventoryTable
            materials={materials}
            onAdjust={setStockTarget}
            onEdit={(material) => setMaterialModal({ material })}
            onDelete={setDeleteTarget}
          />
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#2D2D2D]">
              <i className="ph ph-clock-counter-clockwise text-[#7C4DC4]"></i>
              Riwayat Pergerakan Stok
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Menampilkan 30 pergerakan terbaru agar mudah dicek.
            </p>
          </div>
          <span className="text-xs text-gray-500">
            {formatNumber(movements.length, 0)} riwayat tersimpan
          </span>
        </div>

        <MovementHistory movements={movements} />
      </section>

      <Modal
        open={Boolean(materialModal)}
        title={
          materialModal?.material ? 'Edit Data Bahan' : 'Tambah Bahan Baru'
        }
        description={
          materialModal?.material
            ? 'Perbarui nama, satuan, batas minimum, atau harga bahan.'
            : 'Bahan ini akan bisa dipilih saat menyusun resep produk.'
        }
        size="lg"
        onClose={() => setMaterialModal(null)}
        isBusy={isSubmitting}
      >
        <MaterialForm
          material={materialModal?.material ?? null}
          onSubmit={handleSaveMaterial}
          onCancel={() => setMaterialModal(null)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <Modal
        open={Boolean(stockTarget)}
        title={stockTarget ? `Update Stok: ${stockTarget.nama}` : 'Update Stok'}
        description="Pilih jenis pergerakan agar riwayat stok tetap rapi dan bisa ditelusuri."
        size="md"
        onClose={() => setStockTarget(null)}
        isBusy={isSubmitting}
      >
        <StockForm
          material={stockTarget}
          onSubmit={handleStock}
          onCancel={() => setStockTarget(null)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus bahan?"
        description={
          deleteTarget
            ? `${deleteTarget.nama} akan dihapus. Bahan yang sudah dipakai di resep atau pesanan selesai tidak bisa dihapus.`
            : ''
        }
        confirmLabel="Hapus Bahan"
        isSubmitting={isSubmitting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default InventoryPage;
