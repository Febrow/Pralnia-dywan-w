import { useState } from 'react';
import QrScanner from './QrScanner';
import { api } from '../lib/api';
import { STATUS_LABELS_PL } from '../lib/statuses';

interface Props {
  availableStatuses: string[];
  defaultStatus?: string;
}

export default function SerialScanScreen({ availableStatuses, defaultStatus }: Props) {
  const [status, setStatus] = useState(defaultStatus ?? availableStatuses[0]);
  const [scanned, setScanned] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ qrCode: string; error: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ ok: number; fail: number } | null>(null);

  function add(text: string) {
    if (scanned.includes(text)) return;
    setScanned((s) => [...s, text]);
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await api<{ results: { qrCode: string; ok: boolean; error?: string }[] }>(
        '/scan/bulk',
        { method: 'POST', body: JSON.stringify({ toStatus: status, qrCodes: scanned }) },
      );
      const ok = res.results.filter((r) => r.ok).length;
      const fail = res.results.length - ok;
      setErrors(res.results.filter((r) => !r.ok).map((r) => ({ qrCode: r.qrCode, error: r.error ?? '' })));
      setDone({ ok, fail });
      setScanned([]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600">Docelowy status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3 py-1.5">
          {availableStatuses.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS_PL[s] ?? s}</option>
          ))}
        </select>
      </div>
      <QrScanner onResult={add} active={!submitting} />
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <div className="font-medium mb-2">Zeskanowane: <span className="text-brand-700">{scanned.length}</span></div>
        <div className="text-xs font-mono text-slate-500 space-y-1 max-h-48 overflow-auto">
          {scanned.map((s) => <div key={s}>{s}</div>)}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setScanned([])} className="px-3 py-1.5 rounded-lg border">Wyczyść</button>
          <button disabled={!scanned.length || submitting} onClick={submit} className="px-3 py-1.5 rounded-lg bg-brand-700 text-white disabled:opacity-50">
            {submitting ? 'Zapisuję…' : `Ustaw status dla ${scanned.length} dywanów`}
          </button>
        </div>
      </div>
      {done && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <div className="text-emerald-700">Sukces: {done.ok}</div>
          {done.fail > 0 && <div className="text-red-700">Błędy: {done.fail}</div>}
          {errors.length > 0 && (
            <ul className="mt-2 text-xs text-red-700 list-disc pl-5">
              {errors.map((e, i) => <li key={i}>{e.qrCode}: {e.error}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
