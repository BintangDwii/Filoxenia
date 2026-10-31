import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import PageGuide from '../components/PageGuide.jsx';
import ProductDetail from '../components/products/ProductDetail.jsx';
import ProductForm from '../components/products/ProductForm.jsx';
import PricingCalculator from '../components/products/PricingCalculator.jsx';
import StatCard from '../components/StatCard.jsx';
import Toast from '../components/Toast.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useInventory } from '../hooks/useInventory.js';
import { useProducts } from '../hooks/useProducts.js';
import { useToast } from '../hooks/useToast.js';
import { formatNumber, formatPercent, formatRupiah } from '../utils/format.js';

const ProductsPage = () => {
  const {
    products,
    isLoading,
    error,
    reload,
    getDetail,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();
  const {
    materials,
    isLoading: isMaterialsLoading,
    reload: reloadMaterials,
    createMaterial,
  } = useInventory();
  const { toast, showToast } = useToast();
  const [detailProductId, setDetailProductId] = useState(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductSubmit = async (product, payload) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);

    try {
      if (product) {
        await updateProduct(product.id, payload);
        showToast('Produk berhasil diperbarui.');
      } else {
        await createProduct(payload);
        showToast('Produk baru berhasil disimpan.');
      }

      setEditingProduct(null);
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCalculator = async (payload) => {
    const saved = await createProduct(payload);
    if (saved) {
      setCalculatorOpen(false);
      showToast('Produk baru berhasil disimpan.');
    }
    return Boolean(saved);
  };

  const handleDelete = async (product) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await deleteProduct(product.id);
      setDeleteTarget(null);
      setDetailProductId(null);
      showToast('Produk berhasil dihapus.');
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
            Memuat produk & HPP...
          </p>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Toast toast={toast} />
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FCE9DF] text-[#D15B2D]">
            <i className="ph-fill ph-warning-circle text-2xl"></i>
          </span>
          <h1 className="mt-4 text-lg font-semibold text-[#2D2D2D]">
            Gagal memuat produk
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

  if (calculatorOpen) {
    return (
      <div className="space-y-8">
        <Toast toast={toast} />

        <PricingCalculator
          products={products}
          materials={materials}
          onSubmit={handleSaveCalculator}
          onClose={() => setCalculatorOpen(false)}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  const totalProducts = products.length;
  const bomProducts = products.filter(
    (product) => product.modeBiaya === 'bom'
  ).length;
  const averageSellingPrice = products.length
    ? products.reduce(
        (total, product) => total + product.pricing.sellingPriceFinal,
        0
      ) / products.length
    : 0;

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleOpenCalculator = (product) => {
    setDetailProductId(null);
    setCalculatorOpen(true);
  };

  return (
    <div className="space-y-8">
      <Toast toast={toast} />

      <PageGuide
        icon="ph-calculator"
        title="Alur membuat produk & harga jual"
        description="Gunakan mode manual atau resep bahan, maka HPP/HJ/BEP dihitung otomatis. Saat harga bahan berubah, semua produk berbasis resep ikut diperbarui."
        steps={[
          {
            title: 'Tambah produk',
            description:
              'Isi identitas, hasil per batch, parameter tenaga kerja/overhead, dan mode biaya.',
          },
          {
            title: 'Isi bahan',
            description:
              'Mode Manual mengisi total biaya bahan. Mode Resep mengisi qty per batch.',
          },
          {
            title: 'Lihat HPP & HJ',
            description:
              'Hasil perhitungan menunjukkan HPP/unit, modal/unit, HJ final, margin, dan BEP.',
          },
          {
            title: 'Simpan & pakai',
            description:
              'Simpan produk lalu pilih produk di form pesanan untuk otomatis mencatat snapshot HPP.',
          },
        ]}
      />

      {error && products.length > 0 && (
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
          icon="ph-fill ph-droplet"
          tone="blue"
          label="Total Produk"
          value={formatNumber(totalProducts, 0)}
          hint="terdaftar"
        />
        <StatCard
          icon="ph-fill ph-list-dashes"
          tone="purple"
          label="Produk Resep Bahan"
          value={formatNumber(bomProducts, 0)}
          hint="stok otomatis dipotong saat Selesai"
        />
        <StatCard
          icon="ph-fill ph-calculator"
          tone="orange"
          label="Rata-rata Harga Jual"
          value={formatRupiah(averageSellingPrice)}
          hint="dari mode manual atau resep"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#2D2D2D]">
              <i className="ph ph-droplet text-[#7C4DC4]"></i>
              Katalog Produk
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Setiap produk menyimpan snapshot HPP untuk pesanan baru.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCalculatorOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded border border-[#7C4DC4] bg-white px-4 py-2.5 text-sm font-medium text-[#7C4DC4] transition-colors hover:bg-[#F1ECFA]"
            >
              <i className="ph ph-calculator text-lg"></i>
              Buka Kalkulator RAB
            </button>
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="inline-flex items-center justify-center gap-2 rounded bg-[#2F8A4B] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-opacity-90"
            >
              <i className="ph ph-plus-circle text-lg"></i>
              Tambah Produk
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="ph-droplet"
              title="Belum ada produk"
              description="Buat produk pertama atau buka kalkulator untuk menghitung dari daftar belanja baru."
              action={
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="inline-flex items-center gap-2 rounded bg-[#2F8A4B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-opacity-90"
                >
                  <i className="ph ph-plus"></i>
                  Buat Produk Pertama
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                <tr>
                  <th className="px-6 py-3">Produk</th>
                  <th className="px-6 py-3">Kategori</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3 text-right">HPP / Unit</th>
                  <th className="px-6 py-3 text-right">Harga Jual</th>
                  <th className="px-6 py-3 text-right">Margin</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <i className="ph ph-droplet text-[#7C4DC4]"></i>
                        <div>
                          <p className="font-semibold text-[#2D2D2D]">
                            {product.nama}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {product.materials?.length ?? 0} bahan resep
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{product.kategori}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          product.modeBiaya === 'bom'
                            ? 'bg-[#E8F7EC] text-[#2F8A4B]'
                            : 'bg-[#F1ECFA] text-[#7C4DC4]'
                        }`}
                      >
                        {product.modeBiaya}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {formatRupiah(product.pricing.hppPerUnit)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[#D15B2D]">
                      {formatRupiah(product.pricing.sellingPriceFinal)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {formatPercent(product.pricing.marginPercent, 1)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailProductId(product.id)}
                          title={`Lihat detail ${product.nama}`}
                          className="rounded p-2 text-[#44A6F1] transition-colors hover:bg-[#D5F5F9]"
                        >
                          <i className="ph ph-eye text-base"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          title={`Edit ${product.nama}`}
                          className="rounded p-2 text-[#44A6F1] transition-colors hover:bg-[#D5F5F9]"
                        >
                          <i className="ph ph-pencil-simple text-base"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          title={`Hapus ${product.nama}`}
                          className="rounded p-2 text-[#D15B2D] transition-colors hover:bg-[#FCE9DF]"
                        >
                          <i className="ph ph-trash text-base"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(editingProduct)}
        title={
          editingProduct ? `Edit Produk: ${editingProduct.nama}` : 'Tambah Produk Baru'
        }
        description={
          editingProduct
            ? 'Ubah identitas, parameter harga, atau daftar bahan resep.'
            : 'Buat produk baru dari manual biaya bahan atau daftar resep.'
        }
        size="xl"
        onClose={() => setEditingProduct(null)}
        isBusy={isSubmitting}
      >
        {isMaterialsLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <i className="ph ph-circle-notch animate-spin"></i>
            Memuat data bahan...
          </div>
        ) : (
          <ProductForm
            product={editingProduct}
            materials={materials}
            onSubmit={handleProductSubmit}
            onCancel={() => setEditingProduct(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Hapus produk?"
        description={
          deleteTarget
            ? `${deleteTarget.nama} akan dihapus. Pesanan lama tetap aman karena snapshot HPP disimpan.`
            : ''
        }
        size="md"
        onClose={() => setDeleteTarget(null)}
        isSubmitting={isSubmitting}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="flex items-center gap-2 rounded bg-[#D15B2D] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting && <i className="ph ph-circle-notch animate-spin"></i>}
              Hapus Produk
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500">
          Produk dipakai untuk memakai mode resep bahan. Harga pesanan yang sudah
          ada tetap dipertahankan.
        </p>
      </Modal>
    </div>
  );
};

export default ProductsPage;