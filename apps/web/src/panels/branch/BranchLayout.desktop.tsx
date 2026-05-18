import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/branch/orders', label: 'Moje zlecenia' },
  { to: '/branch/intake', label: 'Dodaj zlecenie' },
];

export default function BranchLayoutDesktop({ children }: { children: ReactNode }) {
  return <AppShell title="Pralnia · Placówka sieci" items={NAV}>{children}</AppShell>;
}
