import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api.js';
import { formatPercent, formatQuantity, formatRupiah } from '../../utils/format.js';
import PageGuide from '../PageGuide.jsx';
import StatCard from '../StatCard.jsx';

const BreakdownRow = ({ label, formula, value, emphasized = false }) => (
  <div
    className={`flex items-start justify-between gap-4 border-b border-gray-100 py-2.5 last:border-0 ${
      emphasized ? 'text-[#D15B2D]' : 'text-[#2D2D2D]'
    }`}
  >
    <div>
      <p className={`text-sm ${emphasized ? 'font-semibold' : 'font-medium'}`}>
        {label}
      </p>
      {formula && <p className="mt-0.5 text-[11px] text-gray-500">{formula}</p>}
    </div>
    <p className={`shrink-0 text-sm ${emphasized ? 'font-bold' : 'font-medium'}`}>
      {value}
    </p>
  </div>
);

const ProductDetail = ({ productId, onBack, onEdit, onDelete, onOpenCalculator }) => {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) {
      setDetail(null);
      setError(null);
      return undefined;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    apiRequest(`/products/${encodeURIComponent(productId)}`)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  if (isLoading && !detail) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <i className="ph ph-circle-notch animate-spin text-3xl text-[#44A6F1]"></i>
          <p className="text-sm font-medium text-gray-600">
            Memuat detail produk...
          </p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="rounded-xl border border-[#D15B2D]/30 bg-[#FCE9DF] p-6 text-sm text-[#D15B2D]">
        {error || 'Produk tidak ditemukan.'}
      </div>
    );
  }

  const { product, materials, pricing, maxProduction } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <i className="ph ph-arrow-left"></i>
            Kembali
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-[#2D2D2D]">
                <i className="ph ph-droplet text-[#44A6F1]"></i>
                {product.nama}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D5F5F9] px-3 py-1 text-xs font-semibold text-[#2B7DBA]">
                {product.kategori}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F1ECFA] px-3 py-1 text-xs font-semibold text-[#7C4DC4]">
                {product.modeBiaya === 'bom' ? 'Resep Bahan' : 'Manual'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Varian: {product.varian || '-'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenCalculator(product)}
            className="inline-flex items-center gap-2 rounded border border-[#7C4DC4] bg-white px-4 py-2 text-sm font-medium text-[#7C4DC4] transition-colors hover:bg-[#F1ECFA]"
          >
            <i className="ph ph-calculator"></i>
            Buka Kalkulator RAB
          </button>
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="inline-flex items-center gap-2 rounded border border-[#44A6F1] bg-white px-4 py-2 text-sm font-medium text-[#2B7DBA] transition-colors hover:bg-[#D5F5F9]"
          >
            <i className="ph ph-pencil-simple"></i>
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(product)}
            className="inline-flex items-center gap-2 rounded border border-[#D15B2D] bg-white px-4 py-2 text-sm font-medium text-[#D15B2D] transition-colors hover:bg-[#FCE9DF]"
          >
            <i className="ph ph-trash"></i>
            Hapus
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="ph-fill ph-calculator"
          tone="blue"
          label="Harga Jual Final"
          value={formatRupiah(pricing.sellingPriceFinal)}
          hint={`HJ: ${formatRupiah(pricing.modalPerUnit)} + margin`}
        />
        <StatCard
          icon="ph-fill ph-coins"
          tone="green"
          label="HPP per Unit"
          value={formatRupiah(pricing.hppPerUnit)}
          hint={`Total HPP: ${formatRupiah(pricing.hppTotal)}`}
        />
        <StatCard
          icon="ph-fill ph-shield-halved"
          tone="orange"
          label="BEP Bahan"
          value={formatPercent(pricing.bepPercent, 2)}
          hint="Dari biaya bahan ke harga jual"
        />
        <StatCard
          icon="ph-fill ph-package"
          tone="purple"
          label="Kapasitas Estimasi"
          value={
            maxProduction === null
              ? '-'
              : formatQuantity(maxProduction)
          }
          hint={
            maxProduction === null
              ? 'Produk manual tidak memakai stok'
              : 'Batch terbatas dari stok bahan'
          }
        />
      </div>

      <PageGuide
        icon="ph-droplet"
        title="Ringkasan cara menghitung produk"
        description={`Hasil akhir untuk ${product.nama} adalah Harga Jual Final ${formatRupiah(
          pricing.sellingPriceFinal
        )}. Hasil perhitungan ini otomatis berubah saat harga bahan berubah.`}
        steps={[
          {
            title: 'Biaya bahan',
            description:
              product.modeBiaya === 'manual'
                ? 'Dikirim langsung dari field manual.'
                : 'Dikutip dari daftar bahan resep pada qty per batch.',
          },
          {
            title: 'HPP',
            description:
              'Bahan + tenaga kerja (20%) + overhead (10%) lalu dibagi hasil per batch.',
          },
          {
            title: 'Modal & margin',
            description:
              'Kemasan ditambah, lalu margin dihitung dari modal per unit.',
          },
          {
            title: 'Harga final',
            description:
              'Dibulatkan ke atas sesuai pembulatan yang dipilih, lalu BEP dihitung.',
          },
        ]}
      />

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#2D2D2D]">
          <i className="ph ph-calculator text-[#7C4DC4]"></i>
          Rincian Biaya
        </h3>
        <div className="space-y-3">
          <BreakdownRow
            label="Biaya bahan"
            formula={
              product.modeBiaya === 'bom'
                ? 'Jumlah semua bahan pada qty per batch'
                : 'Field manual biaya bahan'
            }
            value={formatRupiah(pricing.materialCost)}
          />
          <BreakdownRow
            label={`Tenaga kerja ${formatNumber(pricing.laborPercent, 1)}%`}
            formula="Biaya bahan × persentase tenaga kerja"
            value={formatRupiah(pricing.laborCost)}
          />
          <BreakdownRow
            label={`Overhead ${formatNumber(pricing.overheadPercent, 1)}%`}
            formula="Biaya bahan × persentase overhead"
            value={formatRupiah(pricing.overheadCost)}
          />
          <BreakdownRow
            label="HPP Total"
            formula="Bahan + tenaga kerja + overhead"
            value={formatRupiah(pricing.hppTotal)}
            strong
          />
          <BreakdownRow
            label={`HPP per Unit (${formatNumber(pricing.yieldQty, 2)} hasil)`}
            formula="HPP total ÷ hasil per batch"
            value={formatRupiah(pricing.hppPerUnit)}
          />
          <BreakdownRow
            label="Kemasan per Unit"
            value={formatRupiah(pricing.packagingCost)}
          />
          <BreakdownRow
            label="Modal per Unit"
            formula="HPP/unit + kemasan"
            value={formatRupiah(pricing.modalPerUnit)}
            strong
          />
          <BreakdownRow
            label={`Nilai Margin (${formatPercent(pricing.marginPercent, 1)}%)`}
            formula="Modal per unit × margin"
            value={formatRupiah(pricing.marginAmount)}
          />
          <BreakdownRow
            label="Harga Sebelum Pembulatan"
            value={formatRupiah(pricing.sellingPriceRaw)}
          />
          <BreakdownRow
            label="Harga Jual Final"
            formula="Modal + margin, dibulatkan ke atas"
            value={formatRupiah(pricing.sellingPriceFinal)}
            emphasized
          />
          <BreakdownRow
            label="BEP Bahan"
            formula="Bahan per unit ÷ harga jual final"
            value={formatPercent(pricing.bepPercent, 2)}
          />
        </div>
      </section>

      {product.modeBiaya === 'bom' && materials.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#2D2D2D]">
              <i className="ph ph-list-dashes text-[#44A6F1]"></i>
              Daftar Bahan Resep
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Stok otomatis dipotong pada qty bahan per batch saat pesanan selesai.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                <tr>
                  <th className="px-6 py-3">Bahan</th>
                  <th className="px-6 py-3 text-right">Qty / Batch</th>
                  <th className="px-6 py-3 text-right">Harga / Satuan</th>
                  <th className="px-6 py-3 text-right">Subtotal</th>
                  <th className="px-6 py-3 text-right">Stok</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material.materialId} className="border-t border-gray-100">
                    <td className="px-6 py-3 font-medium text-[#2D2D2D]">
                      {material.nama}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {formatQuantity(material.qty)} {material.satuan}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-600">
                      {formatRupiah(material.hargaSatuan)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-[#2D2D2D]">
                      {formatRupiah(material.subtotal)}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-600">
                      {formatQuantity(material.stok)} {material.satuan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {product.modeBiaya === 'manual' && (
        <div className="rounded-lg border border-[#A6805E]/30 bg-[#F5EFE8] p-4 text-sm text-[#8A6544]">
          <div className="flex items-start gap-2">
            <i className="ph ph-info mt-0.5"></i>
            <span>
              Produk ini menggunakan biaya manual, sehingga stok tidak dipotong
              otomatis. Ubah mode ke <strong>Resep Bahan</strong> untuk alur
              stok otomatis.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
