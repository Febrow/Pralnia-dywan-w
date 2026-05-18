import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireRoles } from '../lib/auth.js';

export const settingsRouter = Router();

settingsRouter.get('/', requireRoles('OWNER'), async (_req, res) => {
  const all = await prisma.systemSetting.findMany();
  const out: Record<string, any> = {};
  for (const r of all) out[r.key] = JSON.parse(r.value);
  res.json(out);
});

const upsertSchema = z.object({ key: z.string().min(1), value: z.any() });

settingsRouter.put('/', requireRoles('OWNER'), async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  await prisma.systemSetting.upsert({
    where: { key: parsed.data.key },
    update: { value: JSON.stringify(parsed.data.value) },
    create: { key: parsed.data.key, value: JSON.stringify(parsed.data.value) },
  });
  res.json({ ok: true });
});
