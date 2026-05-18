import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export default function DriverCash() {
  const list = useQuery({ queryKey: ['my-settlements'], queryFn: () => api<any[]>('/settlements/me') });
  return (
    <div className="space-y-3 mt-3">
      <h1 className="text-xl font-bold">Moje rozliczenia</h1>
      {(list.data ?? []).map((s) => (
        <div key={s.id} className="bg-white rounded-xl border p-3">
          <div className="flex justify-between">
            <div className="font-semibold">{s.day}</div>
            <span className="badge">{s.status}</span>
          </div>
          <div className="text-2xl font-bold text-brand-700 mt-1">{s.totalCashCollected.toFixed(2)} zł</div>
          <ul className="text-xs mt-2 space-y-0.5">
            {s.items.map((it: any) => (
              <li key={it.id}>{it.order.number} · {it.amountCollected.toFixed(2)} zł</li>
            ))}
          </ul>
        </div>
      ))}
      {(!list.data || list.data.length === 0) && <div className="text-slate-500">Brak rozliczeń.</div>}
    </div>
  );
}
