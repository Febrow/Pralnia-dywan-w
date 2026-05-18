import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import OrdersList from '../../../components/OrdersList';

export default function OwnerOrders() {
  const [q, setQ] = useState('');
  const orders = useQuery({
    queryKey: ['orders', q],
    queryFn: () => api<any[]>(`/orders${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold">Zlecenia</h1>
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Szukaj: numer, klient, telefon, e-mail, kod QR…"
        className="w-full max-w-lg border rounded-lg px-3 py-2"
      />
      {orders.isLoading ? <div>Ładowanie…</div> : <OrdersList orders={orders.data ?? []} basePath="/owner" />}
    </div>
  );
}
