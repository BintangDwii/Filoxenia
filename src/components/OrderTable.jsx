import { formatDate, formatRupiah } from '../utils/format.js';
import { getBouquetVariantLabel } from '../utils/priceHint.js';
import StatusBadge from './StatusBadge.jsx';

const getVariantLabel = (order) =>
  order.kategori === 'Buket' ? getBouquetVariantLabel(order.tambahan) : order.tambahan;

const OrderTable = ({
  orders,
  onToggleStatus,
  onDetail,
  onEdit,
  onDelete,
  hasActiveFilters,
  editingOrderId,
  updatingStatusId,
}) => (
  <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="flex flex-col gap-2 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-semibold flex items-center gap-2 text-[#2D2D2D]">
        <i className="ph ph-list-dashes text-[#44A6F1]"></i> Daftar Pre-order
      </h2>
      <span className="self-start text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
        Klik status untuk mengubah
      </span>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="py-3 px-6 text-sm font-semibold text-gray-600">Tanggal / ID</th>
            <th className="py-3 px-6 text-sm font-semibold text-gray-600">Pelanggan</th>
            <th className="py-3 px-6 text-sm font-semibold text-gray-600">Produk</th>
            <th className="py-3 px-6 text-sm font-semibold text-gray-600">Detail</th>
            <th className="py-3 px-6 text-sm font-semibold text-gray-600 text-right">Harga x Qty</th>
            <th className="py-3 px-6 text-sm font-semibold text-gray-600 text-right">Total</th>
            <th className="py-3 px-6 text-sm font-semibold text-gray-600 text-center">Status</th>
            <th className="py-3 px-6 text-sm font-semibold text-gray-600 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className={`border-b border-gray-100 transition-colors ${
                editingOrderId === order.id
                  ? 'bg-[#D5F5F9]/50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <td className="py-4 px-6 whitespace-nowrap">
                <p className="text-sm text-gray-600">{formatDate(order.tanggal)}</p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-400">{order.id}</p>
              </td>
              <td className="py-4 px-6 font-medium text-[#2D2D2D]">{order.nama}</td>
              <td className="py-4 px-6">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#2D2D2D]">{order.kategori}</span>
                  {getVariantLabel(order) !== '-' && (
                    <span className="text-xs text-gray-500 mt-0.5">
                      {getVariantLabel(order)}
                    </span>
                  )}
                  {order.productNama && (
                    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-[#F1ECFA] px-2 py-0.5 text-[10px] font-medium text-[#7C4DC4]">
                      <i className="ph ph-flask"></i>
                      {order.productNama}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4 px-6 text-sm text-gray-600">{order.varian}</td>
              <td className="py-4 px-6 text-sm text-gray-500 text-right whitespace-nowrap">
                {formatRupiah(order.harga)}{' '}
                <span className="text-[#44A6F1] font-medium">x{order.qty}</span>
              </td>
              <td className="py-4 px-6 font-bold text-right text-[#D15B2D]">
                {formatRupiah(order.total)}
              </td>
              <td className="py-4 px-6 text-center">
                <StatusBadge
                  status={order.status}
                  onClick={() => onToggleStatus(order.id)}
                  isUpdating={updatingStatusId === order.id}
                />
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDetail(order)}
                    title={`Lihat detail ${order.id}`}
                    aria-label={`Lihat detail pesanan ${order.id}`}
                    className="rounded p-2 text-[#2B7DBA] transition-colors hover:bg-[#D5F5F9]"
                  >
                    <i className="ph ph-eye text-base"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(order)}
                    title={`Edit ${order.id}`}
                    aria-label={`Edit pesanan ${order.id}`}
                    className="rounded p-2 text-[#44A6F1] transition-colors hover:bg-[#D5F5F9]"
                  >
                    <i className="ph ph-pencil-simple text-base"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(order)}
                    title={`Hapus ${order.id}`}
                    aria-label={`Hapus pesanan ${order.id}`}
                    className="rounded p-2 text-[#D15B2D] transition-colors hover:bg-[#FCE9DF]"
                  >
                    <i className="ph ph-trash text-base"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan="8" className="py-10 text-center text-gray-500">
                <i
                  className={`ph text-3xl ${
                    hasActiveFilters ? 'ph-funnel' : 'ph-inbox'
                  } text-gray-300`}
                ></i>
                <p className="mt-2 text-sm">
                  {hasActiveFilters
                    ? 'Tidak ada pesanan yang cocok dengan filter.'
                    : 'Belum ada pesanan masuk.'}
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default OrderTable;
