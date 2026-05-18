import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/auth.js';
import { ALWAYS_REQUIRED_STEPS, DEFAULT_PACKAGES } from '../lib/statuses.js';

export const installRouter = Router();

// Czy system już zainstalowany?
installRouter.get('/status', async (_req, res) => {
  const ownerCount = await prisma.user.count({ where: { role: 'OWNER' } });
  const installed = ownerCount > 0;
  res.json({ installed });
});

const installSchema = z.object({
  owner: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  }),
  centralBranch: z.object({
    name: z.string().min(1),
    city: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  }),
  smtp: z
    .object({
      host: z.string().optional(),
      port: z.number().optional(),
      user: z.string().optional(),
      password: z.string().optional(),
      from: z.string().optional(),
      fromName: z.string().optional(),
      secure: z.boolean().optional(),
    })
    .optional(),
  sms: z
    .object({
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      sender: z.string().optional(),
    })
    .optional(),
  packages: z
    .array(
      z.object({
        name: z.string(),
        pricePerM2: z.number().positive(),
        requiredSteps: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  branding: z
    .object({
      companyName: z.string().optional(),
      contactPhone: z.string().optional(),
      contactEmail: z.string().optional(),
    })
    .optional(),
  qrPoolSize: z.number().int().nonnegative().max(50000).optional(),
});

installRouter.post('/run', async (req, res) => {
  const ownerCount = await prisma.user.count({ where: { role: 'OWNER' } });
  if (ownerCount > 0) {
    return res.status(409).json({ error: 'System jest już zainstalowany.' });
  }

  const parsed = installSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Niepoprawne dane', details: parsed.error.flatten() });
  }
  const data = parsed.data;

  // 1) Konto OWNER
  const owner = await prisma.user.create({
    data: {
      email: data.owner.email,
      passwordHash: await hashPassword(data.owner.password),
      firstName: data.owner.firstName,
      lastName: data.owner.lastName,
      role: 'OWNER',
    },
  });

  // 2) Magazyn centralny
  const central = await prisma.branch.create({
    data: {
      type: 'CENTRAL_WAREHOUSE',
      name: data.centralBranch.name,
      city: data.centralBranch.city ?? undefined,
      address: data.centralBranch.address ?? undefined,
    },
  });
  await prisma.membership.create({
    data: { userId: owner.id, branchId: central.id, role: 'OWNER' },
  });

  // 3) Pakiety + kroki wymagane
  const packagesInput = data.packages?.length ? data.packages : DEFAULT_PACKAGES;
  for (const [index, p] of packagesInput.entries()) {
    const pkg = await prisma.package.create({
      data: {
        name: p.name,
        pricePerM2: p.pricePerM2,
        sortOrder: index + 1,
      },
    });
    const steps = [
      ...ALWAYS_REQUIRED_STEPS,
      ...(p.requiredSteps ?? DEFAULT_PACKAGES.find((d) => d.name === p.name)?.requiredSteps ?? []),
    ];
    let order = 1;
    for (const status of steps) {
      await prisma.requiredStep.create({
        data: { packageId: pkg.id, status, sortOrder: order++ },
      });
    }
  }

  // 4) SMTP
  if (data.smtp && data.smtp.host) {
    await prisma.systemSetting.upsert({
      where: { key: 'smtp' },
      update: { value: JSON.stringify(data.smtp) },
      create: { key: 'smtp', value: JSON.stringify(data.smtp) },
    });
  }
  // 5) SMS
  await prisma.systemSetting.upsert({
    where: { key: 'sms' },
    update: { value: JSON.stringify(data.sms ?? { provider: 'console', apiKey: '', sender: 'Pralnia' }) },
    create: { key: 'sms', value: JSON.stringify(data.sms ?? { provider: 'console', apiKey: '', sender: 'Pralnia' }) },
  });

  // 6) Branding + szablony
  await prisma.systemSetting.upsert({
    where: { key: 'branding' },
    update: { value: JSON.stringify(data.branding ?? {}) },
    create: { key: 'branding', value: JSON.stringify(data.branding ?? {}) },
  });

  const defaultTemplates = {
    'templates.email.order_accepted': {
      subject: 'Potwierdzenie przyjęcia zlecenia {{number}}',
      body:
        'Dzień dobry {{firstName}},\n\nDziękujemy za skorzystanie z naszych usług. Przyjęliśmy zlecenie nr {{number}}.\nLiczba dywanów: {{rugCount}}\nŁączna powierzchnia: {{areaM2}} m²\nŁączna kwota: {{totalPrice}} zł brutto\n\nPozdrawiamy,\nPralnia Dywanów',
    },
    'templates.email.ready_for_pickup': {
      subject: 'Twoje zlecenie {{number}} jest gotowe do odbioru',
      body:
        'Dzień dobry {{firstName}},\n\nInformujemy, że dywany ze zlecenia {{number}} są gotowe do odbioru.\n\nPozdrawiamy,\nPralnia Dywanów',
    },
    'templates.email.in_delivery': {
      subject: 'Dywany ze zlecenia {{number}} zostaną dziś doręczone',
      body:
        'Dzień dobry {{firstName}},\n\nKierowca wyrusza dziś z dywanami ze zlecenia {{number}}.\nKwota do pobrania: {{totalPrice}} zł.\n\nPozdrawiamy,\nPralnia Dywanów',
    },
    'templates.sms.order_accepted': {
      body: 'Pralnia: przyjęliśmy zlecenie {{number}}, dywany: {{rugCount}}, kwota: {{totalPrice}} zł.',
    },
    'templates.sms.ready_for_pickup': {
      body: 'Pralnia: zlecenie {{number}} gotowe do odbioru.',
    },
    'templates.sms.in_delivery': {
      body: 'Pralnia: zlecenie {{number}} w doręczeniu, kwota: {{totalPrice}} zł.',
    },
  };
  for (const [key, value] of Object.entries(defaultTemplates)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
  }

  // 7) Pula kodów QR
  const qrPoolSize = data.qrPoolSize ?? 200;
  const codes = Array.from({ length: qrPoolSize }, (_, i) =>
    `RUG-${Date.now().toString(36)}-${(i + 1).toString().padStart(5, '0')}`,
  );
  if (codes.length) {
    await prisma.$transaction(
      codes.map((c) => prisma.qrCode.create({ data: { code: c } })),
    );
  }

  res.json({ ok: true, ownerId: owner.id, branchId: central.id, qrPoolGenerated: codes.length });
});
