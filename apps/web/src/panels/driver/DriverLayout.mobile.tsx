// Panel kierowcy istnieje WYŁĄCZNIE w wersji mobilnej.
// Na desktopie wyświetlamy zastępczą informację (DriverNotAvailableOnDesktop).
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

const NAV = [
  { to: '/driver', label: 'Start' },
  { to: '/driver/pickups', label: 'Odbiory' },
  { to: '/driver/deliveries', label: 'Doręczenia' },
  { to: '/driver/scan', label: 'Skanuj' },
  { to: '/driver/new-order', label: 'Nowe zlecenie' },
  { to: '/driver/cash', label: 'Rozliczenie' },
];

export default function DriverLayoutMobile({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-900 text-white px-4 py-3 flex justify-between items-center">
        <div className="font-bold">Kierowca</div>
        <button onClick={logout} className="text-xs">Wyloguj</button>
      </header>
      <div className="text-xs text-slate-500 px-4 py-2">{user ? `${user.firstName} ${user.lastName}` : ''}</div>
      <main className="flex-1 px-4 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex overflow-x-auto">
        {NAV.map((n) => {
          const active = loc.pathname === n.to || (n.to !== '/driver' && loc.pathname.startsWith(n.to));
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex-1 text-center py-3 text-xs whitespace-nowrap ${active ? 'text-brand-700 font-semibold' : 'text-slate-500'}`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
