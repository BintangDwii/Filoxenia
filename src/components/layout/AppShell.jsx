import { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

const AppShell = ({
  admin,
  onLogout,
  currentView,
  onNavigate,
  pageTitle,
  pageSubtitle,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    const handleHashChange = () => setMobileOpen(false);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleSidebar = () => setMobileOpen((prev) => !prev);

  return (
    <div style={{ minHeight: '100svh', background: 'var(--page-bg)' }}>

      {/* ── Sidebar — position:fixed, slides in on mobile ── */}
      <Sidebar
        currentView={currentView}
        onNavigate={(v) => {
          onNavigate(v);
          setMobileOpen(false);
        }}
        admin={admin}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
      />

      {/* ── Mobile backdrop overlay ── */}
      {mobileOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={toggleSidebar}
          aria-label="Tutup navigasi"
        />
      )}

      {/* ── Fixed topbar (CSS .topbar handles left offset on lg) ── */}
      <Topbar
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        onToggleSidebar={toggleSidebar}
        admin={admin}
        onLogout={onLogout}
      />

      {/* ── Main content area (CSS .page-content handles padding) ── */}
      <div className="page-content">
        <div className="page-inner">
          {children}
        </div>
      </div>

    </div>
  );
};

export default AppShell;