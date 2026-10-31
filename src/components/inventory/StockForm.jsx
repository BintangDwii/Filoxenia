import { useEffect, useState } from 'react';
import { STOCK_TYPE_OPTIONS } from '../../data/constants.js';
import { formatQuantity } from '../../utils/format.js';

const getInitialForm = (material) => ({
  tipe: 'masuk',
  jumlah: '',
  hargaSatuan: material ? String(material.hargaSatuan) : '',
  catatan: '',
});

const StockForm = ({ material, onSubmit, onCancel, isSubmitting = false }) => {
  const [form, setForm] = useState(() => getInitialForm(material));

  useEffect(() => {
    setForm(getInitialForm(material));
  }, [material]);

  if (!material) return null;

  const currentStock = Number(material.stok);
  const amount = Number(form.jumlah) || 0;
  const nextStock =
    form.tipe === 'penyesuaian'
      ? amount
      : form.tipe === 'masuk'
        ? currentStock + amount
        : currentStock - amount;
  const selectedType = STOCK_TYPE_OPTIONS.find((item) => item.value === form.tipe);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      tipe: form.tipe,
      jumlah: form.jumlah,
      catatan: form.catatan,
      hargaSatuan:
        form.tipe === 'keluar' ? undefined : form.hargaSatuan || undefined,
    };

    const saved = await onSubmit(payload);
    if (saved) setForm(getInitialForm(material));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-[#44A6F1]/20 bg-[#F3FAFE] p-3 text-sm text-[#2B7DBA]">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">{material.nama}</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm">
            Stok {formatQuantity(currentStock)} {material.satuan}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Jenis Pergerakan Stok
        </label>
        <div className="grid grid-cols-1 gap-2">
          {STOCK_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                form.tipe === option.value
                  ? 'border-[#44A6F1] bg-[#F3FAFE]'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="tipe"
                value={option.value}
                checked={form.tipe === option.value}
                onChange={handleChange}
                className="mt-1 accent-[#44A6F1]"
              />
              <span>
                <span className="block text-sm font-medium text-[#2D2D2D]">
                  {option.label}
                </span>
                <span className="block text-xs text-gray-500">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {form.tipe === 'penyesuaian'
              ? 'Stok Baru'
              : form.tipe === 'masuk'
                ? 'Jumlah Masuk'
                : 'Jumlah Keluar'}
          </label>
          <input
            required
            min="0"
            step="0.001"
            type="number"
            name="jumlah"
            value={form.jumlah}
            onChange={handleChange}
            placeholder="0"
            className="w-full rounded border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-[#2D2D2D] outline-none transition-all placeholder:text-gray-400 focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
          />
        </div>

        {form.tipe !== 'keluar' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Harga per Satuan
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                Rp
              </span>
              <input
                min="0"
                step="1"
                type="number"
                name="hargaSatuan"
                value={form.hargaSatuan}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#2D2D2D] outline-none transition-all focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
              />
            </div>
            <p className="text-xs text-gray-500">
              Perbarui jika harga beli bahan berubah. HPP produk ikut menyesuaikan.
            </p>
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">Catatan</label>
          <input
            type="text"
            name="catatan"
            value={form.catatan}
            onChange={handleChange}
            placeholder="Contoh: Beli di toko A / stok opname akhir bulan."
            className="w-full rounded border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-[#2D2D2D] outline-none transition-all placeholder:text-gray-400 focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
          />
        </div>
      </div>

      <div
        className={`rounded-lg border p-4 text-sm ${
          nextStock < 0
            ? 'border-[#D15B2D]/30 bg-[#FCE9DF] text-[#D15B2D]'
            : 'border-gray-200 bg-gray-50 text-gray-600'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span>
            {selectedType?.label}: {formatQuantity(currentStock)} →{' '}
            <strong>{formatQuantity(nextStock)}</strong> {material.satuan}
          </span>
          <i
            className={`ph ${
              nextStock < 0 ? 'ph-warning-circle' : 'ph-arrow-right'
            }`}
          ></i>
        </div>
        {nextStock < 0 && (
          <p className="mt-1 text-xs">
            Stok tidak boleh minus. Kurangi jumlah keluar atau tambah stok dulu.
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting || nextStock < 0}
          className="flex items-center gap-2 rounded bg-[#2F8A4B] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <i className="ph ph-circle-notch animate-spin"></i>}
          {isSubmitting ? 'Menyimpan...' : 'Simpan Pergerakan Stok'}
        </button>
      </div>
    </form>
  );
};

export default StockForm;
