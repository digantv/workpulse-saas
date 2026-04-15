import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navLinkClass = ({ isActive }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ease-out',
    isActive
      ? 'bg-brand-600 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-brand-50/20 to-slate-100">
      <header className="border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Attendance
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Employee Portal
            </h1>
          </div>
          <nav
            className="flex flex-wrap items-center gap-1 sm:gap-2"
            aria-label="Primary navigation"
          >
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/timesheet" className={navLinkClass}>
              Timesheet
            </NavLink>
            <NavLink to="/leaves" className={navLinkClass}>
              Leave
            </NavLink>
            <button
              type="button"
              onClick={() => logout()}
              className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors duration-200 ease-out hover:bg-slate-100 hover:text-slate-800"
            >
              Sign out
            </button>
          </nav>
        </div>
        {user && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-right text-sm text-slate-600">
            Signed in as{' '}
            <span className="font-medium text-slate-900">{user.full_name}</span>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
