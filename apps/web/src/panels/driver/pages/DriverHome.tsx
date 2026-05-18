import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

interface Settlement {
  id: string;
  day: string;
  totalCashCollected: number;
  status: 'PENDING' | 'SETTLED';
  items: { id: string }[];
}

export default function DriverHome() {
  // Mała sekcja statusu: dziś / nierozliczone
  const settlements = useQuery({
    queryKey: ['driver-home-settlements'],
    queryFn: () => api<Settlement[]>('/settlements/me'),
    refetchOnWindowFocus: true,
  });

  const today = new Date().toISOString().slice(0, 10);
  const todays = settlements.data?.find((s) => s.day === today);
  const unsettled = (settlements.data ?? []).filter((s) => s.status === 'PENDING');
  const totalUnsettled = unsettled.reduce((sum, s) => sum + Number(s.totalCashCollected || 0), 0);

  return (
    <div className="space-y-4">
      {/* Karta statusu */}
      <div className="rounded-2xl bg-white border border-brand-100 shadow-tile p-4">
        <div className="text-xs uppercase tracking-widest text-brand-700 font-bold">Dzisiaj</div>
        <div className="flex items-baseline gap-3 mt-1">
          <div className="text-3xl font-extrabold text-ink">
            {todays?.items.length ?? 0}
          </div>
          <div className="text-sm text-ink/60">wydanych dywanów</div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-ink/60">Pobrana gotówka</div>
            <div className="text-2xl font-bold text-brand">
              {Number(todays?.totalCashCollected ?? 0).toFixed(2)} zł
            </div>
          </div>
          {totalUnsettled > 0 && (
            <Link
              to="/driver/cash"
              className="bg-accent text-ink text-xs font-bold px-3 py-2 rounded-xl shadow-tile"
            >
              Do rozliczenia: {totalUnsettled.toFixed(2)} zł →
            </Link>
          )}
        </div>
      </div>

      {/* Główne akcje — duże kafelki */}
      <div className="grid grid-cols-2 gap-3">
        <Tile
          to="/driver/scan"
          icon="🔳"
          title="Skanuj kod QR"
          subtitle="Pojedyncze + seryjne"
          variant="primary"
        />
        <Tile
          to="/driver/new-order"
          icon="➕"
          title="Nowe zlecenie"
          subtitle="W terenie, bez pomiaru"
          variant="accent"
        />
        <Tile
          to="/driver/pickups"
          icon="⬆️"
          title="Moje odbiory"
          subtitle="Do odebrania od klienta"
          variant="dark"
        />
        <Tile
          to="/driver/deliveries"
          icon="⬇️"
          title="Moje doręczenia"
          subtitle="Do oddania klientom"
          variant="dark"
        />
        <Tile
          to="/driver/cash"
          icon="💰"
          title="Rozliczenie gotówki"
          subtitle="Dzisiejsze + historia"
          variant="outline"
        />
        <Tile
          to="/driver/scan"
          icon="📦"
          title="Odbiór z partnera"
          subtitle="Skan QR z naklejki"
          variant="outline"
        />
      </div>
    </div>
  );
}

interface TileProps {
  to: string;
  icon: string;
  title: string;
  subtitle?: string;
  variant: 'primary' | 'accent' | 'dark' | 'outline';
}

function Tile({ to, icon, title, subtitle, variant }: TileProps) {
  const styles: Record<TileProps['variant'], { card: string; icon: string }> = {
    primary: {
      card: 'bg-brand text-white',
      icon: 'bg-white/15 text-accent',
    },
    accent: {
      card: 'bg-accent text-ink',
      icon: 'bg-ink/10 text-ink',
    },
    dark: {
      card: 'bg-ink text-white',
      icon: 'bg-white/10 text-accent',
    },
    outline: {
      card: 'bg-white text-ink border border-brand-100',
      icon: 'bg-brand-50 text-brand',
    },
  };
  const s = styles[variant];
  return (
    <Link to={to} className={'tile ' + s.card}>
      <div className={'tile-icon ' + s.icon}>
        <span>{icon}</span>
      </div>
      <div>
        <div className="tile-title">{title}</div>
        {subtitle && <div className="tile-subtitle">{subtitle}</div>}
      </div>
      <span className="absolute top-3 right-3 text-lg opacity-70">→</span>
    </Link>
  );
}
