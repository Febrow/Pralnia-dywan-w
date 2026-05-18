import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ROLE_LABELS_PL } from '../lib/statuses';

interface NavItem { to: string; label: string; icon?: string }

export default function AppShell({ title, items, children }: { title: string; items: NavItem[]; children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-64 bg-brand-900 text-brand-50 md:min-h-screen p-4 md:p-6">
        <div className="font-bold text-lg">{title}</div>
        <div className="text-xs text-brand-200 mb-4">{user ? `${user.firstName} ${user.lastName} · ${ROLE_LABELS_PL[user.role]}` : ''}</div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          {items.map((it) => {
            const active = location.pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to} className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm ${active ? 'bg-brand-700' : 'hover:bg-brand-800'}`}>
                {it.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className="hidden md:block mt-6 text-xs text-brand-200 hover:text-white">Wyloguj</button>
      </aside>
      <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full">{children}</main>
      <button onClick={logout} className="md:hidden fixed bottom-4 right-4 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-full shadow">Wyloguj</button>
    </div>
  );
}
