import { useEffect, useRef, useState } from 'react';
import { BUKET_VARIANTS, CATEGORIES, INITIAL_FORM } from '../data/constants.js';
import { formatRupiah } from '../utils/format.js';
import {
  getBouquetVariant,
  getPriceHint,
  getSuggestedPrice,
} from '../utils/priceHint.js';
import ColorPicker from './ColorPicker.jsx';

const getFormFromOrder = (order) => ({
  nama: order.nama,
  kategori: order.kategori,
  varian: order.varian,
  tambahan:
    order.kategori === 'Buket' ? getBouquetVariant(order.tambahan).value : '-',
  harga: order.harga,
  qty: order.qty,
});

const OrderForm = ({ onSubmit, editingOrder, onCancelEdit }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (editingOrder) {
      setFormData(getFormFromOrder(editingOrder));
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setFormData({ ...INITIAL_FORM });
    }
  }, [editingOrder]);

  const priceHint = getPriceHint(formData.kategori, formData.tambahan);
  const isBuket = formData.kategori === 'Buket';
  const isEditing = Boolean(editingOrder);
  const total = Number(formData.harga) * Number(formData.qty);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'kategori') {
        if (value === 'Buket') {
          const defaultVariant = BUKET_VARIANTS[0];
          next.tambahan = defaultVariant.value;
          next.harga = String(getSuggestedPrice('Buket', defaultVariant.value));
        } else {
          next.tambahan = '-';
        }
      }

      if (name === 'tambahan' && prev.kategori === 'Buket') {
        next.harga = String(getSuggestedPrice('Buket', value));
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const saved = await onSubmit(formData);
      if (saved) setFormData({ ...INITIAL_FORM });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      className={`scroll-mt-6 rounded-xl border bg-white p-6 shadow-sm transition-colors ${
        isEditing ? 'border-[#44A6F1]/50 ring-1 ring-[#44A6F1]/20' : 'border-gray-200'
      }`}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-[#2D2D2D]">
          <i
            className={`ph ${
              isEditing ? 'ph-pencil-simple text-[#44A6F1]' : 'ph-plus-circle text-[#D15B2D]'
            }`}
          ></i>
          {isEditing ? 'Edit Pre-order' : 'Input Pre-order Baru'}
        </h2>
        {isEditing && (
          <div className="flex items-center gap-2 rounded-lg bg-[#D5F5F9] px-3 py-2 text-xs text-[#2B7DBA]">
            <i className="ph ph-info"></i>
            <span>
              Mengedit <span className="font-semibold">{editingOrder.id}</span>
            </span>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSubmitting}
              className="ml-1 rounded border border-[#44A6F1]/40 px-2 py-0.5 font-medium transition-colors hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Nama Pelanggan</label>
          <input
            required
            type="text"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            placeholder="Contoh: Moana"
            className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2.5 focus:border-[#44A6F1] focus:ring-1 focus:ring-[#44A6F1] focus:bg-white outline-none transition-all placeholder:text-gray-400 text-[#2D2D2D]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Kategori Produk</label>
          <select
            name="kategori"
            value={formData.kategori}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2.5 focus:border-[#44A6F1] focus:ring-1 focus:ring-[#44A6F1] focus:bg-white outline-none transition-all text-[#2D2D2D]"
          >
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Detail / Warna Kawat</label>
          <input
            required
            type="text"
            name="varian"
            value={formData.varian}
            onChange={handleChange}
            placeholder="Ketik atau pilih warna di bawah..."
            className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2.5 focus:border-[#44A6F1] focus:ring-1 focus:ring-[#44A6F1] focus:bg-white outline-none transition-all placeholder:text-gray-400 text-[#2D2D2D] text-sm"
          />
          <ColorPicker
            selected={formData.varian}
            onSelect={(colorName) => setFormData((prev) => ({ ...prev, varian: colorName }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {isBuket ? 'Varian Buket' : 'Opsi Tambahan'}
          </label>
          {isBuket ? (
            <>
              <select
                required
                name="tambahan"
                value={formData.tambahan}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2.5 focus:border-[#44A6F1] focus:ring-1 focus:ring-[#44A6F1] focus:bg-white outline-none transition-all text-[#2D2D2D]"
              >
                {BUKET_VARIANTS.map((variant) => (
                  <option key={variant.value} value={variant.value}>
                    {variant.value === 'Pakai Cokelat'
                      ? `${variant.label} (+ ${formatRupiah(variant.defaultPrice)})`
                      : variant.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Harga default otomatis terisi, tetap bisa diubah manual.
              </p>
            </>
          ) : (
            <select
              disabled
              value={formData.tambahan}
              className="w-full cursor-not-allowed bg-gray-100 border border-gray-300 rounded px-4 py-2.5 text-gray-500"
            >
              <option value="-">Tidak ada varian tambahan</option>
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex justify-between">
            <span className="text-gray-700">Harga Satuan</span>
            <span className="text-gray-500 text-xs mt-0.5">{priceHint}</span>
          </label>
          <input
            required
            min="0"
            type="number"
            name="harga"
            value={formData.harga}
            onChange={handleChange}
            placeholder="Misal: 15000"
            className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2.5 focus:border-[#44A6F1] focus:ring-1 focus:ring-[#44A6F1] focus:bg-white outline-none transition-all placeholder:text-gray-400 text-[#2D2D2D]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Jumlah (Qty)</label>
            <input
              required
              type="number"
              min="1"
              name="qty"
              value={formData.qty}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2.5 focus:border-[#44A6F1] focus:ring-1 focus:ring-[#44A6F1] focus:bg-white outline-none transition-all text-[#2D2D2D]"
            />
          </div>
          <div className="space-y-2 flex flex-col justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 bg-[#D15B2D] text-white hover:bg-opacity-90 font-medium py-2.5 rounded transition-all disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting && <i className="ph ph-circle-notch animate-spin"></i>}
              {isSubmitting
                ? isEditing
                  ? 'Mengupdate...'
                  : 'Menyimpan...'
                : isEditing
                  ? 'Update'
                  : 'Simpan'}
            </button>
          </div>
        </div>
      </form>

      {Number(formData.harga) > 0 && Number(formData.qty) > 0 ? (
        <div className="mt-6 p-4 bg-[#D5F5F9] rounded border border-[#44A6F1]/20 flex justify-between items-center">
          <span className="text-[#2D2D2D] font-medium text-sm">Estimasi Total Harga:</span>
          <span className="text-xl font-bold text-[#D15B2D]">{formatRupiah(total)}</span>
        </div>
      ) : null}
    </section>
  );
};

export default OrderForm;
