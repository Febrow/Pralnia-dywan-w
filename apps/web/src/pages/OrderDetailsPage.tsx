import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { STATUS_LABELS_PL, SOURCE_LABELS_PL } from '../lib/statuses';
import { useState } from 'react';

const ALLOWED_BY_ROLE: Record<string, string[]> = {
  OWNER: [
    'ACCEPTED_AT_CENTRAL', 'WASHING', 'IMPREGNATION', 'MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL',
    'FRINGE_CLEANING', 'FOIL_PACKING', 'OZONATION', 'DRYING',
    'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'IN_DELIVERY', 'DELIVERED', 'DELIVERED_TO_CUSTOMER',
  ],
  STATIONARY_BRANCH_WORKER: ['ACCEPTED_AT_CENTRAL', 'READY_FOR_PICKUP', 'DELIVERED'],
  WASHING_WORKER: [
    'WASHING', 'IMPREGNATION', 'MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL',
    'FRINGE_CLEANING', 'FOIL_PACKING', 'OZONATION', 'DRYING',
    'READY_FOR_PICKUP', 'READY_FOR_DELIVERY',
  ],
  DRIVER: ['IN_DELIVERY', 'DELIVERED_TO_CUSTOMER', 'PICKED_UP_FROM_CUSTOMER', 'PICKED_UP_FROM_PARTNER'],
  LOGISTICS: [],
  PARTNER_BRANCH: ['DELIVERED'],
  STATIONARY_BRANCH: ['DELIVERED'],
};

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [edit, setEdit] = useState<{ rugId: string; widthCm: number; heightCm: number; packageId: string } | null>(null);

  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => api<any>(`/orders/${id}`),
    enabled: !!id,
  });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => api<any[]>('/packages') });

  const setStatus = useMutation({
    mutationFn: ({ rugId, toStatus }: { rugId: string; toStatus: string }) =>
      api(`/rugs/${rugId}/status`, { method: 'POST', body: JSON.stringify({ toStatus }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
  });

  const measure = useMutation({
    mutationFn: (data: any) => api(`/rugs/${data.rugId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      setEdit(null);
    },
  });

  if (order.isLoading) return <div>Ładowanie…</div>;
  if (!order.data) return <div>Nie znaleziono zlecenia.</div>;

  const o = order.data;
  const allowedStatuses = ALLOWED_BY_ROLE[user!.role] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold">{o.number}</h1>
        <span className="badge">{SOURCE_LABELS_PL[o.source] ?? o.source}</span>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-slate-500 text-xs uppercase">Klient</div>
            <div>{o.customer.firstName} {o.customer.lastName}</div>
            <div>{o.customer.phone}</div>
            <div>{o.customer.email}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs uppercase">Adres odbioru</div>
            <Address json={o.pickupAddress} />
          </div>
          <div>
            <div className="text-slate-500 text-xs uppercase">Adres doręczenia</div>
            <Address json={o.deliveryAddress} />
          </div>
        </div>
        <div className="mt-4 text-sm">
          Łącznie: <strong>{o.rugs.length}</strong> dyw. · <strong>{o.totalAreaM2.toFixed(2)}</strong> m² ·{' '}
          <strong>{o.totalGrossPrice.toFixed(2)}</strong> zł brutto
        </div>
      </div>

      <div className="space-y-3">
        {o.rugs.map((r: any) => (
          <div key={r.id} className="bg-white rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-mono text-slate-700">{r.qrCode}</div>
                <div className="text-xs text-slate-500">
                  Pakiet: {r.package?.name ?? '—'} · {r.areaM2 != null ? `${r.areaM2.toFixed(2)} m²` : 'brak pomiaru'} ·{' '}
                  {r.totalPrice != null ? `${r.totalPrice.toFixed(2)} zł` : '—'}
                </div>
              </div>
              <span className="badge">{STATUS_LABELS_PL[r.currentStatus] ?? r.currentStatus}</span>
            </div>
            {r.notes && <div className="mt-2 text-sm text-slate-600">Notatka: {r.notes}</div>}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                className="px-3 py-1 text-xs rounded-lg border"
                onClick={() =>
                  setEdit({
                    rugId: r.id,
                    widthCm: r.widthCm ?? 0,
                    heightCm: r.heightCm ?? 0,
                    packageId: r.packageId ?? '',
                  })
                }
              >
                Edytuj pomiar / pakiet
              </button>
              {allowedStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus.mutate({ rugId: r.id, toStatus: s })}
                  className="px-2 py-1 text-xs rounded-lg bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-800"
                >
                  → {STATUS_LABELS_PL[s] ?? s}
                </button>
              ))}
            </div>
            {edit && edit.rugId === r.id && (
              <div className="mt-3 grid md:grid-cols-4 gap-2 items-end bg-slate-50 p-3 rounded-lg">
                <label className="block text-xs">
                  Szerokość (cm)
                  <input
                    type="number"
                    value={edit.widthCm}
                    onChange={(e) => setEdit({ ...edit, widthCm: Number(e.target.value) })}
                    className="mt-1 w-full border rounded-lg px-2 py-1.5"
                  />
                </label>
                <label className="block text-xs">
                  Długość (cm)
                  <input
                    type="number"
                    value={edit.heightCm}
                    onChange={(e) => setEdit({ ...edit, heightCm: Number(e.target.value) })}
                    className="mt-1 w-full border rounded-lg px-2 py-1.5"
                  />
                </label>
                <label className="block text-xs">
                  Pakiet
                  <select
                    value={edit.packageId}
                    onChange={(e) => setEdit({ ...edit, packageId: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-2 py-1.5"
                  >
                    <option value="">— wybierz —</option>
                    {packages.data?.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.pricePerM2} zł/m²)
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="bg-brand-700 text-white rounded-lg px-3 py-1.5 text-sm"
                  onClick={() => measure.mutate(edit)}
                >
                  Zapisz
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Address({ json }: { json: string | null }) {
  if (!json) return <div className="text-slate-400">—</div>;
  let a: any;
  try { a = JSON.parse(json); } catch { return <div>{json}</div>; }
  return (
    <div className="text-sm">
      {a.street} {a.houseNo}{a.apartmentNo ? `/${a.apartmentNo}` : ''}<br />
      {a.postalCode} {a.city}
    </div>
  );
}
