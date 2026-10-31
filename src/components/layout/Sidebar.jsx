import { VIEW_ITEMS } from '../../data/constants.js';

const Sidebar = ({ currentView, onNavigate, admin, onLogout, mobileOpen }) => (
  <nav
    className="sidebar"
    style={{
      // On mobile: slide in/out; on ≥lg the CSS always shows it (transform:none via media query)
      transform: mobileOpen ? 'translateX(0)' : undefined,
    }}
  >
    {/* ── Brand ── */}
    <div className="sidebar-brand">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md"
          style={{ background: 'var(--brand)' }}
        >
          <i className="ph ph-waves text-white text-base" />
        </span>
        <div>
          <div
            className="text-sm font-bold tracking-wide leading-tight"
            style={{ color: '#fff' }}
          >
            Filoxenia
          </div>
          <div className="text-[10px]" style={{ color: 'var(--sidebar-muted)' }}>
            Inventory &amp; Pre-order
          </div>
        </div>
      </div>
    </div>

    {/* ── Section label ── */}
    <p
      className="mb-1 mt-2 px-4 text-[9px] font-bold uppercase tracking-widest"
      style={{ color: 'var(--sidebar-muted)' }}
    >
      Menu
    </p>

    {/* ── Nav items ── */}
    <ul className="sidebar-nav">
      {VIEW_ITEMS.map((item) => {
        const active = currentView === item.value;
        return (
          <li key={item.value}>
            <a
              href={`#/${item.value}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.value);
              }}
              aria-current={active ? 'page' : undefined}
              className={active ? 'active' : ''}
            >
              <span className="nav-icon">
                <i className={`ph ${item.icon}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block text-sm font-semibold leading-tight"
                  style={{ color: active ? '#fff' : 'var(--sidebar-text)' }}
                >
                  {item.label}
                </span>
                <span
                  className="block mt-0.5 text-[10px] truncate"
                  style={{ color: active ? 'rgba(255,255,255,0.6)' : 'var(--sidebar-muted)' }}
                >
                  {item.description}
                </span>
              </span>
              {active && (
                <i
                  className="ph ph-caret-right text-xs shrink-0"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                />
              )}
            </a>
          </li>
        );
      })}
    </ul>

    {/* ── User footer ── */}
    {admin && (
      <div
        className="mt-auto pt-4 pb-3 mx-3"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        <div
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 mb-1"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
            style={{ background: 'var(--brand)' }}
          >
            {(admin.username ?? 'A')[0].toUpperCase()}
          </span>
          <div className="min-w-0">
            <p
              className="truncate text-sm font-semibold leading-tight"
              style={{ color: '#fff' }}
            >
              {admin.username ?? 'Admin'}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--sidebar-muted)' }}>
              Administrator
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all"
          style={{ color: 'var(--sidebar-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--sidebar-muted)';
          }}
        >
          <i className="ph ph-sign-out text-base" />
          Logout
        </button>
      </div>
    )}
  </nav>
);

export default Sidebar;