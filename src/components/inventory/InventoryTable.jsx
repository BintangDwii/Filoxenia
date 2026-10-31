import { formatQuantity, formatRupiah } from '../../utils/format.js';

const StockBadge = ({ material }) => {
  if (material.stok <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#FCE9DF] px-2.5 py-1 text-[11px] font-semibold text-[#D15B2D]">
        <i className="ph ph-x-circle"></i>
        Habis
      </span>
    );
  }

  if (material.stokRendah) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#F5EFE8] px-2.5 py-1 text-[11px] font-semibold text-[#A6805E]">
        <i className="ph ph-warning"></i>
        Perlu restock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F7EC] px-2.5 py-1 text-[11px] font-semibold text-[#2F8A4B]">
      <i className="ph ph-check-circle"></i>
      Aman
    </span>
  );
};

const InventoryTable = ({ materials, onAdjust, onEdit, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[900px] border-collapse text-left">
      <thead className="border-b border-gray-200 bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-sm font-semibold text-gray-600">Bahan</th>
          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
            Stok
          </th>
          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
            Minimum
          </th>
          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
            Harga / Satuan
          </th>
          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
            Nilai Stok
          </th>
          <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
            Status
          </th>
          <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
            Aksi
          </th>
        </tr>
      </thead>
      <tbody>
        {materials.map((material) => (
          <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-6 py-4">
              <p className="font-medium text-[#2D2D2D]">{material.nama}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {material.catatan || 'Tanpa catatan'}
              </p>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right">
              <span className="font-semibold text-[#2D2D2D]">
                {formatQuantity(material.stok)}
              </span>{' '}
              <span className="text-xs text-gray-500">{material.satuan}</span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
              {formatQuantity(material.stokMinimum)} {material.satuan}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-600">
              {formatRupiah(material.hargaSatuan)}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-[#2D2D2D]">
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
                  className="inline-flex items-center gap-1.5 rounded bg-[#E8F7EC] px-2.5 py-1.5 text-xs font-medium text-[#2F8A4B] transition-colors hover:bg-[#d7f0df]"
                >
                  <i className="ph ph-arrows-down-up"></i>
                  Stok
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(material)}
                  title={`Edit ${material.nama}`}
                  aria-label={`Edit bahan ${material.nama}`}
                  className="rounded p-2 text-[#44A6F1] transition-colors hover:bg-[#D5F5F9]"
                >
                  <i className="ph ph-pencil-simple text-base"></i>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(material)}
                  title={`Hapus ${material.nama}`}
                  aria-label={`Hapus bahan ${material.nama}`}
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
);

export default InventoryTable;
