import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireRoles } from '../lib/auth.js';

export const qrPoolRouter = Router();

qrPoolRouter.get('/', requireRoles('OWNER'), async (_req, res) => {
  const total = await prisma.qrCode.count();
  const available = await prisma.qrCode.count({ where: { status: 'AVAILABLE' } });
  const assigned = await prisma.qrCode.count({ where: { status: 'ASSIGNED' } });
  const archived = await prisma.qrCode.count({ where: { status: 'ARCHIVED' } });
  const sample = await prisma.qrCode.findMany({
    where: { status: 'AVAILABLE' },
    take: 30,
    orderBy: { createdAt: 'asc' },
  });
  res.json({ total, available, assigned, archived, sample });
});

const generateSchema = z.object({ count: z.number().int().min(1).max(50000) });

qrPoolRouter.post('/generate', requireRoles('OWNER'), async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const codes = Array.from({ length: parsed.data.count }, (_, i) =>
    `RUG-${Date.now().toString(36)}-${(i + 1).toString().padStart(5, '0')}`,
  );
  await prisma.$transaction(codes.map((c) => prisma.qrCode.create({ data: { code: c } })));
  res.json({ generated: codes.length });
});
