import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireRoles, type AuthRequest } from '../lib/auth.js';
import { generateOrderNumber, getTemplate, orderVars, recomputeOrderTotals } from '../lib/orders.js';
import { renderTemplate, sendEmail, sendSms } from '../lib/notifications.js';
import { STATUS_TO_LOCATION } from '../lib/statuses.js';

export const ordersRouter = Router();

// ============ Lista zleceń (z RBAC) ============
ordersRouter.get('/', async (req: AuthRequest, res) => {
  const role = req.user!.role;
  const branchId = req.user!.primaryBranchId;
  const where: any = {};

  switch (role) {
    case 'OWNER':
    case 'LOGISTICS':
    case 'WASHING_WORKER':
      break; // pełen widok
    case 'STATIONARY_BRANCH_WORKER':
      if (branchId) where.acceptingBranchId = branchId;
      break;
    case 'PARTNER_BRANCH':
      if (branchId) where.partnerBranchId = branchId;
      break;
    case 'STATIONARY_BRANCH':
      if (branchId) where.acceptingBranchId = branchId;
      break;
    case 'DRIVER':
      where.driverId = req.user!.id;
      break;
  }

  const q = String(req.query.q ?? '').trim();
  if (q) {
    where.OR = [
      { number: { contains: q } },
      { customer: { firstName: { contains: q } } },
      { customer: { lastName: { contains: q } } },
      { customer: { phone: { contains: q } } },
      { customer: { email: { contains: q } } },
      { rugs: { some: { qrCode: { contains: q } } } },
    ];
  }
  if (req.query.status) where.computedStatus = String(req.query.status);
  if (req.query.source) where.source = String(req.query.source);

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: true,
      rugs: { include: { package: true } },
      acceptingBranch: true,
      partnerBranch: true,
      driver: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  res.json(orders);
});

// ============ Pojedyncze zlecenie ============
ordersRouter.get('/:id', async (req: AuthRequest, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      rugs: {
        include: {
          package: true,
          photos: true,
          statusEvents: { orderBy: { changedAt: 'desc' } },
        },
      },
      acceptingBranch: true,
      partnerBranch: true,
      driver: { select: { id: true, firstName: true, lastName: true, email: true } },
      notifications: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!order) return res.status(404).json({ error: 'Nie znaleziono.' });
  res.json(order);
});

// ============ Tworzenie zlecenia ============
const addressSchema = z
  .object({
    street: z.string().optional(),
    houseNo: z.string().optional(),
    apartmentNo: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
  })
  .optional()
  .nullable();

const createSchema = z.object({
  source: z.enum(['STATIONARY', 'CENTRAL_WAREHOUSE', 'LOGISTICS_PHONE', 'DRIVER_FIELD', 'PARTNER']),
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email(),
  }),
  pickupAddress: addressSchema,
  deliveryAddress: addressSchema,
  notesForDriver: z.string().optional(),
  internalNotes: z.string().optional(),
  declaredRugCount: z.number().int().nonnegative().optional(),
  partnerBranchId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
  acceptingBranchId: z.string().optional().nullable(),
});

