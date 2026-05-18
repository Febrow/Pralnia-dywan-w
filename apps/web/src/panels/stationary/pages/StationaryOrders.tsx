import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../../lib/api';
import OrdersList from '../../../components/OrdersList';

export default function StationaryOrders() {
  const [q, setQ] = useState('');
  const orders = useQuery({
    queryKey: ['orders', q],
    queryFn: () => api<any[]>(`/orders${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold flex-1">Zlecenia placówki</h1>
        <Link to="/stationary/intake" className="bg-brand-700 text-white rounded-lg px-3 py-2">+ Dodaj zlecenie</Link>
        <Link to="/stationary/accept-from-driver" className="border rounded-lg px-3 py-2">Przyjmij od kierowcy</Link>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Znajdź zlecenie (numer, klient, kod QR…)" className="w-full max-w-lg border rounded-lg px-3 py-2" />
      {orders.isLoading ? <div>Ładowanie…</div> : <OrdersList orders={orders.data ?? []} basePath="/stationary" />}
    </div>
  );
}
