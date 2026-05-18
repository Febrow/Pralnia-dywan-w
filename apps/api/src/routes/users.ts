import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, requireRoles } from '../lib/auth.js';

export const usersRouter = Router();

const ROLES = [
  'OWNER',
  'STATIONARY_BRANCH_WORKER',
  'WASHING_WORKER',
  'DRIVER',
  'LOGISTICS',
  'PARTNER_BRANCH',
  'STATIONARY_BRANCH',
] as const;

usersRouter.get('/', requireRoles('OWNER'), async (_req, res) => {
  const users = await prisma.user.findMany({
    include: { memberships: { include: { branch: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    isActive: u.isActive,
    branches: u.memberships.map((m) => ({ id: m.branchId, name: m.branch.name, type: m.branch.type })),
  })));
});

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(ROLES),
  branchId: z.string().optional().nullable(),
});

usersRouter.post('/', requireRoles('OWNER'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return res.status(409).json({ error: 'Użytkownik z tym e-mailem już istnieje.' });

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: await hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    },
  });
  if (data.branchId) {
    await prisma.membership.create({
      data: { userId: user.id, branchId: data.branchId, role: data.role },
    });
  }
  res.json({ id: user.id });
});

usersRouter.put('/:id', requireRoles('OWNER'), async (req, res) => {
  const schema = createSchema.partial().extend({ isActive: z.boolean().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const data = parsed.data as any;
  if (data.password) data.passwordHash = await hashPassword(data.password);
  delete data.password;
  delete data.branchId;
  const user = await prisma.user.update({ where: { id: req.params.id }, data });
  res.json({ id: user.id });
});
