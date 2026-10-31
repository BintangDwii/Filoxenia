import { formatQuantity, formatRupiah } from '../../utils/format.js';

const StockBadge = ({ material }) => {
  if (material.stok <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg var(--accent-light) px-2.5 py-1 text-[11px] font-semibold text var(--danger)">
        <i className="ph ph-x-circle"></i>
        Habis
      </span>
    );
  }

  if (material.stokRendah) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg var(--accent) px-2.5 py-1 text-[11px] font-semibold text var(--ink)">
        <i className="ph ph-warning"></i>
        Perlu restock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg var(--success-light) px-2.5 py-1 text-[11px] font-semibold text var(--success)">
      <i className="ph ph-check-circle"></i>
      Aman
    </span>
  );
};

const InventoryTable = ({ materials, onAdjust, onEdit, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[900px] border-collapse text-left">
      <thead className="border-b border var(--border) bg var(--surface) text var(--ink)">
        <tr>
          <th className="px-6 py-3 text-sm font-semibold text var(--ink)">Bahan</th>
          <th className="px-6 py-3 text-right text-sm font-semibold text var(--ink)">
            Stok
          </th>
          <th className="px-6 py-3 text-right text-sm font-semibold text var(--ink)">
            Minimum
          </th>
          <th className="px-6 py-3 text-right text-sm font-semibold text var(--ink)">
            Harga / Satuan
          </th>
          <th className="px-6 py-3 text-right text-sm font-semibold text var(--ink)">
            Nilai Stok
          </th>
          <th className="px-6 py-3 text-center text-sm font-semibold text var(--ink)">
            Status
          </th>
          <th className="px-6 py-3 text-center text-sm font-semibold text var(--ink)">
            Aksi
          </th>
        </tr>
      </thead>
      <tbody>
        {materials.map((material) => (
          <tr key={material.id} className="border-b border var(--border) hover:bg var(--surface-hover)">
            <td className="px-6 py-4">
              <p className="font-medium text var(--ink)">{material.nama}</p>
              <p className="mt-0.5 text-xs text var(--muted)">
                {material.catatan || 'Tanpa catatan'}
              </p>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right">
              <span className="font-semibold text var(--ink)">
                {formatQuantity(material.stok)}
              </span>{' '}
              <span className="text-xs text var(--muted)">{material.satuan}</span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text var(--muted)">
              {formatQuantity(material.stokMinimum)} {material.satuan}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text var(--ink)">
              {formatRupiah(material.hargaSatuan)}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text var(--ink)">
              {formatRupiah(material.nilaiStok)}
            </td>
            <td className="px-6 py-4 text-center">
              <StockBadge material={material} />
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => onAdjust(material)}
                  title={`Update stok ${material.nama}`}
                  className="inline-flex items-center gap-1.5 rounded bg var(--accent-light) px-2.5 py-1.5 text-xs font-medium text var(--ink) transition-colors hover:bg var(--brand-light)"
                >
                  <i className="ph ph-arrows-down-up"></i>
                  Stok
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(material)}
                  title={`Edit ${material.nama}`}
                  aria-label={`Edit bahan ${material.nama}`}
                  className="rounded p-2 bg var(--surface) text var(--accent) transition-colors hover:bg var(--brand-light)"
                >
                  <i className="ph ph-pencil-simple text-base"></i>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(material)}
                  title={`Hapus ${material.nama}`}
                  aria-label={`Hapus bahan ${material.nama}`}
                  className="rounded p-2 bg var(--surface) text var(--danger) transition-colors hover:bg var(--accent-light)"
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
);

export default InventoryTable;
