import { Link } from 'react-router-dom';

export default function DriverHome() {
  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      <Tile to="/driver/pickups" label="Moje odbiory" />
      <Tile to="/driver/deliveries" label="Moje doręczenia" />
      <Tile to="/driver/scan" label="Skanuj dywan" primary />
      <Tile to="/driver/new-order" label="Nowe zlecenie" />
      <Tile to="/driver/cash" label="Rozliczenie gotówki" />
    </div>
  );
}
function Tile({ to, label, primary }: { to: string; label: string; primary?: boolean }) {
  return (
    <Link to={to} className={`${primary ? 'bg-brand-700 text-white' : 'bg-white text-slate-800 border'} rounded-2xl p-5 text-center font-semibold shadow-sm`}>
      {label}
    </Link>
  );
}
