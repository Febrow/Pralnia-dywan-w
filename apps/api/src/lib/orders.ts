import { prisma } from './prisma.js';
import { computeOrderStatus, STATUS_TO_LOCATION, RUG_STATUSES, ALLOWED_BY_ROLE } from './statuses.js';
import { renderTemplate, sendEmail, sendSms } from './notifications.js';

export async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const prefix = `${yyyy}${mm}${dd}`;
  const count = await prisma.order.count({ where: { number: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

export async function recomputeOrderTotals(orderId: string) {
  const rugs = await prisma.rug.findMany({ where: { orderId } });
  const totalAreaM2 = rugs.reduce((s, r) => s + (r.areaM2 ?? 0), 0);
  const totalGrossPrice = rugs.reduce((s, r) => s + (r.totalPrice ?? 0), 0);
  const computedStatus = computeOrderStatus(rugs.map((r) => r.currentStatus));
  await prisma.order.update({
    where: { id: orderId },
    data: { totalAreaM2, totalGrossPrice, computedStatus },
  });

  // Powiadomienie ALL_READY -> READY_FOR_PICKUP (tylko gdy klient sam dostarczył)
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { customer: true } });
  if (order && computedStatus === 'ALL_READY') {
    const allReadyForPickup = rugs.every((r) => r.currentStatus === 'READY_FOR_PICKUP');
    if (allReadyForPickup) {
      // Sprawdź, czy nie wysłaliśmy już tego powiadomienia
      const sent = await prisma.notificationLog.findFirst({
        where: { orderId: order.id, trigger: 'READY_FOR_PICKUP', channel: 'EMAIL' },
      });
      if (!sent) {
        const tplE = await getTemplate('templates.email.ready_for_pickup');
        const tplS = await getTemplate('templates.sms.ready_for_pickup');
        const vars = orderVars(order, rugs);
        await sendEmail({
          orderId: order.id,
          to: order.customer.email,
          subject: renderTemplate(tplE.subject ?? '', vars),
          body: renderTemplate(tplE.body ?? '', vars),
          trigger: 'READY_FOR_PICKUP',
        });
        await sendSms({
          orderId: order.id,
          to: order.customer.phone,
          body: renderTemplate(tplS.body ?? '', vars),
          trigger: 'READY_FOR_PICKUP',
        });
      }
    }
  }
}

export function orderVars(order: any, rugs: any[]) {
  return {
    number: order.number,
    firstName: order.customer?.firstName ?? '',
    lastName: order.customer?.lastName ?? '',
    rugCount: rugs.length,
    areaM2: Number(rugs.reduce((s, r) => s + (r.areaM2 ?? 0), 0)).toFixed(2),
    totalPrice: Number(rugs.reduce((s, r) => s + (r.totalPrice ?? 0), 0)).toFixed(2),
  };
}

export async function getTemplate(key: string): Promise<{ subject?: string; body?: string }> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row ? JSON.parse(row.value) : {};
}

export async function changeRugStatus(args: {
  rugId: string;
  toStatus: string;
  userId: string;
  userRole: string;
  source?: 'manual' | 'serial_scan' | 'system';
  comment?: string;
}) {
  if (!RUG_STATUSES.includes(args.toStatus as any)) {
    throw new Error(`Nieznany status: ${args.toStatus}`);
  }
  const allowed = ALLOWED_BY_ROLE[args.userRole];
  if (!allowed || !allowed.has(args.toStatus)) {
    throw new Error(`Twoja rola nie może nadać statusu „${args.toStatus}".`);
  }
  const rug = await prisma.rug.findUnique({ where: { id: args.rugId } });
  if (!rug) throw new Error('Nie znaleziono dywanu.');

  if (rug.currentStatus === args.toStatus) {
    return rug; // idempotentnie
  }

  const updated = await prisma.rug.update({
    where: { id: args.rugId },
    data: {
      currentStatus: args.toStatus,
      physicalLocation: STATUS_TO_LOCATION[args.toStatus] ?? rug.physicalLocation,
    },
  });
  await prisma.rugStatusEvent.create({
    data: {
      rugId: rug.id,
      fromStatus: rug.currentStatus,
      toStatus: args.toStatus,
      changedByUserId: args.userId,
      source: args.source ?? 'manual',
      comment: args.comment,
    },
  });

  // Rozliczenie kierowcy: przy DELIVERED_TO_CUSTOMER dopisz item
  if (args.toStatus === 'DELIVERED_TO_CUSTOMER' && updated.totalPrice && updated.totalPrice > 0) {
    const order = await prisma.order.findUnique({ where: { id: rug.orderId } });
    if (order?.driverId) {
      const today = new Date();
      const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const settlement = await prisma.driverDailySettlement.upsert({
        where: { driverUserId_day: { driverUserId: order.driverId, day } },
        update: { totalCashCollected: { increment: updated.totalPrice } },
        create: { driverUserId: order.driverId, day, totalCashCollected: updated.totalPrice },
      });
      await prisma.driverSettlementItem.create({
        data: {
          settlementId: settlement.id,
          orderId: order.id,
          rugId: rug.id,
          amountCollected: updated.totalPrice,
        },
      });
    }
  }

  await recomputeOrderTotals(rug.orderId);
  return updated;
}
