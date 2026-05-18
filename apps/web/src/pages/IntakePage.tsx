// Strona przyjęcia zlecenia w placówce stacjonarnej.
// Używana przez panel pracownika placówki (Stationary).
import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import QrScanner from '../components/QrScanner';

export default function IntakePage({ source = 'STATIONARY' }: { source?: 'STATIONARY' | 'CENTRAL_WAREHOUSE' | 'PARTNER' }) {
  const navigate = useNavigate();
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => api<any[]>('/packages') });

  const [step, setStep] = useState<1 | 2>(1);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Klient
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Bieżący dywan
  const [qrCode, setQrCode] = useState('');
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [packageId, setPackageId] = useState('');
  const [notes, setNotes] = useState('');
  const [scannerOn, setScannerOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rugList, setRugList] = useState<{ qrCode: string; area: number; price: number }[]>([]);

  async function startOrder(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await api<{ id: string; number: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          source,
          customer: { firstName, lastName, phone, email },
        }),
      });
      setOrderId(r.id);
      setOrderNumber(r.number);
      setStep(2);
    } catch (e: any) { setError(e.message); }
  }

  async function addRug() {
    if (!orderId) return;
    setError(null);
    try {
      let qr = qrCode.trim();
      if (!qr) {
        const next = await api<{ code: string }>('/scan/next-available-code');
        qr = next.code;
        setQrCode(qr);
      }
      await api(`/orders/${orderId}/rugs`, {
        method: 'POST',
        body: JSON.stringify({
          qrCode: qr,
          widthCm: width ? Number(width) : null,
          heightCm: height ? Number(height) : null,
          packageId: packageId || null,
          notes: notes || null,
        }),
      });
      const pkg = packages.data?.find((p) => p.id === packageId);
      const area = width && height ? (Number(width) * Number(height)) / 10000 : 0;
      const price = pkg ? area * pkg.pricePerM2 : 0;
      setRugList((l) => [...l, { qrCode: qr, area, price }]);
      setQrCode(''); setWidth(''); setHeight(''); setNotes('');
    } catch (e: any) { setError(e.message); }
  }

  async function finalize() {
    if (!orderId) return;
    await api(`/orders/${orderId}/finalize`, { method: 'POST' });
    navigate(`/${source === 'PARTNER' ? 'partner' : 'stationary'}/orders/${orderId}`);
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">
        {source === 'PARTNER' ? 'Nowe zlecenie (placówka partnerska)' : 'Nowe zlecenie'}
      </h1>

      {step === 1 && (
        <form onSubmit={startOrder} className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-semibold">Dane klienta</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2" placeholder="Imię" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <input className="border rounded-lg px-3 py-2" placeholder="Nazwisko" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <input className="border rounded-lg px-3 py-2" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <input className="border rounded-lg px-3 py-2" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="bg-brand-700 text-white rounded-lg px-4 py-2">Utwórz zlecenie</button>
        </form>
      )}

      {step === 2 && (
        <>
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="text-sm text-slate-600">Numer zlecenia: <strong className="text-brand-700">{orderNumber}</strong></div>
            <h2 className="font-semibold">Dodaj dywan</h2>

            <div className="flex gap-2">
              <input className="border rounded-lg px-3 py-2 flex-1 font-mono" placeholder="Kod QR (lub kliknij Skanuj)" value={qrCode} onChange={(e) => setQrCode(e.target.value)} />
              <button onClick={() => setScannerOn((s) => !s)} className="px-3 py-2 rounded-lg border">{scannerOn ? 'Zamknij' : 'Skanuj'}</button>
              <button
                onClick={async () => {
                  const next = await api<{ code: string }>('/scan/next-available-code');
                  setQrCode(next.code);
                }}
                className="px-3 py-2 rounded-lg border"
                title="Pobierz wolny kod z puli"
              >
                Pobierz z puli
              </button>
            </div>
            {scannerOn && (
              <QrScanner onResult={(t) => { setQrCode(t); setScannerOn(false); }} />
            )}

            {source !== 'PARTNER' && (
              <div className="grid md:grid-cols-3 gap-3">
                <input className="border rounded-lg px-3 py-2" type="number" placeholder="Szerokość (cm)" value={width} onChange={(e) => setWidth(e.target.value === '' ? '' : Number(e.target.value))} />
                <input className="border rounded-lg px-3 py-2" type="number" placeholder="Długość (cm)" value={height} onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))} />
                <select className="border rounded-lg px-3 py-2" value={packageId} onChange={(e) => setPackageId(e.target.value)}>
                  <option value="">— Pakiet —</option>
                  {packages.data?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.pricePerM2} zł/m²)</option>
                  ))}
                </select>
              </div>
            )}

            <textarea className="border rounded-lg px-3 py-2 w-full" rows={2} placeholder="Notatka (opcjonalna)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button onClick={addRug} className="bg-brand-700 text-white rounded-lg px-4 py-2">+ Dodaj dywan do zlecenia</button>
          </div>

          {rugList.length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold mb-2">Dywany w tym zleceniu ({rugList.length})</h3>
              <ul className="text-sm space-y-1">
                {rugList.map((r, i) => (
                  <li key={i} className="font-mono">
                    {r.qrCode} · {r.area.toFixed(2)} m² · {r.price.toFixed(2)} zł
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={finalize} className="bg-emerald-600 text-white rounded-lg px-4 py-2">
            Zatwierdź zlecenie i wyślij potwierdzenie
          </button>
        </>
      )}
    </div>
  );
}
