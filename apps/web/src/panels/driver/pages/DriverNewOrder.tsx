import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import QrScanner from '../../../components/QrScanner';

export default function DriverNewOrder() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // dane klienta / adres
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [city, setCity] = useState('');

  // QR
  const [qr, setQr] = useState('');
  const [scannerOn, setScannerOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rugs, setRugs] = useState<string[]>([]);

  async function startOrder(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await api<{ id: string; number: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          source: 'DRIVER_FIELD',
          customer: { firstName, lastName, phone, email },
          pickupAddress: { street, houseNo, city },
        }),
      });
      setOrderId(r.id);
      setOrderNumber(r.number);
    } catch (e: any) { setError(e.message); }
  }

  async function addRug() {
    if (!orderId) return;
    try {
      let code = qr.trim();
      if (!code) {
        const next = await api<{ code: string }>('/scan/next-available-code');
        code = next.code;
      }
      await api(`/orders/${orderId}/rugs`, {
        method: 'POST',
        body: JSON.stringify({ qrCode: code }),
      });
      setRugs((l) => [...l, code]);
      setQr('');
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="space-y-4 mt-3">
      <h1 className="text-xl font-bold">Nowe zlecenie w terenie</h1>

      {!orderId ? (
        <form onSubmit={startOrder} className="bg-white rounded-xl border p-3 space-y-2">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Imię" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Nazwisko" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <input className="w-full border rounded-lg px-3 py-2" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded-lg px-3 py-2" placeholder="Ulica" value={street} onChange={(e) => setStreet(e.target.value)} />
            <input className="border rounded-lg px-3 py-2" placeholder="Numer" value={houseNo} onChange={(e) => setHouseNo(e.target.value)} />
          </div>
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Miasto" value={city} onChange={(e) => setCity(e.target.value)} />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="w-full bg-brand-700 text-white rounded-lg py-3">Utwórz zlecenie</button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="text-sm">Zlecenie: <strong>{orderNumber}</strong></div>
          <div className="bg-white rounded-xl border p-3 space-y-2">
            <div className="flex gap-2">
              <input value={qr} onChange={(e) => setQr(e.target.value)} placeholder="Kod QR" className="flex-1 border rounded-lg px-3 py-2 font-mono" />
              <button onClick={() => setScannerOn((s) => !s)} className="border rounded-lg px-3 py-2">{scannerOn ? '✕' : 'Skanuj'}</button>
            </div>
            {scannerOn && <QrScanner onResult={(c) => { setQr(c); setScannerOn(false); }} />}
            <button onClick={addRug} className="w-full bg-brand-700 text-white rounded-lg py-3">+ Dodaj dywan (bez pomiaru)</button>
          </div>
          {rugs.length > 0 && (
            <div className="bg-white rounded-xl border p-3 text-xs font-mono">
              {rugs.map((c) => <div key={c}>{c}</div>)}
            </div>
          )}
          <button onClick={() => navigate(`/driver/orders/${orderId}`)} className="w-full bg-emerald-600 text-white rounded-lg py-3">
            Zakończ ({rugs.length} dyw.)
          </button>
        </div>
      )}
    </div>
  );
}
