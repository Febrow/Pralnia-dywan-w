import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { ROLE_LABELS_PL } from '../../../lib/statuses';

export default function OwnerUsers() {
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<any[]>('/users') });
  const branches = useQuery({ queryKey: ['branches'], queryFn: () => api<any[]>('/branches') });
  const qc = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('STATIONARY_BRANCH_WORKER');
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (data: any) => api('/users', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEmail(''); setPassword(''); setFirstName(''); setLastName('');
    },
    onError: (e: any) => setError(e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    create.mutate({ email, password, firstName, lastName, role, branchId: branchId || undefined });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Użytkownicy</h1>
      <form onSubmit={submit} className="bg-white rounded-xl border p-4 grid md:grid-cols-6 gap-2">
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Imię" className="border rounded-lg px-3 py-2" required />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nazwisko" className="border rounded-lg px-3 py-2" required />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" className="border rounded-lg px-3 py-2" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Hasło (min. 8)" type="password" className="border rounded-lg px-3 py-2" required />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="border rounded-lg px-3 py-2">
          {Object.entries(ROLE_LABELS_PL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="">— bez placówki —</option>
          {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {error && <div className="md:col-span-6 text-red-600 text-sm">{error}</div>}
        <button className="md:col-span-6 bg-brand-700 text-white rounded-lg px-3 py-2">Dodaj użytkownika</button>
      </form>
      <div className="orders-list">
        <table>
          <thead><tr><th>Imię i nazwisko</th><th>E-mail</th><th>Rola</th><th>Placówki</th><th>Aktywny</th></tr></thead>
          <tbody>
            {(users.data ?? []).map((u) => (
              <tr key={u.id}>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{ROLE_LABELS_PL[u.role] ?? u.role}</td>
                <td className="text-xs">{u.branches.map((b: any) => b.name).join(', ') || '—'}</td>
                <td>{u.isActive ? 'Tak' : 'Nie'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