ordersRouter.post('/', async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane', details: parsed.error.flatten() });
  const data = parsed.data;
  const role = req.user!.role;

  // Walidacja per rola
  const allowedSources: Record<string, string[]> = {
    OWNER: ['STATIONARY', 'CENTRAL_WAREHOUSE', 'LOGISTICS_PHONE', 'DRIVER_FIELD', 'PARTNER'],
    STATIONARY_BRANCH_WORKER: ['STATIONARY', 'CENTRAL_WAREHOUSE'],
    LOGISTICS: ['LOGISTICS_PHONE'],
    DRIVER: ['DRIVER_FIELD'],
    PARTNER_BRANCH: ['PARTNER'],
    STATIONARY_BRANCH: ['STATIONARY'],
  };
  if (!allowedSources[role]?.includes(data.source)) {
    return res.status(403).json({ error: 'Twoja rola nie może utworzyć zlecenia tego typu.' });
  }

  // Klient (find-or-create)
  let customer = await prisma.customer.findFirst({
    where: { OR: [{ phone: data.customer.phone }, { email: data.customer.email }] },
  });
  if (!customer) customer = await prisma.customer.create({ data: data.customer });

  // Placówka przyjmująca
  let acceptingBranchId = data.acceptingBranchId ?? req.user!.primaryBranchId;
  if (!acceptingBranchId) {
    const central = await prisma.branch.findFirst({ where: { type: 'CENTRAL_WAREHOUSE' } });
    if (!central) return res.status(500).json({ error: 'Brak magazynu centralnego.' });
    acceptingBranchId = central.id;
  }

  const number = await generateOrderNumber();
  const order = await prisma.order.create({
    data: {
      number,
      source: data.source,
      acceptingBranchId,
      acceptingUserId: req.user!.id,
      customerId: customer.id,
      pickupAddress: data.pickupAddress ? JSON.stringify(data.pickupAddress) : null,
      deliveryAddress: data.deliveryAddress ? JSON.stringify(data.deliveryAddress) : null,
      notesForDriver: data.notesForDriver,
      internalNotes: data.internalNotes,
      declaredRugCount: data.declaredRugCount,
      partnerBranchId: data.partnerBranchId ?? (role === 'PARTNER_BRANCH' ? req.user!.primaryBranchId : null),
      driverId: data.driverId ?? (role === 'DRIVER' ? req.user!.id : null),
    },
  });
  res.json({ id: order.id, number: order.number });
});

// ============ Dodanie dywanu do zlecenia ============
const rugSchema = z.object({
  qrCode: z.string().min(1),
  widthCm: z.number().int().positive().optional().nullable(),
  heightCm: z.number().int().positive().optional().nullable(),
  packageId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

ordersRouter.post('/:id/rugs', async (req: AuthRequest, res) => {
  const parsed = rugSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Brak zlecenia.' });

  // Kod QR: musi istnieć w puli i być AVAILABLE
  const code = await prisma.qrCode.findUnique({ where: { code: parsed.data.qrCode } });
  if (!code) return res.status(400).json({ error: 'Ten kod QR nie istnieje w puli.' });
  if (code.status === 'ASSIGNED') {
    return res.status(409).json({ error: 'Ten kod QR jest już przypisany do innego dywanu.' });
  }

  // Cena
  let pricePerM2: number | null = null;
  if (parsed.data.packageId) {
    const pkg = await prisma.package.findUnique({ where: { id: parsed.data.packageId } });
    if (!pkg) return res.status(400).json({ error: 'Nieznany pakiet.' });
    pricePerM2 = pkg.pricePerM2;
    // Cennik partnerski
    if (order.source === 'PARTNER' && order.partnerBranchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: order.partnerBranchId },
        include: { partnerPriceList: { include: { items: true } } },
      });
      const item = branch?.partnerPriceList?.items.find((it) => it.packageId === pkg.id);
      if (item) pricePerM2 = item.pricePerM2;
    }
  }
  let areaM2: number | null = null;
  let totalPrice: number | null = null;
  if (parsed.data.widthCm && parsed.data.heightCm) {
    areaM2 = (parsed.data.widthCm * parsed.data.heightCm) / 10000;
    if (pricePerM2) totalPrice = areaM2 * pricePerM2;
  }

  // Status początkowy zależny od źródła
  const startStatus = (() => {
    switch (order.source) {
      case 'STATIONARY': return 'ACCEPTED_AT_CENTRAL'; // dla MVP traktujemy jako magazyn centralny
      case 'CENTRAL_WAREHOUSE': return 'ACCEPTED_AT_CENTRAL';
      case 'LOGISTICS_PHONE': return 'ORDER_PICKUP_ACCEPTED';
      case 'DRIVER_FIELD': return 'PICKED_UP_FROM_CUSTOMER';
      case 'PARTNER': return 'ACCEPTED_AT_PARTNER';
      default: return 'ACCEPTED_AT_CENTRAL';
    }
  })();

  const rug = await prisma.rug.create({
    data: {
      orderId: order.id,
      qrCode: parsed.data.qrCode,
      widthCm: parsed.data.widthCm ?? null,
      heightCm: parsed.data.heightCm ?? null,
      areaM2,
      packageId: parsed.data.packageId ?? null,
      pricePerM2,
      totalPrice,
      notes: parsed.data.notes ?? null,
      currentStatus: startStatus,
      physicalLocation: STATUS_TO_LOCATION[startStatus] ?? null,
      isFromPartner: order.source === 'PARTNER',
      isFromDriverPickup: order.source === 'DRIVER_FIELD' || order.source === 'LOGISTICS_PHONE',
    },
  });

  await prisma.qrCode.update({ where: { code: parsed.data.qrCode }, data: { status: 'ASSIGNED', rugId: rug.id } });
  await prisma.rugStatusEvent.create({
    data: {
      rugId: rug.id,
      fromStatus: null,
      toStatus: startStatus,
      changedByUserId: req.user!.id,
      source: 'system',
      comment: 'Utworzenie dywanu',
    },
  });
  await recomputeOrderTotals(order.id);
  res.json({ id: rug.id });
});

