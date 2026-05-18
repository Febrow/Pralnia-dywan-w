import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/washing', label: 'Start' },
  { to: '/washing/scan', label: 'Skanuj' },
  { to: '/washing/serial', label: 'Seryjne' },
];

export default function WashingLayoutMobile({ children }: { children: ReactNode }) {
  return <AppShell title="Pralnia · Pranie" items={NAV}>{children}</AppShell>;
}
