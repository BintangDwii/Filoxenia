import { VIEW_ITEMS } from '../../data/constants.js';
import { useState } from 'react';
import Logo from '../Logo';

const Topbar = ({ pageTitle, pageSubtitle, onToggleSidebar, admin, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
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
            <Logo width={20} height={20} />
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
            Filoxenia
          </span>
        </div>
      </div>

      {/* Desktop page title */}
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
    </header>
  );
};

export default Topbar;