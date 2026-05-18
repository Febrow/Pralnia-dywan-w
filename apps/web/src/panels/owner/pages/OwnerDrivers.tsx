import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export default function OwnerDrivers() {
  const drivers = useQuery({ queryKey: ['drivers-today'], queryFn: () => api<any[]>('/statistics/drivers-today') });
  const settlements = useQuery({ queryKey: ['settlements'], queryFn: () => api<any[]>('/settlements') });
  const qc = useQueryClient();

  const settle = useMutation({
    mutationFn: (id: string) => api(`/settlements/${id}/settle`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settlements'] });
      qc.invalidateQueries({ queryKey: ['drivers-today'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-3">Kierowcy — dziś</h1>
        <div className="orders-list">
          <table>
            <thead><tr><th>Kierowca</th><th>Wydane dywany</th><th>Pobrana gotówka</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {(drivers.data ?? []).map((d) => (
                <tr key={d.id}>
                  <td>{d.firstName} {d.lastName}</td>
                  <td>{d.rugsDelivered}</td>
                  <td>{d.cash.toFixed(2)} zł</td>
                  <td><span className="badge">{d.status}</span></td>
                  <td>
                    {d.settlementId && d.status === 'PENDING' && (
                      <button onClick={() => settle.mutate(d.settlementId)} className="text-xs px-2 py-1 rounded-lg bg-emerald-600 text-white">
                        Rozlicz
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Historia rozliczeń</h2>
        <div className="orders-list">
          <table>
            <thead><tr><th>Data</th><th>Kierowca</th><th>Liczba pozycji</th><th>Łączna kwota</th><th>Status</th></tr></thead>
            <tbody>
              {(settlements.data ?? []).map((s) => (
                <tr key={s.id}>
                  <td>{s.day}</td>
                  <td>{s.driver?.firstName} {s.driver?.lastName}</td>
                  <td>{s.items.length}</td>
                  <td>{s.totalCashCollected.toFixed(2)} zł</td>
                  <td><span className="badge">{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
