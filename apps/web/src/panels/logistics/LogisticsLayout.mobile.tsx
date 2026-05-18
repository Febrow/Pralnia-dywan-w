import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/logistics/orders', label: 'Zlecenia' },
  { to: '/logistics/new', label: 'Nowe' },
];

export default function LogisticsLayoutMobile({ children }: { children: ReactNode }) {
  return <AppShell title="Logistyka" items={NAV}>{children}</AppShell>;
}
