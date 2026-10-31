import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { formatDate, formatPercent, formatQuantity, formatRupiah } from '../utils/format.js';
import Modal from './Modal.jsx';

const InfoItem = ({ label, value }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-[#2D2D2D]">{value}</p>
  </div>
);

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

const OrderDetailDialog = ({ orderId, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setDetail(null);
      setError(null);
      return undefined;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    apiRequest(`/orders/${encodeURIComponent(orderId)}`)
      .then((data) => {
        if (active) setDetail(data.order);
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
  }, [orderId]);

  const snapshot = detail?.snapshot;
  const materialsUsed = detail?.materialsUsed ?? [];
  const modal = snapshot?.modalPerUnit ?? 0;
  const actualDifference = snapshot
    ? Number(detail.harga) - snapshot.sellingPriceFinal
    : 0;

  return (
    <Modal
      open={Boolean(orderId)}
      title={detail ? `Detail Pesanan ${detail.id}` : 'Detail Pesanan'}
      description="Lihat rincian pelanggan, HPP saat pesanan dibuat, dan bahan yang sudah dipakai."
      size="xl"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          Tutup
        </button>
      }
    >
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <i className="ph ph-circle-notch animate-spin text-lg"></i>
          Memuat detail pesanan...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[#D15B2D]/30 bg-[#FCE9DF] p-4 text-sm text-[#D15B2D]">
          {error}
        </div>
      )}

      {detail && !isLoading && !error && (
        <div className="space-y-6">
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#2D2D2D]">
              <i className="ph ph-user text-[#44A6F1]"></i>
              Ringkasan Pesanan
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem label="Pelanggan" value={detail.nama} />
              <InfoItem
                label="Produk"
                value={`${detail.kategori} · ${detail.varian}`}
              />
              <InfoItem
                label="Varian / Tambahan"
                value={detail.kategori === 'Buket' ? detail.tambahan : '-'}
              />
              <InfoItem
                label="Tanggal"
                value={formatDate(detail.tanggal)}
              />
              <InfoItem
                label="Harga Satuan"
                value={formatRupiah(detail.harga)}
              />
              <InfoItem label="Qty" value={`${formatQuantity(detail.qty)} item`} />
              <InfoItem label="Total Bayar" value={formatRupiah(detail.total)} />
              <InfoItem label="Status" value={detail.status} />
            </div>
            {detail.productNama && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#7C4DC4]/20 bg-[#F1ECFA] p-3 text-sm text-[#6B3AB5]">
                <i className="ph ph-flask mt-0.5"></i>
                <span>
                  Terhubung ke produk <strong>{detail.productNama}</strong>. HPP
                  di bawah adalah snapshot saat pesanan disimpan.
                </span>
              </div>
            )}
          </section>

          {snapshot ? (
            <section>
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#2D2D2D]">
                  <i className="ph ph-calculator text-[#7C4DC4]"></i>
                  Snapshot HPP & Harga Rekomendasi
                </h3>
                <span className="text-xs text-gray-500">
                  HPP per unit {formatRupiah(snapshot.hppPerUnit)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    Modal per Unit
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#2D2D2D]">
                    {formatRupiah(modal)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    HPP/unit + kemasan
                  </p>
                </div>
                <div className="rounded-lg border border-[#44A6F1]/20 bg-[#F3FAFE] p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#2B7DBA]">
                    Harga Jual Rekomendasi
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#2B7DBA]">
                    {formatRupiah(snapshot.sellingPriceFinal)}
                  </p>
                  <p className="mt-1 text-xs text-[#2B7DBA]/80">
                    Margin {formatPercent(snapshot.marginPercent, 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#D15B2D]/20 bg-[#FCE9DF] p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#D15B2D]">
                    Selisih Harga Aktual
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#D15B2D]">
                    {actualDifference === 0
                      ? 'Sama'
                      : `${actualDifference > 0 ? '+' : ''}${formatRupiah(
                          actualDifference
                        )}`}
                  </p>
                  <p className="mt-1 text-xs text-[#D15B2D]/80">
                    Harga aktual pesanan vs rekomendasi
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-gray-200 p-4">
                <BreakdownRow
                  label="Biaya bahan"
                  formula="Dari resep atau biaya manual saat snapshot dibuat"
                  value={formatRupiah(snapshot.materialCost)}
                />
                <BreakdownRow
                  label="Tenaga kerja"
                  formula="Biaya bahan × 20%"
                  value={formatRupiah(snapshot.laborCost)}
                />
                <BreakdownRow
                  label="Overhead"
                  formula="Biaya bahan × 10%"
                  value={formatRupiah(snapshot.overheadCost)}
                />
                <BreakdownRow
                  label="HPP Total"
                  formula="Bahan + tenaga kerja + overhead"
                  value={formatRupiah(snapshot.hppTotal)}
                />
                <BreakdownRow
                  label="HPP per Unit"
                  value={formatRupiah(snapshot.hppPerUnit)}
                />
                <BreakdownRow
                  label="Kemasan per Unit"
                  value={formatRupiah(snapshot.packagingCost)}
                />
                <BreakdownRow
                  label="Modal per Unit"
                  formula="HPP/unit + kemasan"
                  value={formatRupiah(snapshot.modalPerUnit)}
                />
                <BreakdownRow
                  label="Nilai Margin"
                  formula={`${formatPercent(snapshot.marginPercent, 0)} dari modal/unit`}
                  value={formatRupiah(snapshot.marginAmount)}
                />
                <BreakdownRow
                  label="Harga Sebelum Pembulatan"
                  value={formatRupiah(snapshot.sellingPriceRaw)}
                />
                <BreakdownRow
                  label="Harga Jual Final"
                  formula="Dibulatkan ke atas ke ribuan terdekat"
                  value={formatRupiah(snapshot.sellingPriceFinal)}
                  emphasized
                />
                <BreakdownRow
                  label="BEP Bahan"
                  formula="Bahan per unit ÷ harga jual final"
                  value={formatPercent(snapshot.bepRatio * 100, 2)}
                />
              </div>
            </section>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-[#A6805E]/30 bg-[#F5EFE8] p-4 text-sm text-[#8A6544]">
              <i className="ph ph-info mt-0.5"></i>
              <span>
                Pesanan ini belum terhubung ke produk/resep, jadi belum punya
                snapshot HPP. Hubungkan produk lewat tombol Edit jika ingin
                menghitung HPP otomatis.
              </span>
            </div>
          )}

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#2D2D2D]">
              <i className="ph ph-package text-[#2F8A4B]"></i>
              Bahan yang Dipakai
            </h3>

            {materialsUsed.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Bahan</th>
                      <th className="px-4 py-3 text-right">Qty Terpakai</th>
                      <th className="px-4 py-3 text-right">Harga Satuan</th>
                      <th className="px-4 py-3 text-right">Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialsUsed.map((item) => (
                      <tr key={item.materialId} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium text-[#2D2D2D]">
                          {item.nama}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatQuantity(item.qty)} {item.satuan}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatRupiah(item.hargaSatuan)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#2D2D2D]">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                Belum ada bahan yang dipotong. Stok baru dipotong otomatis saat
                status pesanan menjadi <strong>Selesai</strong> dan produk memakai
                mode resep bahan.
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
};

export default OrderDetailDialog;
