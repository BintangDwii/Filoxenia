import { useMemo, useRef, useState } from 'react';
import { calculatePricing, sumShoppingList } from '../../../shared/pricing.js';
import { CATEGORIES } from '../../data/constants.js';
import { formatNumber, formatPercent, formatRupiah } from '../../utils/format.js';

const INPUT_CLASS =
  'w-full rounded border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-[#2D2D2D] outline-none transition-all placeholder:text-gray-400 focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]';

const INITIAL_FORM = {
  templateId: '',
  productName: '',
  kategori: 'Headband',
  yieldQty: '1',
  packagingCost: '0',
  laborPercent: '20',
  overheadPercent: '10',
  marginPercent: '100',
  roundingStep: '1000',
};

const createItem = (overrides = {}) => ({
  key: `${Date.now()}-${Math.random()}`,
  nama: '',
  qty: '1',
  hargaSatuan: '',
  ...overrides,
});

const ResultRow = ({ label, formula, value, strong = false }) => (
  <div
    className={`flex items-start justify-between gap-3 border-b border-gray-100 py-2.5 last:border-0 ${
      strong ? 'text-[#D15B2D]' : 'text-[#2D2D2D]'
    }`}
  >
    <div>
      <p className={`text-sm ${strong ? 'font-semibold' : 'font-medium'}`}>
        {label}
      </p>
      {formula && <p className="mt-0.5 text-[11px] text-gray-500">{formula}</p>}
    </div>
    <p className={`shrink-0 text-sm ${strong ? 'font-bold' : 'font-medium'}`}>
      {value}
    </p>
  </div>
);

