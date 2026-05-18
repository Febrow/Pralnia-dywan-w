import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireRoles, type AuthRequest } from '../lib/auth.js';

export const customersRouter = Router();

customersRouter.get(
  '/',
  requireRoles('OWNER', 'LOGISTICS', 'STATIONARY_BRANCH_WORKER'),
  async (req: AuthRequest, res) => {
    const q = String(req.query.q ?? '').trim();
    const where = q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {};
    const list = await prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json(list);
  },
);

const customerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
});

customersRouter.post('/find-or-create', async (req, res) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const data = parsed.data;

  let customer = await prisma.customer.findFirst({
    where: { OR: [{ phone: data.phone }, { email: data.email }] },
  });
  if (!customer) {
    customer = await prisma.customer.create({ data });
  }
  res.json(customer);
});
