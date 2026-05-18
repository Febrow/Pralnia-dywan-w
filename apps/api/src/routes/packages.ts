import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireRoles } from '../lib/auth.js';
import { ALWAYS_REQUIRED_STEPS } from '../lib/statuses.js';

export const packagesRouter = Router();

packagesRouter.get('/', async (_req, res) => {
  const list = await prisma.package.findMany({
    include: { requiredSteps: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(list);
});

const upsertSchema = z.object({
  name: z.string().min(1),
  pricePerM2: z.number().positive(),
  requiredSteps: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

packagesRouter.post('/', requireRoles('OWNER'), async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const max = await prisma.package.aggregate({ _max: { sortOrder: true } });
  const pkg = await prisma.package.create({
    data: {
      name: parsed.data.name,
      pricePerM2: parsed.data.pricePerM2,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
      isActive: parsed.data.isActive ?? true,
    },
  });
  const steps = [...ALWAYS_REQUIRED_STEPS, ...(parsed.data.requiredSteps ?? [])];
  let order = 1;
  for (const status of steps) {
    await prisma.requiredStep.create({ data: { packageId: pkg.id, status, sortOrder: order++ } });
  }
  res.json({ id: pkg.id });
});

packagesRouter.put('/:id', requireRoles('OWNER'), async (req, res) => {
  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const pkg = await prisma.package.update({
    where: { id: req.params.id },
    data: {
      name: parsed.data.name,
      pricePerM2: parsed.data.pricePerM2,
      isActive: parsed.data.isActive,
    },
  });
  if (parsed.data.requiredSteps) {
    await prisma.requiredStep.deleteMany({ where: { packageId: pkg.id } });
    const steps = [...ALWAYS_REQUIRED_STEPS, ...parsed.data.requiredSteps];
    let order = 1;
    for (const status of steps) {
      await prisma.requiredStep.create({ data: { packageId: pkg.id, status, sortOrder: order++ } });
    }
  }
  res.json({ id: pkg.id });
});
