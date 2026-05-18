import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/owner', label: 'Pulpit' },
  { to: '/owner/orders', label: 'Zlecenia' },
  { to: '/owner/drivers', label: 'Kierowcy' },
  { to: '/owner/partners', label: 'Partnerzy' },
  { to: '/owner/settings', label: 'Ustawienia' },
];

export default function OwnerLayoutMobile({ children }: { children: ReactNode }) {
  // Wersja mobilna pokazuje skrócone menu — pełna konfiguracja jest na desktopie.
  return <AppShell title="Pralnia · Właściciel" items={NAV}>{children}</AppShell>;
}
