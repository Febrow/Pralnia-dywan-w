import { FormEvent, useState } from 'react';
import { api } from '../lib/api';
import BrandLogo from '../components/BrandLogo';

interface Props {
  onDone: () => void;
}

export default function InstallPage({ onDone }: Props) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Krok 1: właściciel
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');

  // Krok 2: magazyn centralny
  const [branchName, setBranchName] = useState('Pralnia – Magazyn centralny');
  const [branchCity, setBranchCity] = useState('');
  const [branchAddress, setBranchAddress] = useState('');

  // Krok 3: dane MySQL (PHP/shared hosting)
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState<number>(3306);
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPass, setDbPass] = useState('');

  // Krok 4: SMTP
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Pralnia Dywanów');
  const [smtpSecure, setSmtpSecure] = useState(false);

  // Krok 5: SMS
  const [smsProvider, setSmsProvider] = useState('console');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsSender, setSmsSender] = useState('Pralnia');

  // Krok 6: pula QR
  const [qrPoolSize, setQrPoolSize] = useState(200);

  async function onFinish(e?: FormEvent) {
    e?.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api('/install/run', {
        method: 'POST',
        body: JSON.stringify({
          owner: {
            email: ownerEmail,
            password: ownerPassword,
            firstName: ownerFirstName,
            lastName: ownerLastName,
          },
          centralBranch: { name: branchName, city: branchCity, address: branchAddress },
          db: {
            db_host: dbHost,
            db_port: Number(dbPort),
            db_name: dbName,
            db_user: dbUser,
            db_pass: dbPass,
          },
          smtp: smtpHost
            ? {
                host: smtpHost,
                port: Number(smtpPort),
                user: smtpUser,
                password: smtpPassword,
                from: smtpFrom,
                fromName: smtpFromName,
                secure: smtpSecure,
              }
            : undefined,
          sms: { provider: smsProvider, apiKey: smsApiKey, sender: smsSender },
          qrPoolSize,
        }),
      });
      onDone();
    } catch (err: any) {
      setError(err?.message ?? 'Błąd instalacji');
    } finally {
      setSubmitting(false);
    }
  }

  function StepIndicator() {
    return (
      <div className="flex gap-2 justify-center mb-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className={
              'w-8 h-2 rounded-full transition ' + (step >= n ? 'bg-accent' : 'bg-brand-100')
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 grid place-items-center p-4">
      <div className="bg-white rounded-2xl shadow-tile p-8 w-full max-w-2xl">
        <div className="flex flex-col items-center gap-2 mb-2">
          <BrandLogo variant="dark" size={36} />
          <div className="text-xl font-extrabold text-brand">Kreator instalacji</div>
          <div className="text-ink/60 text-sm text-center">
            Skonfigurujmy Twoją pralnię. Możesz później zmienić te ustawienia w panelu właściciela.
          </div>
        </div>
        <StepIndicator />

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Krok 1: Konto właściciela</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Imię" value={ownerFirstName} onChange={setOwnerFirstName} />
              <Field label="Nazwisko" value={ownerLastName} onChange={setOwnerLastName} />
            </div>
            <Field label="E-mail" type="email" value={ownerEmail} onChange={setOwnerEmail} />
            <Field
              label="Hasło (min. 8 znaków)"
              type="password"
              value={ownerPassword}
              onChange={setOwnerPassword}
            />
            <NavButtons
              onNext={() => setStep(2)}
              disabled={!ownerEmail || ownerPassword.length < 8 || !ownerFirstName || !ownerLastName}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Krok 2: Magazyn centralny</h2>
            <p className="text-sm text-ink/60">
              Magazyn centralny to placówka, w której fizycznie odbywa się pranie. Może być tylko jeden.
            </p>
            <Field label="Nazwa" value={branchName} onChange={setBranchName} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Miasto" value={branchCity} onChange={setBranchCity} />
              <Field label="Adres" value={branchAddress} onChange={setBranchAddress} />
            </div>
            <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} disabled={!branchName} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Krok 3: Baza MySQL</h2>
            <p className="text-sm text-ink/60">
              Te dane otrzymasz w panelu hostingu, gdy utworzysz nową bazę danych.
              Na SeoHost zwykle host to <code>mysql.serwer***.seohost.pl</code> lub <code>localhost</code>.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Host" value={dbHost} onChange={setDbHost} placeholder="np. localhost" />
              <Field label="Port" type="number" value={String(dbPort)} onChange={(v) => setDbPort(Number(v))} />
              <Field label="Nazwa bazy" value={dbName} onChange={setDbName} />
              <Field label="Użytkownik" value={dbUser} onChange={setDbUser} />
            </div>
            <Field label="Hasło bazy" type="password" value={dbPass} onChange={setDbPass} />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <NavButtons
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              disabled={!dbHost || !dbName || !dbUser}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Krok 4: SMTP (e-mail)</h2>
            <p className="text-sm text-ink/60">
              Opcjonalne. Możesz pominąć i ustawić później w panelu Właściciela.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Host" value={smtpHost} onChange={setSmtpHost} placeholder="np. smtp.serwer.seohost.pl" />
              <Field label="Port" type="number" value={String(smtpPort)} onChange={(v) => setSmtpPort(Number(v))} />
              <Field label="Użytkownik" value={smtpUser} onChange={setSmtpUser} />
              <Field label="Hasło" type="password" value={smtpPassword} onChange={setSmtpPassword} />
              <Field label="Adres nadawcy" type="email" value={smtpFrom} onChange={setSmtpFrom} />
              <Field label="Nazwa nadawcy" value={smtpFromName} onChange={setSmtpFromName} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} />
              Połączenie SSL/TLS (port 465)
            </label>
            <NavButtons onBack={() => setStep(3)} onNext={() => setStep(5)} />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Krok 5: SMS</h2>
            <p className="text-sm text-ink/60">
              Domyślnie aktywujemy „Console" — SMS-y zapisywane są tylko w logach serwera.
              Później wybierz dostawcę (np. SMSAPI.pl) i wstaw klucz API.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-ink/70 font-medium">Dostawca</span>
                <select
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-100 px-3 py-2"
                >
                  <option value="console">Console (logi)</option>
                  <option value="smsapi">SMSAPI.pl</option>
                </select>
              </label>
              <Field label="Nazwa nadawcy" value={smsSender} onChange={setSmsSender} />
              <Field label="API Key" value={smsApiKey} onChange={setSmsApiKey} />
            </div>
            <NavButtons onBack={() => setStep(4)} onNext={() => setStep(6)} />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Krok 6: Pula kodów QR</h2>
            <p className="text-sm text-ink/60">
              System wygeneruje pulę unikalnych kodów do nadrukowania na naklejkach.
              Możesz później dogenerować więcej.
            </p>
            <Field
              label="Liczba kodów"
              type="number"
              value={String(qrPoolSize)}
              onChange={(v) => setQrPoolSize(Number(v))}
            />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <NavButtons
              onBack={() => setStep(5)}
              onNext={onFinish}
              nextLabel={submitting ? 'Instaluję…' : 'Zainstaluj'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-ink/70 font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-brand-100 px-3 py-2 focus:ring-4 focus:ring-accent/30 focus:border-brand outline-none"
      />
    </label>
  );
}

function NavButtons({
  onBack,
  onNext,
  disabled,
  nextLabel,
}: {
  onBack?: () => void;
  onNext?: () => void;
  disabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex justify-between pt-4">
      {onBack ? (
        <button onClick={onBack} className="btn-outline">
          Wstecz
        </button>
      ) : (
        <div />
      )}
      <button onClick={onNext} disabled={disabled} className="btn-primary">
        {nextLabel ?? 'Dalej'}
      </button>
    </div>
  );
}
