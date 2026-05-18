import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import QrScanner from '../../../components/QrScanner';
import { api } from '../../../lib/api';
import { STATUS_LABELS_PL } from '../../../lib/statuses';

const STATUSES = [
  'WASHING', 'IMPREGNATION', 'MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL',
  'FRINGE_CLEANING', 'FOIL_PACKING', 'OZONATION', 'DRYING',
  'READY_FOR_PICKUP', 'READY_FOR_DELIVERY',
];

export default function WashingScan() {
  const [rug, setRug] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const setStatus = useMutation({
    mutationFn: ({ rugId, toStatus }: any) => api(`/rugs/${rugId}/status`, { method: 'POST', body: JSON.stringify({ toStatus }) }),
    onSuccess: async () => {
      if (rug) {
        const refreshed = await api<any>(`/rugs/by-qr/${rug.qrCode}`);
        setRug(refreshed);
      }
    },
    onError: (e: any) => setError(e.message),
  });

  async function onCode(code: string) {
    setError(null);
    try {
      const data = await api<any>(`/rugs/by-qr/${encodeURIComponent(code)}`);
      setRug(data);
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Skan dywanu</h1>
      {!rug && <QrScanner onResult={onCode} />}
      {error && <div className="text-red-600">{error}</div>}
      {rug && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-xs text-slate-500">Zlecenie</div>
              <div className="font-semibold">{rug.order.number}</div>
              <div className="text-xs text-slate-500 mt-1">QR: <span className="font-mono">{rug.qrCode}</span></div>
            </div>
            <span className="badge">{STATUS_LABELS_PL[rug.currentStatus]}</span>
          </div>
          <div className="text-sm">
            Pakiet: <strong>{rug.package?.name ?? '—'}</strong> · {rug.areaM2 != null ? `${rug.areaM2.toFixed(2)} m²` : '—'}
          </div>
          {rug.notes && <div className="text-sm">Notatka: {rug.notes}</div>}
          <div>
            <div className="text-xs text-slate-500 mb-1">Inne dywany w tym zleceniu:</div>
            <ul className="text-xs font-mono space-y-0.5">
              {rug.order.rugs.filter((r: any) => r.id !== rug.id).map((r: any) => (
                <li key={r.id}>{r.qrCode} — {STATUS_LABELS_PL[r.currentStatus]}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatus.mutate({ rugId: rug.id, toStatus: s })} className="px-3 py-1.5 text-sm rounded-lg bg-brand-50 border border-brand-200 hover:bg-brand-100">
                {STATUS_LABELS_PL[s]}
              </button>
            ))}
          </div>
          <button onClick={() => setRug(null)} className="text-sm text-slate-500 underline">Skanuj kolejny</button>
        </div>
      )}
    </div>
  );
}