// ============ Finalizacja zlecenia (wysyłka powiadomień) ============
ordersRouter.post('/:id/finalize', async (req: AuthRequest, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { customer: true, rugs: true },
  });
  if (!order) return res.status(404).json({ error: 'Brak zlecenia.' });

  // Czy już wysłaliśmy powiadomienie ORDER_ACCEPTED?
  const sent = await prisma.notificationLog.findFirst({
    where: { orderId: order.id, trigger: 'ORDER_ACCEPTED' },
  });
  if (sent) return res.json({ ok: true, alreadyNotified: true });

  // Tylko jeżeli źródło = STATIONARY/CENTRAL_WAREHOUSE wyślij od razu (klient zna cenę).
  // Dla pozostałych źródeł powiadomienie zostanie wysłane po przyjęciu w magazynie.
  if (!['STATIONARY', 'CENTRAL_WAREHOUSE'].includes(order.source)) {
    return res.json({ ok: true, deferred: true });
  }

  const tplE = await getTemplate('templates.email.order_accepted');
  const tplS = await getTemplate('templates.sms.order_accepted');
  const vars = orderVars(order, order.rugs);
  await sendEmail({
    orderId: order.id,
    to: order.customer.email,
    subject: renderTemplate(tplE.subject ?? '', vars),
    body: renderTemplate(tplE.body ?? '', vars),
    trigger: 'ORDER_ACCEPTED',
  });
  await sendSms({
    orderId: order.id,
    to: order.customer.phone,
    body: renderTemplate(tplS.body ?? '', vars),
    trigger: 'ORDER_ACCEPTED',
  });
  res.json({ ok: true });
});

// ============ Przypisanie kierowcy ============
const assignDriverSchema = z.object({ driverId: z.string() });
ordersRouter.post(
  '/:id/assign-driver',
  requireRoles('OWNER', 'LOGISTICS'),
  async (req, res) => {
    const parsed = assignDriverSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { driverId: parsed.data.driverId },
    });
    res.json({ id: order.id });
  },
);

// ============ Aktualizacja zlecenia (uzupełnianie pomiaru / notatek) ============
const updateOrderSchema = z.object({
  pickupAddress: addressSchema,
  deliveryAddress: addressSchema,
  notesForDriver: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
});

ordersRouter.put('/:id', async (req: AuthRequest, res) => {
  const parsed = updateOrderSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Niepoprawne dane' });
  const data: any = { ...parsed.data };
  if (data.pickupAddress !== undefined) {
    data.pickupAddress = data.pickupAddress ? JSON.stringify(data.pickupAddress) : null;
  }
  if (data.deliveryAddress !== undefined) {
    data.deliveryAddress = data.deliveryAddress ? JSON.stringify(data.deliveryAddress) : null;
  }
  const order = await prisma.order.update({ where: { id: req.params.id }, data });
  res.json({ id: order.id });
});
