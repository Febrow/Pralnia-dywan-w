import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export default function OwnerBranches() {
  const branches = useQuery({ queryKey: ['branches'], queryFn: () => api<any[]>('/branches') });
  const qc = useQueryClient();

  const [type, setType] = useState<'STATIONARY' | 'PARTNER'>('STATIONARY');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  const create = useMutation({
    mutationFn: (data: any) => api('/branches', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); setName(''); setCity(''); setAddress(''); },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ type, name, city, address });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Placówki</h1>
      <form onSubmit={submit} className="bg-white rounded-xl border p-4 grid md:grid-cols-5 gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as any)} className="border rounded-lg px-3 py-2">
          <option value="STATIONARY">Stacjonarna</option>
          <option value="PARTNER">Partnerska</option>
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa" className="border rounded-lg px-3 py-2" required />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Miasto" className="border rounded-lg px-3 py-2" />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adres" className="border rounded-lg px-3 py-2" />
        <button className="bg-brand-700 text-white rounded-lg px-3 py-2">Dodaj</button>
      </form>
      <div className="orders-list">
        <table>
          <thead><tr><th>Typ</th><th>Nazwa</th><th>Miasto</th><th>Adres</th></tr></thead>
          <tbody>
            {(branches.data ?? []).map((b) => (
              <tr key={b.id}>
                <td><span className="badge">{b.type}</span></td>
                <td>{b.name}</td><td>{b.city ?? '—'}</td><td>{b.address ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
