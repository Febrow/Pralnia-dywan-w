import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRoles, type AuthRequest } from '../lib/auth.js';
import { z } from 'zod';

export const settlementsRouter = Router();

settlementsRouter.get('/me', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'DRIVER') return res.status(403).json({ error: 'Tylko dla kierowcy.' });
  const list = await prisma.driverDailySettlement.findMany({
    where: { driverUserId: req.user!.id },
    include: { items: { include: { rug: true, order: true } } },
    orderBy: { day: 'desc' },
    take: 30,
  });
  res.json(list);
});

settlementsRouter.get('/', requireRoles('OWNER'), async (req, res) => {
  const driverId = req.query.driverId ? String(req.query.driverId) : undefined;
  const list = await prisma.driverDailySettlement.findMany({
    where: driverId ? { driverUserId: driverId } : {},
    include: {
      driver: { select: { id: true, firstName: true, lastName: true } },
      items: { include: { order: true, rug: { select: { qrCode: true } } } },
    },
    orderBy: { day: 'desc' },
    take: 60,
  });
  res.json(list);
});

const settleSchema = z.object({ notes: z.string().optional() });
settlementsRouter.post('/:id/settle', requireRoles('OWNER'), async (req: AuthRequest, res) => {
  const parsed = settleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const s = await prisma.driverDailySettlement.update({
    where: { id: req.params.id },
    data: {
      status: 'SETTLED',
      settledAt: new Date(),
      settledByUserId: req.user!.id,
      notes: parsed.data.notes,
    },
  });
  res.json({ id: s.id });
});
