import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/branch/orders', label: 'Zlecenia' },
  { to: '/branch/intake', label: 'Dodaj' },
];

export default function BranchLayoutMobile({ children }: { children: ReactNode }) {
  return <AppShell title="Placówka" items={NAV}>{children}</AppShell>;
}
