import {
  CATEGORIES,
  DATE_RANGE_OPTIONS,
  ORDER_STATUSES,
  SORT_OPTIONS,
} from '../data/constants.js';

const SELECT_CLASS =
  'w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-[#2D2D2D] outline-none transition-all focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]';

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    {children}
  </div>
);

const OrderFilters = ({ filters, onChange, onReset, hasActiveFilters, resultCount, totalCount }) => (
  <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
      <div className="space-y-1.5 md:col-span-2">
        <label className="text-xs font-medium text-gray-600">Cari Pesanan</label>
        <div className="relative">
          <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            placeholder="Nama, ID, varian, atau kategori..."
            className="w-full rounded border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm text-[#2D2D2D] outline-none transition-all placeholder:text-gray-400 focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
          />
        </div>
      </div>

      <Field label="Status">
        <select
          value={filters.status}
          onChange={(e) => onChange('status', e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="all">Semua Status</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Kategori">
        <select
          value={filters.kategori}
          onChange={(e) => onChange('kategori', e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="all">Semua Kategori</option>
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tanggal">
        <select
          value={filters.dateRange}
          onChange={(e) => onChange('dateRange', e.target.value)}
          className={SELECT_CLASS}
        >
          {DATE_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Urutkan">
        <select
          value={filters.sortBy}
          onChange={(e) => onChange('sortBy', e.target.value)}
          className={SELECT_CLASS}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
    </div>

    <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-gray-500">
        Menampilkan <span className="font-semibold text-[#2D2D2D]">{resultCount}</span> dari{' '}
        <span className="font-semibold text-[#2D2D2D]">{totalCount}</span> pesanan
      </p>
      <button
        type="button"
        onClick={onReset}
        disabled={!hasActiveFilters}
        className="inline-flex items-center justify-center gap-1.5 self-start rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
      >
        <i className="ph ph-arrow-counter-clockwise"></i>
        Reset Filter
      </button>
    </div>
  </section>
);

export default OrderFilters;
