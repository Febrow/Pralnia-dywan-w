import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../../lib/api';
import OrdersList from '../../../components/OrdersList';

export default function LogisticsOrders() {
  const [q, setQ] = useState('');
  const orders = useQuery({
    queryKey: ['logistics-orders', q],
    queryFn: () => api<any[]>(`/orders${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold flex-1">Zlecenia</h1>
        <Link to="/logistics/new" className="bg-brand-700 text-white rounded-lg px-3 py-2">+ Dodaj zlecenie</Link>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj…" className="w-full max-w-lg border rounded-lg px-3 py-2" />
      {orders.isLoading ? <div>Ładowanie…</div> : <OrdersList orders={orders.data ?? []} basePath="/logistics" />}
    </div>
  );
}
