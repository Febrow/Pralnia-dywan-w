import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface Props {
  onResult: (text: string) => void;
  onError?: (e: string) => void;
  active?: boolean;
}

export default function QrScanner({ onResult, onError, active = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const instance = useRef<Html5Qrcode | null>(null);
  const lastResult = useRef<{ text: string; at: number }>({ text: '', at: 0 });

  useEffect(() => {
    if (!active || !ref.current) return;
    const id = `qr-reader-${Math.random().toString(36).slice(2, 8)}`;
    ref.current.id = id;
    const qr = new Html5Qrcode(id, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
    instance.current = qr;
    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decoded) => {
        const now = Date.now();
        if (decoded === lastResult.current.text && now - lastResult.current.at < 1500) return;
        lastResult.current = { text: decoded, at: now };
        try { (navigator as any).vibrate?.(100); } catch {}
        onResult(decoded);
      },
      () => {},
    ).catch((err) => onError?.(String(err)));

    return () => {
      try {
        const stopped = qr.stop();
        if (stopped && typeof (stopped as any).catch === 'function') {
          (stopped as Promise<void>).catch(() => {}).finally(() => {
            try { qr.clear(); } catch {}
          });
        } else {
          try { qr.clear(); } catch {}
        }
      } catch { /* ignore */ }
    };
  }, [active]);

  return <div ref={ref} className="w-full max-w-sm aspect-square bg-black rounded-lg overflow-hidden mx-auto" />;
}
