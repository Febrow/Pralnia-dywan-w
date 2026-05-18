import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/stationary/orders', label: 'Zlecenia' },
  { to: '/stationary/intake', label: 'Dodaj' },
  { to: '/stationary/accept-from-driver', label: 'Od kierowcy' },
];

export default function StationaryLayoutMobile({ children }: { children: ReactNode }) {
  return <AppShell title="Pralnia · Placówka" items={NAV}>{children}</AppShell>;
}
