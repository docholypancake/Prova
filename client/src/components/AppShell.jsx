import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

/* ── Inline SVG icons (named functions — avoids <Variable /> call pattern) ─ */
function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem' }}>
      <rect x="3"  y="3"  width="7" height="7" rx="1.5" />
      <rect x="14" y="3"  width="7" height="7" rx="1.5" />
      <rect x="3"  y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem' }}>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-7 4 3.5 4-5.5" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem' }}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem' }}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem' }}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

/* ── NavItem ──────────────────────────────────────────────── */
function NavItem({ to, icon, active, children }) {
  return (
    <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
      <span className="nav-item-icon">{icon}</span>
      {children}
    </Link>
  );
}

/* ── AppShell ─────────────────────────────────────────────── */
export default function AppShell({ children, breadcrumb }) {
  const { user, logout } = useAuth();
  const navigate        = useNavigate();
  const location        = useLocation();
  const { id: projectId } = useParams();

  const isAt = (path) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="logo-mark">
              <IconCheck />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-app">Prova</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">Workspace</span>
          <NavItem to="/dashboard" icon={<IconGrid />} active={isAt('/dashboard')}>
            Projects
          </NavItem>

          {projectId && (
            <>
              <span className="nav-section-label" style={{ marginTop: '1rem' }}>Project</span>
              <NavItem
                to={`/projects/${projectId}/dashboard`}
                icon={<IconChart />}
                active={isAt(`/projects/${projectId}/dashboard`)}
              >
                Overview
              </NavItem>
              <NavItem
                to={`/projects/${projectId}`}
                icon={<IconClipboard />}
                active={isAt(`/projects/${projectId}`)}
              >
                Test Cases
              </NavItem>
              <NavItem
                to={`/projects/${projectId}/runs`}
                icon={<IconPlay />}
                active={isAt(`/projects/${projectId}/runs`)}
              >
                Test Runs
              </NavItem>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <ThemeToggle />
          <NotificationBell />
          {user?.avatar && (
            <img
              src={user.avatar}
              alt=""
              className="h-7 w-7 rounded-full ring-1 ring-[var(--border)]"
            />
          )}
          <button
            onClick={async () => { await logout(); navigate('/'); }}
            className="ml-auto text-xs font-medium text-muted transition-colors hover:text-app"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top strip */}
        <header className="topbar-inner">
          <nav className="flex min-w-0 items-center gap-1.5 text-sm">
            <Link to="/dashboard"
              className="shrink-0 font-medium text-muted transition-colors hover:text-app">
              Projects
            </Link>
            {breadcrumb && (
              <>
                <span className="text-[var(--border)]">/</span>
                <span className="truncate font-semibold text-app">{breadcrumb}</span>
              </>
            )}
          </nav>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-8 py-8">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