const PricingCalculator = ({
  products,
  materials,
  onSubmit,
  onClose,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [items, setItems] = useState(() => [createItem()]);
  const nextKey = useRef(1);

  const materialCost = useMemo(() => sumShoppingList(items), [items]);
  const pricing = calculatePricing({
    materialCost,
    yieldQty: Number(form.yieldQty) || 1,
    packagingCost: Number(form.packagingCost) || 0,
    laborPercent: Number(form.laborPercent) || 0,
    overheadPercent: Number(form.overheadPercent) || 0,
    marginPercent: Number(form.marginPercent) || 0,
    roundingStep: Number(form.roundingStep) || 1000,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleTemplate = (event) => {
    const template = products.find(
      (product) => String(product.id) === event.target.value
    );

    if (!template) {
      setForm((current) => ({ ...current, templateId: '' }));
      return;
    }

    setForm({
      templateId: String(template.id),
      productName: `${template.nama} (Revisi)`,
      kategori: template.kategori,
      yieldQty: String(template.yieldQty),
      packagingCost: String(template.biayaKemasan),
      laborPercent: String(template.tenagaKerjaPersen),
      overheadPercent: String(template.overheadPersen),
      marginPercent: String(template.marginPersen),
      roundingStep: String(template.pembulatan),
    });

    if (template.materials?.length > 0) {
      setItems(
        template.materials.map((material, index) => {
          nextKey.current += 1;
          return createItem({
            key: `template-${material.materialId}-${index}-${nextKey.current}`,
            nama: material.nama,
            qty: String(material.qty),
            hargaSatuan: String(material.hargaSatuan),
          });
        })
      );
    } else {
      setItems([
        createItem({
          nama: 'Total bahan (dari produk)',
          qty: '1',
          hargaSatuan: String(template.biayaBahanManual),
        }),
      ]);
    }
  };

  const updateItem = (index, field, value) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addItem = () => {
    nextKey.current += 1;
    setItems((current) => [
      ...current,
      createItem({ key: `item-${nextKey.current}` }),
    ]);
  };

  const removeItem = (index) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setItems([createItem()]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!form.productName.trim()) return;

    const saved = await onSubmit({
      nama: form.productName.trim(),
      kategori: form.kategori,
      varian: 'Dari kalkulator RAB',
      yieldQty: Number(form.yieldQty),
      biayaKemasan: Number(form.packagingCost) || 0,
      tenagaKerjaPersen: Number(form.laborPercent) || 0,
      overheadPersen: Number(form.overheadPercent) || 0,
      marginPersen: Number(form.marginPercent) || 0,
      pembulatan: Number(form.roundingStep) || 1000,
      modeBiaya: 'manual',
      biayaBahanManual: materialCost,
      catatan: 'Dibuat dari Kalkulator RAB.',
      materials: [],
    });

    if (saved) reset();
  };

  const materialOptions = materials.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onClose}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#2B7DBA] transition-colors hover:text-[#1f5f8f]"
          >
            <i className="ph ph-arrow-left"></i>
            Kembali ke daftar produk
          </button>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#2D2D2D]">
            <i className="ph ph-calculator text-[#7C4DC4]"></i>
            Kalkulator RAB & Harga Jual
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">
            Masukkan daftar belanja baru, lalu sistem menghitung ulang HPP total,
            HPP per unit, margin, dan harga jual final. Hasilnya bisa langsung
            disimpan sebagai produk.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#7C4DC4]/20 bg-[#F1ECFA] px-3 py-1.5 text-xs font-medium text-[#7C4DC4]">
          <i className="ph ph-info"></i>
          Tenaga kerja 20% · Overhead 10%
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D5F5F9] text-xs font-bold text-[#2B7DBA]">
                1
              </span>
              <h3 className="text-sm font-semibold text-[#2D2D2D]">
                Pilih Template (Opsional)
              </h3>
            </div>
            <select
              value={form.templateId}
              onChange={handleTemplate}
              className={INPUT_CLASS}
            >
              <option value="">Tanpa template / mulai dari nol</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nama} · HJ {formatRupiah(product.pricing.sellingPriceFinal)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Template mengisi parameter dan daftar bahan dari produk yang sudah
              ada. Semua angka tetap bisa diubah.
            </p>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D5F5F9] text-xs font-bold text-[#2B7DBA]">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[#2D2D2D]">
                    Daftar Belanja Bahan
                  </h3>
                  <p className="text-xs text-gray-500">
                    {items.length} baris · total {formatRupiah(materialCost)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded border border-[#44A6F1] px-3 py-2 text-xs font-medium text-[#2B7DBA] transition-colors hover:bg-[#D5F5F9]"
              >
                <i className="ph ph-plus"></i>
                Tambah Baris
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.key}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_90px_130px_36px] sm:items-end"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-500">
                      Nama Barang
                    </label>
                    <input
                      type="text"
                      value={item.nama}
                      onChange={(event) =>
                        updateItem(index, 'nama', event.target.value)
                      }
                      placeholder={
                        materialOptions > 0
                          ? 'Contoh: Kawat tembaga'
                          : 'Contoh: Bunga lily'
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-500">
                      Qty
                    </label>
                    <input
                      min="0"
                      step="0.001"
                      type="number"
                      value={item.qty}
                      onChange={(event) =>
                        updateItem(index, 'qty', event.target.value)
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-500">
                      Harga Satuan
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                        Rp
                      </span>
                      <input
                        min="0"
                        step="1"
                        type="number"
                        value={item.hargaSatuan}
                        onChange={(event) =>
                          updateItem(index, 'hargaSatuan', event.target.value)
                        }
                        placeholder="0"
                        className={`${INPUT_CLASS} pl-10`}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    title="Hapus baris"
                    className="flex h-10 items-center justify-center rounded text-[#D15B2D] transition-colors hover:bg-[#FCE9DF]"
                  >
                    <i className="ph ph-trash"></i>
                  </button>
                </div>
              ))}

              {items.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  Belum ada barang. Klik Tambah Baris untuk mulai menghitung.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D5F5F9] text-xs font-bold text-[#2B7DBA]">
                3
              </span>
              <h3 className="text-sm font-semibold text-[#2D2D2D]">
                Target & Parameter Harga
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nama Produk Baru
                </label>
                <input
                  required
                  type="text"
                  name="productName"
                  value={form.productName}
                  onChange={handleChange}
                  placeholder="Contoh: Buket Revisi Harga"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Kategori
                </label>
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
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Hasil / Batch
                </label>
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
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Kemasan / Unit
                </label>
                <input
                  min="0"
                  step="1"
                  type="number"
                  name="packagingCost"
                  value={form.packagingCost}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tenaga Kerja (%)
                </label>
                <input
                  min="0"
                  step="0.1"
                  type="number"
                  name="laborPercent"
                  value={form.laborPercent}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Overhead (%)
                </label>
                <input
                  min="0"
                  step="0.1"
                  type="number"
                  name="overheadPercent"
                  value={form.overheadPercent}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Margin (%)
                </label>
                <input
                  min="0"
                  step="0.1"
                  type="number"
                  name="marginPercent"
                  value={form.marginPercent}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Pembulatan
                </label>
                <select
                  name="roundingStep"
                  value={form.roundingStep}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                >
                  <option value="1000">Ke atas 1.000</option>
                  <option value="500">Ke atas 500</option>
                  <option value="100">Ke atas 100</option>
                  <option value="1">Tanpa pembulatan</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  materialCost <= 0 ||
                  !form.productName.trim()
                }
                className="flex items-center gap-2 rounded bg-[#D15B2D] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && (
                  <i className="ph ph-circle-notch animate-spin"></i>
                )}
                {isSubmitting ? 'Menyimpan...' : 'Simpan sebagai Produk Baru'}
              </button>
            </div>
          </section>
        </form>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <section className="rounded-xl border border-[#2B7DBA]/20 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#2D2D2D]">
              <i className="ph ph-receipt text-[#2B7DBA]"></i>
              Rincian Perhitungan
            </h3>
            <div className="mt-3">
              <ResultRow
                label="Total belanja bahan"
                formula="Jumlah semua qty × harga satuan"
                value={formatRupiah(pricing.materialCost)}
                strong
              />
              <ResultRow
                label={`Tenaga kerja ${formatNumber(pricing.laborPercent, 1)}%`}
                formula="Total bahan × persentase"
                value={formatRupiah(pricing.laborCost)}
              />
              <ResultRow
                label={`Overhead ${formatNumber(pricing.overheadPercent, 1)}%`}
                formula="Total bahan × persentase"
                value={formatRupiah(pricing.overheadCost)}
              />
              <ResultRow
                label="HPP Total"
                formula="Bahan + tenaga kerja + overhead"
                value={formatRupiah(pricing.hppTotal)}
                strong
              />
              <ResultRow
                label={`HPP per Unit (${formatNumber(pricing.yieldQty, 2)} hasil)`}
                formula="HPP total ÷ hasil per batch"
                value={formatRupiah(pricing.hppPerUnit)}
              />
              <ResultRow
                label="Kemasan per unit"
                value={formatRupiah(pricing.packagingCost)}
              />
              <ResultRow
                label="Modal per Unit"
                formula="HPP/unit + kemasan"
                value={formatRupiah(pricing.modalPerUnit)}
                strong
              />
            </div>
          </section>

          <section className="rounded-xl bg-[#2B7DBA] p-5 text-white shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              Harga Jual Final
            </p>
            <p className="mt-1 text-3xl font-bold">
              {formatRupiah(pricing.sellingPriceFinal)}
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3 border-b border-white/20 pb-2">
                <span className="text-white/75">Margin</span>
                <span className="font-semibold">
                  {formatPercent(pricing.marginPercent, 1)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-b border-white/20 pb-2">
                <span className="text-white/75">Nilai margin / unit</span>
                <span className="font-semibold">
                  {formatRupiah(pricing.marginAmount)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-b border-white/20 pb-2">
                <span className="text-white/75">Harga sebelum pembulatan</span>
                <span className="font-semibold">
                  {formatRupiah(pricing.sellingPriceRaw)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-b border-white/20 pb-2">
                <span className="text-white/75">Pembulatan</span>
                <span className="font-semibold">
                  +{formatRupiah(pricing.sellingPriceFinal - pricing.sellingPriceRaw)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-white/75">BEP bahan</span>
                <span className="font-semibold">
                  {formatPercent(pricing.bepPercent, 2)}
                </span>
              </div>
            </div>
          </section>

          <div className="rounded-xl border border-[#A6805E]/20 bg-[#F5EFE8] p-4 text-xs leading-relaxed text-[#8A6544]">
            <p className="flex items-center gap-1.5 font-semibold">
              <i className="ph ph-lightbulb"></i>
              Cara membaca
            </p>
            <p className="mt-1">
              Harga jual final = modal per unit + margin, lalu dibulatkan ke atas.
              BEP bahan menunjukkan porsi harga jual yang setara dengan biaya
              bahan saja.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PricingCalculator;
