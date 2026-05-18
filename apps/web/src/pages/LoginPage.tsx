import { FormEvent, useState } from 'react';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message ?? 'Błąd logowania');
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-700 to-brand-900 p-4">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-4">
        <div className="text-center mb-2">
          <div className="text-2xl font-bold text-brand-700">Pralnia Dywanów</div>
          <div className="text-slate-500 text-sm">Zaloguj się, aby kontynuować</div>
        </div>
        <label className="block">
          <span className="text-sm text-slate-600">E-mail</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-brand-500" />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Hasło</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-brand-500" />
        </label>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button disabled={loading} className="w-full bg-brand-700 text-white rounded-lg py-2.5 font-medium hover:bg-brand-800 disabled:opacity-50">
          {loading ? 'Logowanie…' : 'Zaloguj się'}
        </button>
      </form>
    </div>
  );
}
