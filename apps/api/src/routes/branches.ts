import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireRoles, type AuthRequest } from '../lib/auth.js';

export const branchesRouter = Router();

branchesRouter.get('/', async (req: AuthRequest, res) => {
  const where: any = {};
  if (req.user!.role === 'OWNER') {
    // wszystkie
  } else {
    // pozostali: tylko swoja
    if (req.user!.primaryBranchId) where.id = req.user!.primaryBranchId;
  }
  const list = await prisma.branch.findMany({ where, orderBy: { createdAt: 'asc' } });
  res.json(list);
});

const createSchema = z.object({
  type: z.enum(['CENTRAL_WAREHOUSE', 'STATIONARY', 'PARTNER']),
  name: z.string().min(1),
  city: z.string().optional(),
  address: z.string().optional(),
  partnerPriceListId: z.string().optional().nullable(),
});

branchesRouter.post('/', requireRoles('OWNER'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  if (parsed.data.type === 'CENTRAL_WAREHOUSE') {
    const exists = await prisma.branch.findFirst({ where: { type: 'CENTRAL_WAREHOUSE' } });
    if (exists) return res.status(409).json({ error: 'Magazyn centralny już istnieje.' });
  }
  const branch = await prisma.branch.create({ data: parsed.data });
  res.json(branch);
});

branchesRouter.put('/:id', requireRoles('OWNER'), async (req, res) => {
  const parsed = createSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const branch = await prisma.branch.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(branch);
});
