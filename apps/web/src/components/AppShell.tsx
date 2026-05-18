import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ROLE_LABELS_PL } from '../lib/statuses';
import BrandLogo from './BrandLogo';

interface NavItem { to: string; label: string }

export default function AppShell({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const role = user ? ROLE_LABELS_PL[user.role] ?? user.role : '';
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-50">
      <aside className="md:w-64 bg-brand text-white md:min-h-screen p-4 md:p-6 shadow-tile">
        <BrandLogo variant="light" size={28} className="mb-1" />
        <div className="text-xs text-brand-100 font-semibold uppercase tracking-widest">{title}</div>
        {user && (
          <div className="text-[11px] text-brand-100 mt-1 mb-4">
            <span className="bg-accent text-ink px-1.5 py-0.5 rounded font-bold mr-1">
              {role}
            </span>
            <span>{user.firstName} {user.lastName}</span>
          </div>
        )}
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          {items.map((it) => {
            const active = location.pathname === it.to || (it.to !== '/' && location.pathname.startsWith(it.to));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={
                  'px-3 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition ' +
                  (active
                    ? 'bg-white text-brand shadow-tile'
                    : 'text-white/80 hover:text-white hover:bg-white/10')
                }
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="hidden md:block mt-6 text-xs text-brand-100 hover:text-accent"
        >
          Wyloguj
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full">{children}</main>
      <button
        onClick={logout}
        className="md:hidden fixed bottom-4 right-4 text-xs bg-ink text-white px-3 py-1.5 rounded-full shadow-tile"
      >
        Wyloguj
      </button>
    </div>
  );
}
