import { FormEvent, useState } from 'react';
import { useAuth } from '../lib/auth';
import BrandLogo from '../components/BrandLogo';

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
    <div className="min-h-screen grid place-items-center bg-brand p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl shadow-tile p-8 w-full max-w-md space-y-4"
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <BrandLogo variant="dark" size={48} />
          <div className="text-ink/60 text-sm">Zaloguj się, aby kontynuować</div>
        </div>
        <label className="block">
          <span className="text-sm text-ink/70 font-medium">E-mail</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-brand-100 px-3 py-2 focus:ring-4 focus:ring-accent/30 focus:border-brand outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-ink/70 font-medium">Hasło</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            className="mt-1 w-full rounded-xl border border-brand-100 px-3 py-2 focus:ring-4 focus:ring-accent/30 focus:border-brand outline-none"
          />
        </label>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button disabled={loading} className="btn-primary w-full py-2.5 text-base">
          {loading ? 'Logowanie…' : 'Zaloguj się'}
        </button>
      </form>
    </div>
  );
}
