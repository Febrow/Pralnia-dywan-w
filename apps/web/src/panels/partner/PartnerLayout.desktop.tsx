import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/partner/orders', label: 'Moje zlecenia' },
  { to: '/partner/intake', label: 'Dodaj zlecenie' },
];

export default function PartnerLayoutDesktop({ children }: { children: ReactNode }) {
  return <AppShell title="Pralnia · Placówka partnerska" items={NAV}>{children}</AppShell>;
}
