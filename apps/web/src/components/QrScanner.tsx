import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface Props {
  onResult: (text: string) => void;
  onError?: (e: string) => void;
  active?: boolean;
}

// Skaner QR — odporny na React StrictMode (podwójny mount), brak HTTPS,
// odmowę dostępu do kamery, i przełączanie kamery przód/tył.
export default function QrScanner({ onResult, onError, active = true }: Props) {
  // Generujemy stabilny, unikalny ID elementu raz, żeby nie zmienić go między
  // mountami w StrictMode.
  const idRef = useRef<string>(`qr-reader-${Math.random().toString(36).slice(2, 10)}`);
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<Html5Qrcode | null>(null);
  const startedRef = useRef<boolean>(false);
  const lastResult = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  const cancelledRef = useRef<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [cameraId, setCameraId] = useState<string | null>(null);

  // Odczyt listy kamer (raz przy starcie). Przy braku uprawnień zwróci [].
  useEffect(() => {
    let mounted = true;
    Html5Qrcode.getCameras()
      .then((devs) => {
        if (!mounted) return;
        if (devs && devs.length) {
          setCameras(devs);
          // Domyślnie wybieramy tylną (environment) jeśli rozpoznajemy po etykiecie.
          const back = devs.find((d) => /back|tyln|environment/i.test(d.label));
          setCameraId((back ?? devs[0]).id);
        }
      })
      .catch(() => {
        // Cicho — uprawnienia odmówione zostaną złapane przy start().
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Start/stop kamery. Reaguje na active oraz na zmianę cameraId.
  useEffect(() => {
    if (!active) return;
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError(
        'Twoja przeglądarka nie obsługuje dostępu do kamery. Otwórz aplikację przez HTTPS lub zainstaluj jako PWA.',
      );
      return;
    }

    cancelledRef.current = false;
    const el = document.getElementById(idRef.current);
    if (!el) return;

    const qr = new Html5Qrcode(idRef.current, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    } as any);
    instanceRef.current = qr;

    const cameraTarget: any = cameraId ?? { facingMode: 'environment' };

    qr.start(
      cameraTarget,
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decoded) => {
        const now = Date.now();
        if (decoded === lastResult.current.text && now - lastResult.current.at < 1500) return;
        lastResult.current = { text: decoded, at: now };
        try {
          (navigator as any).vibrate?.(80);
        } catch {
          /* ignore */
        }
        onResult(decoded);
      },
      () => {
        // brak callbacku błędów per-frame; ignorujemy
      },
    )
      .then(() => {
        if (cancelledRef.current) {
          // jeśli w międzyczasie został cleanup, natychmiast zatrzymaj
          qr.stop().catch(() => {}).finally(() => {
            try { qr.clear(); } catch { /* ignore */ }
          });
          return;
        }
        startedRef.current = true;
        setError(null);
      })
      .catch((err) => {
        const msg = String(err?.message || err || '');
        let friendly = 'Nie udało się uruchomić kamery.';
        if (/Permission|NotAllowed/i.test(msg)) {
          friendly = 'Brak zgody na dostęp do kamery. Włącz pozwolenie w ustawieniach przeglądarki.';
        } else if (/NotFound|NoSuch/i.test(msg)) {
          friendly = 'Nie znaleziono żadnej kamery w tym urządzeniu.';
        } else if (/secure|https|insecure/i.test(msg) || location.protocol !== 'https:' && location.hostname !== 'localhost') {
          friendly = 'Skaner wymaga połączenia HTTPS (zielona kłódka). Włącz SSL w panelu hostingu.';
        }
        setError(friendly + ' [' + msg + ']');
        onError?.(friendly);
      });

    return () => {
      cancelledRef.current = true;
      const inst = instanceRef.current;
      instanceRef.current = null;
      if (!inst) return;
      // Jeśli start się jeszcze nie zakończył, qr.stop() rzuci. Łapiemy.
      try {
        if (startedRef.current) {
          inst.stop().catch(() => {}).finally(() => {
            try { inst.clear(); } catch { /* ignore */ }
          });
        }
      } catch {
        /* ignore */
      }
      startedRef.current = false;
    };
  }, [active, cameraId, onResult, onError]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        id={idRef.current}
        className="w-full max-w-sm aspect-square bg-ink rounded-2xl overflow-hidden mx-auto ring-1 ring-white/10 shadow-lg"
      />
      {cameras.length > 1 && (
        <div className="text-center">
          <select
            value={cameraId ?? ''}
            onChange={(e) => setCameraId(e.target.value || null)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label || c.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 max-w-sm mx-auto">
          {error}
          <div className="text-xs text-slate-500 mt-1">
            Wskazówka: kamera działa tylko przez HTTPS (zielona kłódka). W panelu hostingu włącz darmowe SSL.
          </div>
        </div>
      )}
    </div>
  );
}
