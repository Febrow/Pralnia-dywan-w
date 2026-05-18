import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export default function OwnerQrPool() {
  const pool = useQuery({ queryKey: ['qr-pool'], queryFn: () => api<any>('/qr-pool') });
  const qc = useQueryClient();
  const [count, setCount] = useState(100);

  const generate = useMutation({
    mutationFn: () => api('/qr-pool/generate', { method: 'POST', body: JSON.stringify({ count }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qr-pool'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pula kodów QR</h1>
      <div className="grid md:grid-cols-4 gap-4">
        <Quick label="Łącznie" value={pool.data?.total ?? 0} />
        <Quick label="Wolne" value={pool.data?.available ?? 0} />
        <Quick label="Przypisane" value={pool.data?.assigned ?? 0} />
        <Quick label="Archiwalne" value={pool.data?.archived ?? 0} />
      </div>
      <div className="bg-white rounded-xl border p-4 flex items-end gap-3">
        <label className="block">
          <span className="text-sm text-slate-600">Liczba kodów do wygenerowania</span>
          <input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} className="block mt-1 border rounded-lg px-3 py-2 w-40" />
        </label>
        <button onClick={() => generate.mutate()} className="bg-brand-700 text-white rounded-lg px-3 py-2">Generuj</button>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Przykładowe wolne kody</h2>
        <div className="font-mono text-xs grid md:grid-cols-3 gap-1">
          {(pool.data?.sample ?? []).map((c: any) => <div key={c.code}>{c.code}</div>)}
        </div>
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
