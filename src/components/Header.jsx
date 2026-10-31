const Header = ({ onExport, admin, onLogout }) => (
  <header className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h1 className="text-3xl font-bold text-[#2D2D2D] flex items-center gap-3">
        <i className="ph ph-waves text-[#44A6F1]"></i>
        Filoxenia Inventory
      </h1>
      <p className="text-gray-500 mt-1 text-sm flex flex-wrap items-center gap-1.5">
        Kelola Pre-order Headband, Gelang, dan Buket.
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
        onClick={onExport}
        className="flex items-center gap-2 bg-[#44A6F1] hover:bg-opacity-90 text-white px-5 py-2.5 rounded transition-all duration-200 font-medium"
      >
        <i className="ph ph-file-csv text-xl"></i>
        Export CSV
      </button>
      <button
        onClick={onLogout}
        title="Keluar dari akun admin"
        className="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-600 transition-colors hover:bg-gray-50"
      >
        <i className="ph ph-sign-out text-lg"></i>
        Logout
      </button>
    </div>
  </header>
);

export default Header;
