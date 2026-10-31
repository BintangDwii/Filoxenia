import { formatRupiah } from '../utils/format.js';

const STATUS_COLORS = {
  Pending: '#C4A283',
  Proses: '#44A6F1',
  Selesai: '#2D2D2D',
};

const SummaryCard = ({ icon, iconClassName, label, value, hint }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-2 text-xl font-bold text-[#2D2D2D] break-words">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      </div>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
      >
        <i className={`${icon} text-xl`}></i>
      </span>
    </div>
  </div>
);

const SalesDashboard = ({ stats, hasActiveFilters, resultCount, totalCount }) => {
  const pending = stats.byStatus.find((status) => status.status === 'Pending');
  const proses = stats.byStatus.find((status) => status.status === 'Proses');
  const maxCategoryRevenue = Math.max(
    ...stats.byCategory.map((category) => category.completedRevenue),
    0
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-[#2D2D2D]">
            <i className="ph ph-chart-line-up text-[#44A6F1]"></i> Ringkasan Penjualan
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Menampilkan {resultCount} dari {totalCount} pesanan.
          </p>
        </div>
        {hasActiveFilters && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#44A6F1]/30 bg-[#D5F5F9] px-3 py-1 text-xs font-medium text-[#2B7DBA]">
            <i className="ph ph-funnel"></i>
            Mengikuti filter aktif
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon="ph-fill ph-money"
          iconClassName="bg-[#D5F5F9] text-[#2B7DBA]"
          label="Omzet Selesai"
          value={formatRupiah(stats.completedRevenue)}
          hint={`${stats.completedOrders} pesanan selesai`}
        />
        <SummaryCard
          icon="ph-fill ph-receipt"
          iconClassName="bg-[#FCE9DF] text-[#D15B2D]"
          label="Total Nilai Pesanan"
          value={formatRupiah(stats.totalRevenue)}
          hint={`${stats.totalOrders} pesanan tercatat`}
        />
        <SummaryCard
          icon="ph-fill ph-hourglass-medium"
          iconClassName="bg-[#F5EFE8] text-[#A6805E]"
          label="Pesanan Aktif"
          value={stats.activeOrders}
          hint={`${pending?.count ?? 0} pending · ${proses?.count ?? 0} proses`}
        />
        <SummaryCard
          icon="ph-fill ph-package"
          iconClassName="bg-[#E8F7EC] text-[#2F8A4B]"
          label="Item Terjual"
          value={stats.soldItems}
          hint={`dari ${stats.totalItems} total item`}
        />
        <SummaryCard
          icon="ph-fill ph-calculator"
          iconClassName="bg-[#F1ECFA] text-[#7C4DC4]"
          label="Rata-rata Transaksi"
          value={formatRupiah(stats.averageOrderValue)}
          hint="per pesanan selesai"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#2D2D2D]">Penjualan per Kategori</h3>
            <span className="text-xs text-gray-500">Omzet status selesai</span>
          </div>

          <div className="mt-4 space-y-4">
            {stats.byCategory.map((category) => {
              const width =
                maxCategoryRevenue > 0
                  ? (category.completedRevenue / maxCategoryRevenue) * 100
                  : 0;

              return (
                <div key={category.value}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-[#2D2D2D]">{category.label}</p>
                      <p className="text-xs text-gray-500">
                        {category.totalOrders} pesanan · {category.items} item
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-[#D15B2D]">
                      {formatRupiah(category.completedRevenue)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#44A6F1] transition-all duration-300"
                      style={{ width: `${width}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#2D2D2D]">Status Pesanan</h3>
          <div className="mt-4 space-y-3">
            {stats.byStatus.map((status) => (
              <div
                key={status.status}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[status.status] }}
                  ></span>
                  <span className="text-sm font-medium text-[#2D2D2D]">{status.status}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#2D2D2D]">{status.count}</p>
                  <p className="text-[11px] text-gray-500">{formatRupiah(status.totalValue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SalesDashboard;
