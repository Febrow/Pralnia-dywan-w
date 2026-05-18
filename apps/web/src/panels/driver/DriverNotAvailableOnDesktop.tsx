import { useAuth } from '../../lib/auth';

export default function DriverNotAvailableOnDesktop() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-slate-100">
      <div className="bg-white rounded-2xl border p-8 max-w-md text-center space-y-4">
        <div className="text-2xl">📱</div>
        <h1 className="text-xl font-bold">Panel kierowcy działa tylko na telefonie</h1>
        <p className="text-slate-500 text-sm">
          Otwórz aplikację na telefonie. Możesz dodać Pralnię do ekranu głównego (PWA),
          aby działała jak natywna aplikacja.
        </p>
        <button onClick={logout} className="bg-slate-800 text-white rounded-lg px-3 py-2">Wyloguj</button>
      </div>
    </div>
  );
}
