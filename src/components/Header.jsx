import { VIEW_ITEMS } from '../data/constants.js';

const Header = ({ admin, onLogout, currentView, onNavigate }) => (
  <header className="space-y-4 py-4">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-[#2D2D2D]">
          <i className="ph ph-waves text-[#44A6F1]"></i>
          Filoxenia Inventory
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
          Kelola pesanan, stok bahan, resep, dan harga jual dalam satu tempat.
          <span className="inline-flex items-center gap-1 text-xs text-[#2B7DBA]">
            <i className="ph ph-database"></i>
            Tersimpan di database
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
          <i className="ph-fill ph-user-circle text-lg text-[#44A6F1]"></i>
          {admin?.username ?? 'Admin'}
        </span>
        <button
          type="button"
          onClick={onLogout}
          title="Keluar dari akun admin"
          className="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <i className="ph ph-sign-out text-lg"></i>
          Logout
        </button>
      </div>
    </div>

    <nav className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
      <div className="flex min-w-max gap-1">
        {VIEW_ITEMS.map((item) => {
          const active = currentView === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onNavigate(item.value)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-[150px] flex-1 items-center gap-2 rounded-lg px-4 py-2.5 text-left transition-colors ${
                active
                  ? 'bg-[#D5F5F9] text-[#2B7DBA]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <i className={`ph ${item.icon} text-xl`}></i>
              <span>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span
                  className={`block text-[11px] ${
                    active ? 'text-[#2B7DBA]/80' : 'text-gray-400'
                  }`}
                >
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  </header>
);

export default Header;
