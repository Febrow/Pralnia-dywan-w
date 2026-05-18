import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/logistics/orders', label: 'Lista zleceń' },
  { to: '/logistics/new', label: 'Dodaj zlecenie' },
];

export default function LogisticsLayoutDesktop({ children }: { children: ReactNode }) {
  return <AppShell title="Pralnia · Logistyka" items={NAV}>{children}</AppShell>;
}
