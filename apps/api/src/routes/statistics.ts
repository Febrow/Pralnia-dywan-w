import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRoles } from '../lib/auth.js';

export const statisticsRouter = Router();

statisticsRouter.get('/dashboard', requireRoles('OWNER'), async (_req, res) => {
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  const day = (startOfWeek.getDay() + 6) % 7; // Pn=0
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  async function statsForRange(from: Date) {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from } },
      include: { rugs: true },
    });
    const rugCount = orders.reduce((s, o) => s + o.rugs.length, 0);
    const area = orders.reduce((s, o) => s + o.rugs.reduce((a, r) => a + (r.areaM2 ?? 0), 0), 0);
    const value = orders.reduce((s, o) => s + (o.totalGrossPrice ?? 0), 0);
    return { orders: orders.length, rugs: rugCount, area: Number(area.toFixed(2)), value: Number(value.toFixed(2)) };
  }

  const [today, week, month] = await Promise.all([
    statsForRange(startOfDay),
    statsForRange(startOfWeek),
    statsForRange(startOfMonth),
  ]);

  const byStatus = await prisma.rug.groupBy({
    by: ['currentStatus'],
    _count: { _all: true },
  });
  const readyForPickup = byStatus.find((s) => s.currentStatus === 'READY_FOR_PICKUP')?._count._all ?? 0;
  const readyForDelivery = byStatus.find((s) => s.currentStatus === 'READY_FOR_DELIVERY')?._count._all ?? 0;
  const inDelivery = byStatus.find((s) => s.currentStatus === 'IN_DELIVERY')?._count._all ?? 0;

  res.json({ today, week, month, byStatus, readyForPickup, readyForDelivery, inDelivery });
});

statisticsRouter.get('/drivers-today', requireRoles('OWNER'), async (_req, res) => {
  const today = new Date();
  const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const drivers = await prisma.user.findMany({ where: { role: 'DRIVER', isActive: true } });
  const result = await Promise.all(
    drivers.map(async (d) => {
      const settlement = await prisma.driverDailySettlement.findUnique({
        where: { driverUserId_day: { driverUserId: d.id, day } },
        include: { items: true },
      });
      return {
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        rugsDelivered: settlement?.items.length ?? 0,
        cash: settlement?.totalCashCollected ?? 0,
        settlementId: settlement?.id ?? null,
        status: settlement?.status ?? 'PENDING',
      };
    }),
  );
  res.json(result);
});

statisticsRouter.get('/partners-month', requireRoles('OWNER'), async (_req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const partners = await prisma.branch.findMany({ where: { type: 'PARTNER' } });
  const result = await Promise.all(
    partners.map(async (p) => {
      const orders = await prisma.order.findMany({
        where: { partnerBranchId: p.id, createdAt: { gte: startOfMonth } },
        include: { rugs: true },
      });
      const totalRugs = orders.reduce((s, o) => s + o.rugs.length, 0);
      const totalArea = orders.reduce((s, o) => s + o.rugs.reduce((a, r) => a + (r.areaM2 ?? 0), 0), 0);
      const totalValue = orders.reduce((s, o) => s + (o.totalGrossPrice ?? 0), 0);
      return {
        id: p.id,
        name: p.name,
        orders: orders.length,
        rugs: totalRugs,
        area: Number(totalArea.toFixed(2)),
        value: Number(totalValue.toFixed(2)),
      };
    }),
  );
  res.json(result);
});
