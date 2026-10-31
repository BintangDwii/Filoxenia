const Topbar = ({ pageTitle, pageSubtitle, onToggleSidebar, admin, onLogout }) => (
  <header className="topbar">
    {/* Left side */}
    <div className="flex items-center gap-3">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="lg:hidden rounded-lg p-2 transition-colors"
        style={{ color: 'var(--muted)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--page-bg)';
          e.currentTarget.style.color = 'var(--ink)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--muted)';
        }}
        aria-label="Buka navigasi"
      >
        <i className="ph ph-list text-xl" />
      </button>

      {/* Mobile brand logo (hidden on desktop) */}
      <div className="flex lg:hidden items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg shadow-sm"
          style={{ background: 'var(--brand)' }}
        >
          <i className="ph ph-waves text-white text-sm" />
        </span>
        <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
          Filoxenia
        </span>
      </div>

      {/* Desktop page breadcrumb */}
      {pageTitle && (
        <div className="hidden lg:block">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {pageSubtitle}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Right side */}
    <div className="flex items-center gap-2">
      {/* DB badge */}
      <span
        className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
        style={{
          background: 'var(--brand-light)',
          color: 'var(--brand-dark)',
        }}
      >
        <i className="ph ph-database text-xs" />
        Database
      </span>

      {/* User chip */}
      {admin && (
        <div
          className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--ink-2)',
          }}
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-white text-[9px] font-bold"
            style={{ background: 'var(--brand)' }}
          >
            {(admin.username ?? 'A')[0].toUpperCase()}
          </span>
          {admin.username ?? 'Admin'}
        </div>
      )}

      {/* Logout */}
      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--ink-2)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--danger)';
          e.currentTarget.style.color = 'var(--danger)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--ink-2)';
        }}
      >
        <i className="ph ph-sign-out text-base" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  </header>
);

export default Topbar;