import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { STATUS_LABELS_PL } from '../../../lib/statuses';

export default function OwnerPackages() {
  const pkgs = useQuery({ queryKey: ['packages'], queryFn: () => api<any[]>('/packages') });
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: ({ id, ...data }: any) => api(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pakiety</h1>
      <div className="space-y-3">
        {(pkgs.data ?? []).map((p) => (
          <div key={p.id} className="bg-white rounded-xl border p-4">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <input
                type="number"
                step="0.01"
                defaultValue={p.pricePerM2}
                className="border rounded-lg px-2 py-1 w-32"
                onBlur={(e) => update.mutate({ id: p.id, pricePerM2: Number(e.target.value) })}
              />
              <span className="text-sm text-slate-500">zł / m²</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">Wymagane etapy:</div>
            <div className="text-sm">
              {p.requiredSteps.map((s: any) => STATUS_LABELS_PL[s.status] ?? s.status).join(' · ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
