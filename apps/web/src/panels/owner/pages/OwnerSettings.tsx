import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function OwnerSettings() {
  const [settings, setSettings] = useState<any>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api('/settings').then(setSettings);
  }, []);

  async function save(key: string, value: any) {
    setSaving(key);
    try {
      await api('/settings', { method: 'PUT', body: JSON.stringify({ key, value }) });
      setSettings((s: any) => ({ ...s, [key]: value }));
    } finally { setSaving(null); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ustawienia</h1>

      <Section title="SMTP (e-mail)">
        <Json value={settings.smtp ?? {}} onSave={(v) => save('smtp', v)} saving={saving === 'smtp'} />
      </Section>
      <Section title="SMS">
        <Json value={settings.sms ?? {}} onSave={(v) => save('sms', v)} saving={saving === 'sms'} />
      </Section>
      <Section title="Branding / dane firmy">
        <Json value={settings.branding ?? {}} onSave={(v) => save('branding', v)} saving={saving === 'branding'} />
      </Section>

      <h2 className="text-xl font-bold mt-6">Szablony wiadomości</h2>
      {[
        'templates.email.order_accepted',
        'templates.email.ready_for_pickup',
        'templates.email.in_delivery',
        'templates.sms.order_accepted',
        'templates.sms.ready_for_pickup',
        'templates.sms.in_delivery',
      ].map((k) => (
        <Section key={k} title={k}>
          <Json value={settings[k] ?? {}} onSave={(v) => save(k, v)} saving={saving === k} />
        </Section>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Json({ value, onSave, saving }: { value: any; onSave: (v: any) => void; saving: boolean }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  useEffect(() => setText(JSON.stringify(value, null, 2)), [value]);
  return (
    <div className="space-y-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="w-full font-mono text-xs border rounded-lg p-2" />
      <button
        onClick={() => {
          try { onSave(JSON.parse(text)); } catch { alert('Niepoprawny JSON'); }
        }}
        className="bg-brand-700 text-white rounded-lg px-3 py-1.5 text-sm"
      >
        {saving ? 'Zapisuję…' : 'Zapisz'}
      </button>
    </div>
  );
}
