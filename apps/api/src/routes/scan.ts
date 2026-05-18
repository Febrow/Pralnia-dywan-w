import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { type AuthRequest } from '../lib/auth.js';
import { changeRugStatus } from '../lib/orders.js';

export const scanRouter = Router();

// Skanowanie seryjne — zmiana statusu wielu dywanów naraz.
const bulkSchema = z.object({
  toStatus: z.string(),
  qrCodes: z.array(z.string()).min(1),
});

scanRouter.post('/bulk', async (req: AuthRequest, res) => {
  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });

  const { toStatus, qrCodes } = parsed.data;
  const results: { qrCode: string; ok: boolean; error?: string; rugId?: string }[] = [];

  for (const code of qrCodes) {
    try {
      const rug = await prisma.rug.findUnique({ where: { qrCode: code } });
      if (!rug) {
        results.push({ qrCode: code, ok: false, error: 'Nie znaleziono dywanu w bazie.' });
        continue;
      }
      const updated = await changeRugStatus({
        rugId: rug.id,
        toStatus,
        userId: req.user!.id,
        userRole: req.user!.role,
        source: 'serial_scan',
      });
      results.push({ qrCode: code, ok: true, rugId: updated.id });
    } catch (e: any) {
      results.push({ qrCode: code, ok: false, error: e.message });
    }
  }
  res.json({ results });
});

// Pobranie wolnego kodu QR z puli (jeśli klient nie podał ręcznie)
scanRouter.get('/next-available-code', async (_req, res) => {
  const code = await prisma.qrCode.findFirst({
    where: { status: 'AVAILABLE' },
    orderBy: { createdAt: 'asc' },
  });
  if (!code) return res.status(404).json({ error: 'Brak wolnych kodów w puli.' });
  res.json({ code: code.code });
});
