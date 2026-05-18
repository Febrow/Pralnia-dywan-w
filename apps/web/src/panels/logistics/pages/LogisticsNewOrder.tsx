import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';

export default function LogisticsNewOrder() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // klient
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  // adres
  const [street, setStreet] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [apartmentNo, setApartmentNo] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');

  const [notes, setNotes] = useState('');
  const [internal, setInternal] = useState('');
  const [declared, setDeclared] = useState<number | ''>('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await api<{ id: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          source: 'LOGISTICS_PHONE',
          customer: { firstName, lastName, phone, email },
          pickupAddress: { street, houseNo, apartmentNo, postalCode, city },
          deliveryAddress: { street, houseNo, apartmentNo, postalCode, city },
          notesForDriver: notes,
          internalNotes: internal,
          declaredRugCount: declared === '' ? undefined : Number(declared),
        }),
      });
      navigate(`/logistics/orders/${r.id}`);
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Nowe zlecenie (telefoniczne / mailowe)</h1>
      <form onSubmit={submit} className="bg-white rounded-xl border p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Imię" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <input className="border rounded-lg px-3 py-2" placeholder="Nazwisko" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          <input className="border rounded-lg px-3 py-2" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <input className="border rounded-lg px-3 py-2" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <h2 className="font-semibold pt-2">Adres</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Ulica" value={street} onChange={(e) => setStreet(e.target.value)} />
          <input className="border rounded-lg px-3 py-2" placeholder="Numer domu" value={houseNo} onChange={(e) => setHouseNo(e.target.value)} />
          <input className="border rounded-lg px-3 py-2" placeholder="Numer mieszkania" value={apartmentNo} onChange={(e) => setApartmentNo(e.target.value)} />
          <input className="border rounded-lg px-3 py-2" placeholder="Kod pocztowy" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          <input className="border rounded-lg px-3 py-2" placeholder="Miasto" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <input
          type="number"
          className="border rounded-lg px-3 py-2 w-40"
          placeholder="Liczba dywanów (opcjonalnie)"
          value={declared}
          onChange={(e) => setDeclared(e.target.value === '' ? '' : Number(e.target.value))}
        />
        <textarea className="w-full border rounded-lg px-3 py-2" rows={2} placeholder="Notatka dla kierowcy" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <textarea className="w-full border rounded-lg px-3 py-2" rows={2} placeholder="Notatka wewnętrzna" value={internal} onChange={(e) => setInternal(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="bg-brand-700 text-white rounded-lg px-4 py-2">Utwórz zlecenie</button>
      </form>
    </div>
  );
}
