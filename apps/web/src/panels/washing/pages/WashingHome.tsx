import { Link } from 'react-router-dom';

export default function WashingHome() {
  return (
    <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
      <Link to="/washing/scan" className="bg-brand-700 hover:bg-brand-800 text-white rounded-2xl p-8 text-center text-2xl font-semibold shadow">
        Skanuj dywan
      </Link>
      <Link to="/washing/serial" className="bg-slate-800 hover:bg-slate-900 text-white rounded-2xl p-8 text-center text-2xl font-semibold shadow">
        Seryjne skanowanie
      </Link>
    </div>
  );
}
