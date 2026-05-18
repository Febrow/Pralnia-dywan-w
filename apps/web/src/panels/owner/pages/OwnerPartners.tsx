import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export default function OwnerPartners() {
  const partners = useQuery({ queryKey: ['partners-month'], queryFn: () => api<any[]>('/statistics/partners-month') });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Placówki partnerskie — bieżący miesiąc</h1>
      <div className="orders-list">
        <table>
          <thead><tr><th>Placówka</th><th>Zlecenia</th><th>Dywany</th><th>Powierzchnia</th><th>Wartość (cennik partnerski)</th></tr></thead>
          <tbody>
            {(partners.data ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.orders}</td>
                <td>{p.rugs}</td>
                <td>{p.area} m²</td>
                <td>{p.value.toFixed(2)} zł</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
