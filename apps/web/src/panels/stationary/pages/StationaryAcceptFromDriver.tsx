import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import QrScanner from '../../../components/QrScanner';

export default function StationaryAcceptFromDriver() {
  const navigate = useNavigate();
  const [scannerOn, setScannerOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function onCode(code: string) {
    setError(null);
    try {
      const rug = await api<any>(`/rugs/by-qr/${encodeURIComponent(code)}`);
      // przyjmujemy w magazynie
      await api(`/rugs/${rug.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ toStatus: 'ACCEPTED_AT_CENTRAL' }),
      });
      navigate(`/stationary/orders/${rug.orderId}`);
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">Przyjęcie dywanu od kierowcy</h1>
      <p className="text-sm text-slate-500">Zeskanuj kod QR z naklejki — system otworzy istniejące zlecenie i zmieni status na „Przyjęto w magazynie centralnym".</p>
      {scannerOn && <QrScanner onResult={onCode} />}
      {error && <div className="text-red-600">{error}</div>}
      <button onClick={() => setScannerOn((s) => !s)} className="px-3 py-2 rounded-lg border">
        {scannerOn ? 'Zatrzymaj skaner' : 'Włącz skaner'}
      </button>
    </div>
  );
}
