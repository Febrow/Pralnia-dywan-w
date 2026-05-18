import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { STATUS_LABELS_PL } from '../../../lib/statuses';

export default function OwnerRugs() {
  const [status, setStatus] = useState('');
  const rugs = useQuery({ queryKey: ['rugs', status], queryFn: () => api<any[]>(`/rugs${status ? `?status=${status}` : ''}`) });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dywany</h1>
      <select className="border rounded-lg px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Wszystkie statusy</option>
        {Object.entries(STATUS_LABELS_PL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <div className="orders-list">
        <table>
          <thead><tr><th>Kod QR</th><th>Zlecenie</th><th>Pakiet</th><th>Powierzchnia</th><th>Cena</th><th>Status</th></tr></thead>
          <tbody>
            {(rugs.data ?? []).map((r) => (
              <tr key={r.id}>
                <td className="font-mono">{r.qrCode}</td>
                <td className="order-number">{r.order.number}</td>
                <td>{r.package?.name ?? '—'}</td>
                <td>{r.areaM2 != null ? `${r.areaM2.toFixed(2)} m²` : '—'}</td>
                <td>{r.totalPrice != null ? `${r.totalPrice.toFixed(2)} zł` : '—'}</td>
                <td><span className="badge">{STATUS_LABELS_PL[r.currentStatus] ?? r.currentStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
