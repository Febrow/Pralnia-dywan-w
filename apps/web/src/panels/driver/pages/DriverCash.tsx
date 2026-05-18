import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export default function DriverCash() {
  const list = useQuery({
    queryKey: ['my-settlements'],
    queryFn: () => api<any[]>('/settlements/me'),
  });
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold text-brand">Moje rozliczenia</h1>
      {(list.data ?? []).map((s) => (
        <div key={s.id} className="bg-white rounded-2xl border border-brand-100 shadow-tile p-4">
          <div className="flex justify-between items-center">
            <div className="font-bold text-ink">{s.day}</div>
            <span
              className={
                'text-[11px] font-bold px-2 py-1 rounded-full ' +
                (s.status === 'SETTLED'
                  ? 'bg-accent text-ink'
                  : 'bg-brand text-white')
              }
            >
              {s.status === 'SETTLED' ? 'Rozliczone' : 'Do oddania'}
            </span>
          </div>
          <div className="text-3xl font-extrabold text-brand mt-2">
            {Number(s.totalCashCollected).toFixed(2)} zł
          </div>
          {s.items?.length > 0 && (
            <ul className="text-xs mt-3 space-y-1">
              {s.items.map((it: any) => (
                <li key={it.id} className="flex justify-between border-t border-brand-50 pt-1">
                  <span className="font-mono">{it.order?.number}</span>
                  <span className="font-bold">{Number(it.amountCollected).toFixed(2)} zł</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {(!list.data || list.data.length === 0) && (
        <div className="bg-white rounded-2xl border border-brand-100 p-6 text-center text-ink/60">
          Brak rozliczeń.
        </div>
      )}
    </div>
  );
}
