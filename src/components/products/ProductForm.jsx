import { useEffect, useMemo, useState } from 'react';
import { calculatePricing } from '../../../shared/pricing.js';
import { CATEGORIES, PRODUCT_MODE_OPTIONS } from '../../data/constants.js';
import { formatNumber, formatPercent, formatRupiah } from '../../utils/format.js';

const INPUT_CLASS =
  'w-full rounded border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-[#2D2D2D] outline-none transition-all placeholder:text-gray-400 focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]';
const LABEL_CLASS = 'text-sm font-medium text-gray-700';

const getInitialForm = (product) => ({
  nama: product?.nama ?? '',
  kategori: product?.kategori ?? 'Headband',
  varian: product?.varian ?? '',
  yieldQty: product ? String(product.yieldQty) : '1',
  biayaKemasan: product ? String(product.biayaKemasan) : '0',
  tenagaKerjaPersen: product ? String(product.tenagaKerjaPersen) : '20',
  overheadPersen: product ? String(product.overheadPersen) : '10',
  marginPersen: product ? String(product.marginPersen) : '100',
  pembulatan: product ? String(product.pembulatan) : '1000',
  modeBiaya: product?.modeBiaya ?? 'manual',
  biayaBahanManual: product ? String(product.biayaBahanManual) : '',
  catatan: product?.catatan ?? '',
  materials:
    product?.materials?.map((item) => ({
      materialId: String(item.materialId),
      qty: String(item.qty),
    })) ?? [],
});

