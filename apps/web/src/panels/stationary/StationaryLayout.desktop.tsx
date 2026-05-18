import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/stationary/orders', label: 'Lista zleceń' },
  { to: '/stationary/intake', label: 'Dodaj zlecenie' },
  { to: '/stationary/accept-from-driver', label: 'Przyjmij od kierowcy' },
];

export default function StationaryLayoutDesktop({ children }: { children: ReactNode }) {
  return <AppShell title="Pralnia · Placówka" items={NAV}>{children}</AppShell>;
}
