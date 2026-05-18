import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireRoles } from '../lib/auth.js';

export const priceListsRouter = Router();

priceListsRouter.get('/', requireRoles('OWNER'), async (_req, res) => {
  const list = await prisma.priceList.findMany({
    include: { items: { include: { package: true } }, ownerBranch: true },
  });
  res.json(list);
});

const upsertSchema = z.object({
  ownerBranchId: z.string(),
  name: z.string().min(1),
  items: z.array(z.object({ packageId: z.string(), pricePerM2: z.number().positive() })),
});

priceListsRouter.post('/', requireRoles('OWNER'), async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const pl = await prisma.priceList.create({
    data: { ownerBranchId: parsed.data.ownerBranchId, name: parsed.data.name },
  });
  for (const it of parsed.data.items) {
    await prisma.priceListItem.create({
      data: { priceListId: pl.id, packageId: it.packageId, pricePerM2: it.pricePerM2 },
    });
  }
  // Powiąż z placówką
  await prisma.branch.update({
    where: { id: parsed.data.ownerBranchId },
    data: { partnerPriceListId: pl.id },
  });
  res.json({ id: pl.id });
});

priceListsRouter.put('/:id', requireRoles('OWNER'), async (req, res) => {
  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const pl = await prisma.priceList.update({
    where: { id: req.params.id },
    data: { name: parsed.data.name },
  });
  if (parsed.data.items) {
    await prisma.priceListItem.deleteMany({ where: { priceListId: pl.id } });
    for (const it of parsed.data.items) {
      await prisma.priceListItem.create({
        data: { priceListId: pl.id, packageId: it.packageId, pricePerM2: it.pricePerM2 },
      });
    }
  }
  res.json({ id: pl.id });
});
