import {
  formatDateTime,
  formatQuantity,
  formatRupiah,
} from '../../utils/format.js';

const TYPE_STYLES = {
  masuk: {
    label: 'Masuk',
    className: 'bg-[#E8F7EC] text-[#2F8A4B]',
    icon: 'ph-arrow-down-left',
  },
  keluar: {
    label: 'Keluar',
    className: 'bg-[#FCE9DF] text-[#D15B2D]',
    icon: 'ph-arrow-up-right',
  },
  penyesuaian: {
    label: 'Penyesuaian',
    className: 'bg-[#F1ECFA] text-[#7C4DC4]',
    icon: 'ph-sliders-horizontal',
  },
};

const MovementHistory = ({ movements }) => {
  if (movements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
        Belum ada pergerakan stok. Riwayat akan muncul setelah restock atau
        penyesuaian pertama.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
          <tr>
            <th className="px-4 py-3">Waktu</th>
            <th className="px-4 py-3">Bahan</th>
            <th className="px-4 py-3">Jenis</th>
            <th className="px-4 py-3 text-right">Perubahan</th>
            <th className="px-4 py-3 text-right">Stok Akhir</th>
            <th className="px-4 py-3">Catatan</th>
          </tr>
        </thead>
        <tbody>
          {movements.slice(0, 30).map((movement) => {
            const style = TYPE_STYLES[movement.tipe] ?? TYPE_STYLES.penyesuaian;
            const positive = movement.jumlah > 0;

            return (
              <tr key={movement.id} className="border-t border-gray-100">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                  {formatDateTime(movement.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium text-[#2D2D2D]">
                  {movement.materialNama}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.className}`}
                  >
                    <i className={`ph ${style.icon}`}></i>
                    {style.label}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                    positive ? 'text-[#2F8A4B]' : 'text-[#D15B2D]'
                  }`}
                >
                  {positive ? '+' : ''}
                  {formatQuantity(movement.jumlah)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-gray-600">
                  {formatQuantity(movement.stokSesudah)}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  <p>{movement.catatan || '-'}</p>
                  {movement.hargaSatuan !== null && (
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      Harga saat itu {formatRupiah(movement.hargaSatuan)}
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MovementHistory;
