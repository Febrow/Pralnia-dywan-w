import { ReactNode } from 'react';
import AppShell from '../../components/AppShell';

const NAV = [
  { to: '/washing', label: 'Start' },
  { to: '/washing/scan', label: 'Skanuj dywan' },
  { to: '/washing/serial', label: 'Seryjne skanowanie' },
];

export default function WashingLayoutDesktop({ children }: { children: ReactNode }) {
  return <AppShell title="Pralnia · Pranie" items={NAV}>{children}</AppShell>;
}
