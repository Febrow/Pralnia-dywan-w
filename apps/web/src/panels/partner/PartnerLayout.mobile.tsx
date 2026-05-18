import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/partner/orders', label: 'Zlecenia' },
  { to: '/partner/intake', label: 'Dodaj' },
];

export default function PartnerLayoutMobile({ children }: { children: ReactNode }) {
  return <AppShell title="Partner" items={NAV}>{children}</AppShell>;
}
