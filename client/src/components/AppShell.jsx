import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

// Persistent app shell — top bar present on every authenticated page so
// home, theme toggle, and logout are always reachable.
export default function AppShell({ children, title, breadcrumb }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-bg min-h-screen">
      <header className="topbar">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          {/* Left: logo (→ home) + breadcrumb */}
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/dashboard" className="flex shrink-0 items-center gap-2" aria-label="Home">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-clay-500 to-olive-500 text-white shadow">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="3.2">
                  <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-base font-bold tracking-tight text-app">Prova</span>
            </Link>
            {breadcrumb && (
              <div className="flex min-w-0 items-center gap-2 text-sm text-muted">
                <span>/</span>
                <span className="truncate">{breadcrumb}</span>
              </div>
            )}
          </div>

          {/* Right: notifications, theme, avatar, logout — always present */}
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            {user?.avatar && (
              <img src={user.avatar} alt="" className="h-8 w-8 rounded-full ring-1 ring-[var(--border)]" />
            )}
            <button
              onClick={async () => { await logout(); navigate('/'); }}
              className="btn btn-ghost"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {title && (
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <h1 className="text-2xl font-bold tracking-tight text-app">{title}</h1>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
