// Panel kierowcy — TYLKO mobile.
// Belka u góry: logo + napis "Kierowca · Imię Nazwisko" + wyloguj.
// Pod belką: dynamiczna treść (siatka kafelków na ekranie startowym, listy itp.)
// Dół ekranu: dolny pasek nawigacji z 5 kafelkami.
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import BrandLogo from '../../components/BrandLogo';

const NAV: { to: string; label: string; icon: string }[] = [
  { to: '/driver',             label: 'Start',       icon: '🏠' },
  { to: '/driver/pickups',     label: 'Odbiory',     icon: '⬆️' },
  { to: '/driver/deliveries',  label: 'Doręczenia',  icon: '⬇️' },
  { to: '/driver/scan',        label: 'Skanuj',      icon: '🔳' },
  { to: '/driver/cash',        label: 'Kasa',        icon: '💰' },
];

export default function DriverLayoutMobile({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <div className="min-h-screen flex flex-col bg-brand-50">
      {/* Belka górna — granat + żółta linia akcentu pod spodem */}
      <header className="app-bar-brand sticky top-0 z-20 shadow-tile">
        <div className="flex items-center justify-between px-4 py-3">
          <BrandLogo variant="light" size={28} />
          <button
            onClick={logout}
            className="text-xs font-semibold bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-full px-3 py-1.5"
          >
            Wyloguj
          </button>
        </div>
        {/* Belka z nazwą roli + imię/nazwisko */}
        <div className="bg-ink/30 backdrop-blur px-4 py-2 flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest font-bold bg-accent text-ink px-2 py-0.5 rounded">
            Kierowca
          </span>
          <span className="text-white font-semibold">{fullName}</span>
        </div>
      </header>

      {/* Treść */}
      <main className="flex-1 px-4 pt-4 pb-28 max-w-screen-md mx-auto w-full">
        {children}
      </main>

      {/* Dolny pasek nawigacji */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brand-100 shadow-[0_-8px_24px_-12px_rgba(0,25,20,0.25)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex max-w-screen-md mx-auto">
          {NAV.map((n) => {
            const active =
              loc.pathname === n.to || (n.to !== '/driver' && loc.pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ' +
                  (active ? 'text-brand' : 'text-ink/60 hover:text-brand')
                }
              >
                <span className="text-xl leading-none">{n.icon}</span>
                <span>{n.label}</span>
                {active && <span className="block w-6 h-1 mt-0.5 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
