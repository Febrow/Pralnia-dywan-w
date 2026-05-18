import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/owner', label: 'Pulpit' },
  { to: '/owner/orders', label: 'Zlecenia' },
  { to: '/owner/rugs', label: 'Dywany' },
  { to: '/owner/drivers', label: 'Kierowcy' },
  { to: '/owner/partners', label: 'Placówki partnerskie' },
  { to: '/owner/branches', label: 'Placówki' },
  { to: '/owner/users', label: 'Użytkownicy' },
  { to: '/owner/packages', label: 'Pakiety' },
  { to: '/owner/qr-pool', label: 'Pula QR' },
  { to: '/owner/settings', label: 'Ustawienia' },
];

export default function OwnerLayoutDesktop({ children }: { children: ReactNode }) {
  return <AppShell title="Pralnia · Właściciel" items={NAV}>{children}</AppShell>;
}