const Field = ({ label, hint, children, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    <label className={LABEL_CLASS}>{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-500">{hint}</p>}
  </div>
);

const ResultRow = ({ label, value, strong = false }) => (
  <div className="flex items-center justify-between gap-3 border-b border-white/20 py-1.5 last:border-0">
    <span className={`text-xs ${strong ? 'font-semibold' : 'text-[#2B7DBA]/80'}`}>
      {label}
    </span>
    <span className={`text-sm ${strong ? 'font-bold' : 'font-medium'}`}>
      {value}
    </span>
  </div>
);

const ProductForm = ({
  product,
  materials,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState(() => getInitialForm(product));
  const isEditing = Boolean(product);

  useEffect(() => {
    setForm(getInitialForm(product));
  }, [product]);

  const materialMap = useMemo(
    () => new Map(materials.map((material) => [String(material.id), material])),
    [materials]
  );

  const recipeCost = form.materials.reduce((total, row) => {
    const material = materialMap.get(row.materialId);
    return total + (material ? Number(row.qty) * material.hargaSatuan : 0);
  }, 0);
  const materialCost =
    form.modeBiaya === 'manual' ? Number(form.biayaBahanManual) || 0 : recipeCost;
  const pricing = calculatePricing({
    materialCost,
    yieldQty: Number(form.yieldQty) || 1,
    packagingCost: Number(form.biayaKemasan) || 0,
    laborPercent: Number(form.tenagaKerjaPersen) || 0,
    overheadPercent: Number(form.overheadPersen) || 0,
    marginPercent: Number(form.marginPersen) || 0,
    roundingStep: Number(form.pembulatan) || 1000,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateRecipe = (index, field, value) => {
    setForm((current) => ({
      ...current,
      materials: current.materials.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  };

  const addRecipeRow = () => {
    setForm((current) => ({
      ...current,
      materials: [...current.materials, { materialId: '', qty: '1' }],
    }));
  };

  const removeRecipeRow = (index) => {
    setForm((current) => ({
      ...current,
      materials: current.materials.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const rows = form.materials
      .filter((row) => row.materialId && Number(row.qty) > 0)
      .map((row) => ({
        materialId: Number(row.materialId),
        qty: Number(row.qty),
      }));

    const payload = {
      nama: form.nama,
      kategori: form.kategori,
      varian: form.varian,
      yieldQty: Number(form.yieldQty),
      biayaKemasan: Number(form.biayaKemasan) || 0,
      tenagaKerjaPersen: Number(form.tenagaKerjaPersen) || 0,
      overheadPersen: Number(form.overheadPersen) || 0,
      marginPersen: Number(form.marginPersen) || 0,
      pembulatan: Number(form.pembulatan) || 1000,
      modeBiaya: form.modeBiaya,
      biayaBahanManual:
        form.modeBiaya === 'manual' ? Number(form.biayaBahanManual) || 0 : 0,
      catatan: form.catatan,
      materials: form.modeBiaya === 'bom' ? rows : [],
    };

    const saved = await onSubmit(payload);
    if (saved && !isEditing) setForm(getInitialForm(null));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#2D2D2D]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D5F5F9] text-xs text-[#2B7DBA]">
            1
          </span>
          Identitas Produk
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nama Produk" className="sm:col-span-2">
            <input
              required
              type="text"
              name="nama"
              value={form.nama}
              onChange={handleChange}
              placeholder="Contoh: Buket Bunga Matahari & Lily"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Kategori">
            <select
              name="kategori"
              value={form.kategori}
              onChange={handleChange}
              className={INPUT_CLASS}
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Varian / Keterangan Singkat">
            <input
              type="text"
              name="varian"
              value={form.varian}
              onChange={handleChange}
              placeholder="Contoh: Bunga Matahari & Lily"
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#2D2D2D]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D5F5F9] text-xs text-[#2B7DBA]">
            2
          </span>
          Target Produksi & Parameter Harga
        </h3>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Field
            label="Hasil per Batch"
            hint="1 batch menghasilkan berapa unit?"
          >
            <input
              required
              min="0.001"
              step="0.001"
              type="number"
              name="yieldQty"
              value={form.yieldQty}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Kemasan / Unit">
            <input
              min="0"
              step="1"
              type="number"
              name="biayaKemasan"
              value={form.biayaKemasan}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Tenaga Kerja (%)">
            <input
              min="0"
              step="0.1"
              type="number"
              name="tenagaKerjaPersen"
              value={form.tenagaKerjaPersen}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Overhead (%)">
            <input
              min="0"
              step="0.1"
              type="number"
              name="overheadPersen"
              value={form.overheadPersen}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Margin (%)">
            <input
              min="0"
              step="0.1"
              type="number"
              name="marginPersen"
              value={form.marginPersen}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </Field>
          <Field
            label="Pembulatan Harga"
            hint="Harga final dibulatkan ke atas."
          >
            <select
              name="pembulatan"
              value={form.pembulatan}
              onChange={handleChange}
              className={INPUT_CLASS}
            >
              <option value="1000">Ke atas 1.000</option>
              <option value="500">Ke atas 500</option>
              <option value="100">Ke atas 100</option>
              <option value="1">Tanpa pembulatan</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#2D2D2D]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D5F5F9] text-xs text-[#2B7DBA]">
            3
          </span>
          Biaya Bahan
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PRODUCT_MODE_OPTIONS.map((mode) => (
            <label
              key={mode.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                form.modeBiaya === mode.value
                  ? 'border-[#44A6F1] bg-[#F3FAFE]'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="modeBiaya"
                value={mode.value}
                checked={form.modeBiaya === mode.value}
                onChange={handleChange}
                className="mt-1 accent-[#44A6F1]"
              />
              <span>
                <span className="block text-sm font-semibold text-[#2D2D2D]">
                  {mode.label}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {mode.description}
                </span>
              </span>
            </label>
          ))}
        </div>

        {form.modeBiaya === 'manual' ? (
          <Field
            label="Total Biaya Bahan per Batch"
            hint="Isi total belanja bahan untuk satu kali produksi."
          >
            <div className="relative max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                Rp
              </span>
              <input
                required
                min="0"
                step="1"
                type="number"
                name="biayaBahanManual"
                value={form.biayaBahanManual}
                onChange={handleChange}
                placeholder="0"
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>
          </Field>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 rounded-lg border border-[#44A6F1]/20 bg-[#F3FAFE] p-3 text-xs text-[#2B7DBA] sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-start gap-2">
                <i className="ph ph-info mt-0.5"></i>
                Masukkan qty bahan untuk satu batch. Stok akan dipotong otomatis
                saat pesanan selesai.
              </span>
              <span className="shrink-0 font-semibold">
                Total bahan: {formatRupiah(recipeCost)}
              </span>
            </div>

            {form.materials.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
                Belum ada bahan di resep. Klik tombol di bawah untuk menambah.
              </div>
            ) : (
              <div className="space-y-2">
                {form.materials.map((row, index) => {
                  const material = materialMap.get(row.materialId);
                  const subtotal = material
                    ? Number(row.qty) * material.hargaSatuan
                    : 0;

                  return (
                    <div
                      key={`${index}-${row.materialId}`}
                      className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_110px_120px_36px] sm:items-end"
                    >
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-gray-500">
                          Bahan
                        </label>
                        <select
                          value={row.materialId}
                          onChange={(event) =>
                            updateRecipe(index, 'materialId', event.target.value)
                          }
                          className={INPUT_CLASS}
                        >
                          <option value="">Pilih bahan...</option>
                          {materials.map((item) => (
                            <option
                              key={item.id}
                              value={item.id}
                              disabled={form.materials.some(
                                (other, otherIndex) =>
                                  otherIndex !== index &&
                                  other.materialId === String(item.id)
                              )}
                            >
                              {item.nama} ({formatRupiah(item.hargaSatuan)}/
                              {item.satuan})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-gray-500">
                          Qty / Batch
                        </label>
                        <input
                          min="0.001"
                          step="0.001"
                          type="number"
                          value={row.qty}
                          onChange={(event) =>
                            updateRecipe(index, 'qty', event.target.value)
                          }
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-gray-500">
                          Subtotal
                        </span>
                        <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-[#2D2D2D]">
                          {formatRupiah(subtotal)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRecipeRow(index)}
                        title="Hapus bahan dari resep"
                        className="flex h-10 items-center justify-center rounded text-[#D15B2D] transition-colors hover:bg-[#FCE9DF]"
                      >
                        <i className="ph ph-trash"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={addRecipeRow}
              disabled={form.materials.length >= materials.length}
              className="inline-flex items-center gap-1.5 rounded border border-[#44A6F1] px-3 py-2 text-xs font-medium text-[#2B7DBA] transition-colors hover:bg-[#D5F5F9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <i className="ph ph-plus"></i>
              Tambah Bahan ke Resep
            </button>

            {materials.length === 0 && (
              <p className="text-xs text-[#A6805E]">
                Belum ada bahan di inventory. Tambah bahan dulu di tab Inventory.
              </p>
            )}
          </div>
        )}
      </section>

      <Field label="Catatan Produk">
        <textarea
          rows="2"
          name="catatan"
          value={form.catatan}
          onChange={handleChange}
          placeholder="Opsional: info khusus produksi atau target pasar."
          className={INPUT_CLASS}
        />
      </Field>

      <div className="rounded-xl border border-[#44A6F1]/25 bg-[#F3FAFE] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#2B7DBA]">
          <i className="ph-fill ph-calculator"></i>
          Hasil Perhitungan Otomatis
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-4">
            <ResultRow
              label="Biaya bahan"
              value={formatRupiah(pricing.materialCost)}
            />
            <ResultRow
              label={`Tenaga kerja ${formatNumber(pricing.laborPercent, 1)}%`}
              value={formatRupiah(pricing.laborCost)}
            />
            <ResultRow
              label={`Overhead ${formatNumber(pricing.overheadPercent, 1)}%`}
              value={formatRupiah(pricing.overheadCost)}
            />
            <ResultRow
              label="HPP total"
              value={formatRupiah(pricing.hppTotal)}
              strong
            />
            <ResultRow
              label={`HPP / unit (${formatNumber(pricing.yieldQty, 2)} hasil)`}
              value={formatRupiah(pricing.hppPerUnit)}
            />
            <ResultRow
              label="Kemasan / unit"
              value={formatRupiah(pricing.packagingCost)}
            />
            <ResultRow
              label="Modal / unit"
              value={formatRupiah(pricing.modalPerUnit)}
              strong
            />
          </div>
          <div className="rounded-lg bg-[#2B7DBA] p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-white/70">
              Harga Jual Final
            </p>
            <p className="mt-1 text-3xl font-bold">
              {formatRupiah(pricing.sellingPriceFinal)}
            </p>
            <div className="mt-3">
              <ResultRow
                label="Margin"
                value={formatPercent(pricing.marginPercent, 1)}
              />
              <ResultRow
                label="Nilai margin / unit"
                value={formatRupiah(pricing.marginAmount)}
              />
              <ResultRow
                label="Harga sebelum pembulatan"
                value={formatRupiah(pricing.sellingPriceRaw)}
              />
              <ResultRow
                label="BEP bahan"
                value={formatPercent(pricing.bepPercent, 2)}
              />
            </div>
          </div>
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
          className="flex items-center gap-2 rounded bg-[#D15B2D] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting && <i className="ph ph-circle-notch animate-spin"></i>}
          {isSubmitting
            ? 'Menyimpan...'
            : isEditing
              ? 'Simpan Perubahan'
              : 'Simpan Produk'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
