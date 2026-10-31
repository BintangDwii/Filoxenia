import { useEffect, useState } from 'react';
import { MATERIAL_UNITS } from '../../data/constants.js';

const getInitialForm = (material) => ({
  nama: material?.nama ?? '',
  satuan: material?.satuan ?? 'pcs',
  stok: material ? '' : '0',
  stokMinimum: material ? String(material.stokMinimum) : '0',
  hargaSatuan: material ? String(material.hargaSatuan) : '',
  catatan: material?.catatan ?? '',
});

const MaterialForm = ({ material, onSubmit, onCancel, isSubmitting = false }) => {
  const [form, setForm] = useState(() => getInitialForm(material));
  const isEditing = Boolean(material);

  useEffect(() => {
    setForm(getInitialForm(material));
  }, [material]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      nama: form.nama,
      satuan: form.satuan,
      stokMinimum: form.stokMinimum,
      hargaSatuan: form.hargaSatuan || 0,
      catatan: form.catatan,
    };

    if (!isEditing) payload.stok = form.stok || 0;

    const saved = await onSubmit(payload);
    if (saved) setForm(getInitialForm(null));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg border border-[#44A6F1]/20 bg-[#F3FAFE] p-3 text-xs text-[#2B7DBA]">
        <i className="ph ph-info mt-0.5"></i>
        <span>
          Isi harga per satu satuan. Nilai stok dan HPP produk akan dihitung
          otomatis dari harga ini.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">
            Nama Bahan <span className="text-[#D15B2D]">*</span>
          </label>
          <input
            required
            type="text"
            name="nama"
            value={form.nama}
            onChange={handleChange}
            placeholder="Contoh: Kawat tembaga"
            className="w-full rounded border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-[#2D2D2D] outline-none transition-all placeholder:text-gray-400 focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Satuan</label>
          <input
            required
            list="material-units"
            type="text"
            name="satuan"
            value={form.satuan}
            onChange={handleChange}
            placeholder="pcs / meter / gram"
            className="w-full rounded border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-[#2D2D2D] outline-none transition-all placeholder:text-gray-400 focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
          />
          <datalist id="material-units">
            {MATERIAL_UNITS.map((unit) => (
              <option key={unit} value={unit} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Harga per Satuan
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
              Rp
            </span>
            <input
              required
              min="0"
              step="1"
              type="number"
              name="hargaSatuan"
              value={form.hargaSatuan}
              onChange={handleChange}
              placeholder="0"
              className="w-full rounded border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#2D2D2D] outline-none transition-all placeholder:text-gray-400 focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
            />
          </div>
        </div>

        {!isEditing && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Stok Awal</label>
            <input
              min="0"
              step="0.001"
              type="number"
              name="stok"
              value={form.stok}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-[#2D2D2D] outline-none transition-all focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
            />
            <p className="text-xs text-gray-500">
              Stok awal akan tercatat sebagai pergerakan stok masuk.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Stok Minimum
          </label>
          <input
            min="0"
            step="0.001"
            type="number"
            name="stokMinimum"
            value={form.stokMinimum}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-[#2D2D2D] outline-none transition-all focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
          />
          <p className="text-xs text-gray-500">
            Sistem memberi tanda restock jika stok menyentuh angka ini.
          </p>
        </div>

        {isEditing && (
          <div className="space-y-2 sm:col-span-2">
            <div className="rounded-lg border border-[#A6805E]/30 bg-[#F5EFE8] p-3 text-xs text-[#8A6544]">
              Stok saat ini <strong>{material.stok}</strong> {material.satuan}.
              Untuk mengubah stok, tutup form ini lalu gunakan tombol
              Restock/Sesuaikan agar riwayatnya tercatat.
            </div>
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">Catatan</label>
          <textarea
            rows="2"
            name="catatan"
            value={form.catatan}
            onChange={handleChange}
            placeholder="Opsional: merek, warna, atau info pemasok."
            className="w-full rounded border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-[#2D2D2D] outline-none transition-all placeholder:text-gray-400 focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
          />
        </div>
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
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded bg-[#44A6F1] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting && <i className="ph ph-circle-notch animate-spin"></i>}
          {isSubmitting
            ? 'Menyimpan...'
            : isEditing
              ? 'Simpan Perubahan'
              : 'Tambah Bahan'}
        </button>
      </div>
    </form>
  );
};

export default MaterialForm;
