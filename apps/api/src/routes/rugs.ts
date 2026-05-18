import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { type AuthRequest } from '../lib/auth.js';
import { changeRugStatus, recomputeOrderTotals } from '../lib/orders.js';

export const rugsRouter = Router();

// Lista dywanów (np. dla pracownika prania albo właściciela)
rugsRouter.get('/', async (req: AuthRequest, res) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  const rugs = await prisma.rug.findMany({
    where: status ? { currentStatus: status } : {},
    include: { order: { include: { customer: true } }, package: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  res.json(rugs);
});

// Karta dywanu po QR
rugsRouter.get('/by-qr/:code', async (req, res) => {
  const rug = await prisma.rug.findUnique({
    where: { qrCode: req.params.code },
    include: {
      order: {
        include: {
          customer: true,
          rugs: { select: { id: true, qrCode: true, currentStatus: true, packageId: true } },
        },
      },
      package: { include: { requiredSteps: true } },
      photos: true,
      statusEvents: { orderBy: { changedAt: 'desc' }, take: 30 },
    },
  });
  if (!rug) return res.status(404).json({ error: 'Nie znaleziono dywanu po kodzie QR.' });
  res.json(rug);
});

// Aktualizacja pomiaru / pakietu (np. po przyjęciu od kierowcy)
const measureSchema = z.object({
  widthCm: z.number().int().positive().optional(),
  heightCm: z.number().int().positive().optional(),
  packageId: z.string().optional(),
  notes: z.string().optional(),
});

rugsRouter.put('/:id', async (req: AuthRequest, res) => {
  const parsed = measureSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const rug = await prisma.rug.findUnique({ where: { id: req.params.id }, include: { order: true } });
  if (!rug) return res.status(404).json({ error: 'Brak dywanu.' });

  const widthCm = parsed.data.widthCm ?? rug.widthCm ?? null;
  const heightCm = parsed.data.heightCm ?? rug.heightCm ?? null;
  let packageId = parsed.data.packageId ?? rug.packageId ?? null;

  let pricePerM2: number | null = rug.pricePerM2 ?? null;
  if (packageId) {
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (pkg) {
      pricePerM2 = pkg.pricePerM2;
      if (rug.order.source === 'PARTNER' && rug.order.partnerBranchId) {
        const branch = await prisma.branch.findUnique({
          where: { id: rug.order.partnerBranchId },
          include: { partnerPriceList: { include: { items: true } } },
        });
        const item = branch?.partnerPriceList?.items.find((i) => i.packageId === pkg.id);
        if (item) pricePerM2 = item.pricePerM2;
      }
    }
  }

  let areaM2: number | null = null;
  let totalPrice: number | null = null;
  if (widthCm && heightCm) {
    areaM2 = (widthCm * heightCm) / 10000;
    if (pricePerM2) totalPrice = areaM2 * pricePerM2;
  }

  await prisma.rug.update({
    where: { id: rug.id },
    data: {
      widthCm,
      heightCm,
      packageId,
      pricePerM2,
      areaM2,
      totalPrice,
      notes: parsed.data.notes ?? rug.notes,
    },
  });
  await recomputeOrderTotals(rug.orderId);
  res.json({ id: rug.id });
});

// Zmiana statusu jednego dywanu
const statusSchema = z.object({ toStatus: z.string(), comment: z.string().optional() });

rugsRouter.post('/:id/status', async (req: AuthRequest, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  try {
    const updated = await changeRugStatus({
      rugId: req.params.id,
      toStatus: parsed.data.toStatus,
      userId: req.user!.id,
      userRole: req.user!.role,
      source: 'manual',
      comment: parsed.data.comment,
    });
    res.json({ id: updated.id });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
