import { useAuth } from '../../lib/auth';
import BrandLogo from '../../components/BrandLogo';

export default function DriverNotAvailableOnDesktop() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-brand-50">
      <div className="bg-white rounded-2xl shadow-tile p-8 max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <BrandLogo variant="dark" size={40} />
        </div>
        <div className="text-4xl">📱</div>
        <h1 className="text-xl font-extrabold text-brand">Panel kierowcy działa tylko na telefonie</h1>
        <p className="text-ink/60 text-sm">
          Otwórz aplikację na telefonie. Możesz dodać Pralnię do ekranu głównego (PWA),
          aby działała jak natywna aplikacja.
        </p>
        <button onClick={logout} className="btn-primary">Wyloguj</button>
      </div>
    </div>
  );
}
