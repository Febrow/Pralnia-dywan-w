import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { STATUS_LABELS_PL } from '../../../lib/statuses';

interface Stats { today: any; week: any; month: any; byStatus: { currentStatus: string; _count: { _all: number } }[]; readyForPickup: number; readyForDelivery: number; inDelivery: number }

export default function OwnerDashboard() {
  const stats = useQuery({ queryKey: ['stats', 'dashboard'], queryFn: () => api<Stats>('/statistics/dashboard') });

  if (stats.isLoading) return <div>Ładowanie…</div>;
  if (!stats.data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pulpit</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Tile title="Dziś" data={stats.data.today} />
        <Tile title="Bieżący tydzień" data={stats.data.week} />
        <Tile title="Bieżący miesiąc" data={stats.data.month} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Quick label="Gotowe do wydania" value={stats.data.readyForPickup} />
        <Quick label="Gotowe do doręczenia" value={stats.data.readyForDelivery} />
        <Quick label="W doręczeniu" value={stats.data.inDelivery} />
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Dywany według statusów</h2>
        <ul className="grid md:grid-cols-2 gap-2 text-sm">
          {stats.data.byStatus.map((s) => (
            <li key={s.currentStatus} className="flex justify-between border-b py-1">
              <span>{STATUS_LABELS_PL[s.currentStatus] ?? s.currentStatus}</span>
              <span className="font-semibold">{s._count._all}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Tile({ title, data }: { title: string; data: { orders: number; rugs: number; area: number; value: number } }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-sm text-slate-500 uppercase">{title}</div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
        <div><div className="text-slate-500 text-xs">Zlecenia</div><div className="text-xl font-bold">{data.orders}</div></div>
        <div><div className="text-slate-500 text-xs">Dywany</div><div className="text-xl font-bold">{data.rugs}</div></div>
        <div><div className="text-slate-500 text-xs">Powierzchnia</div><div className="text-xl font-bold">{data.area} m²</div></div>
        <div><div className="text-slate-500 text-xs">Wartość brutto</div><div className="text-xl font-bold">{data.value.toFixed(2)} zł</div></div>
      </div>
    </div>
  );
}

function Quick({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border p-4 text-center">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-3xl font-bold text-brand-700">{value}</div>
    </div>
  );
}
