<?php
declare(strict_types=1);

class OrderHelpers
{
    public static function generateOrderNumber(): string
    {
        $prefix = date('Ymd');
        $st = Db::get()->prepare("SELECT COUNT(*) AS c FROM orders WHERE number LIKE ?");
        $st->execute([$prefix . '%']);
        $count = (int) ($st->fetch()['c'] ?? 0);
        return $prefix . '-' . str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
    }

    public static function recomputeOrderTotals(string $orderId): void
    {
        $pdo = Db::get();
        $st = $pdo->prepare('SELECT areaM2, totalPrice, currentStatus FROM rugs WHERE orderId = ?');
        $st->execute([$orderId]);
        $rugs = $st->fetchAll();

        $totalArea = 0.0;
        $totalPrice = 0.0;
        $statuses = [];
        foreach ($rugs as $r) {
            $totalArea += (float) ($r['areaM2'] ?? 0);
            $totalPrice += (float) ($r['totalPrice'] ?? 0);
            $statuses[] = $r['currentStatus'];
        }
        $computed = Statuses::compute($statuses);

        $up = $pdo->prepare('UPDATE orders SET totalAreaM2 = ?, totalGrossPrice = ?, computedStatus = ? WHERE id = ?');
        $up->execute([round($totalArea, 2), round($totalPrice, 2), $computed, $orderId]);

        // ALL_READY: wyślij powiadomienie "gotowe do odbioru" (gdy wszystkie rugs = READY_FOR_PICKUP)
        if ($computed === 'ALL_READY' && $rugs) {
            $allReadyForPickup = !array_filter($statuses, fn($s) => $s !== 'READY_FOR_PICKUP');
            if ($allReadyForPickup) {
                $check = $pdo->prepare("SELECT COUNT(*) AS c FROM notification_logs WHERE orderId=? AND trigger_event='READY_FOR_PICKUP'");
                $check->execute([$orderId]);
                if (((int) ($check->fetch()['c'] ?? 0)) === 0) {
                    self::sendReadyForPickup($orderId);
                }
            }
        }
    }

    private static function sendReadyForPickup(string $orderId): void
    {
        $order = self::loadOrderForVars($orderId);
        if (!$order) return;
        $vars = self::orderVars($order);
        $tpl = Notifications::template('templates.email.ready_for_pickup');
        $sms = Notifications::template('templates.sms.ready_for_pickup');
        Notifications::sendEmail([
            'orderId' => $orderId,
            'to' => $order['customer_email'],
            'subject' => Notifications::render($tpl['subject'] ?? '', $vars),
            'body' => Notifications::render($tpl['body'] ?? '', $vars),
            'trigger' => 'READY_FOR_PICKUP',
        ]);
        Notifications::sendSms([
            'orderId' => $orderId,
            'to' => $order['customer_phone'],
            'body' => Notifications::render($sms['body'] ?? '', $vars),
            'trigger' => 'READY_FOR_PICKUP',
        ]);
    }

    public static function loadOrderForVars(string $orderId): ?array
    {
        $st = Db::get()->prepare(
            'SELECT o.*, c.firstName AS customer_firstName, c.lastName AS customer_lastName,
                    c.phone AS customer_phone, c.email AS customer_email
             FROM orders o JOIN customers c ON c.id = o.customerId WHERE o.id = ?'
        );
        $st->execute([$orderId]);
        $row = $st->fetch();
        if (!$row) return null;
        $st2 = Db::get()->prepare('SELECT id, qrCode, areaM2, totalPrice FROM rugs WHERE orderId = ?');
        $st2->execute([$orderId]);
        $row['rugs'] = $st2->fetchAll();
        return $row;
    }

    public static function orderVars(array $order): array
    {
        $rugs = $order['rugs'] ?? [];
        $area = 0.0; $price = 0.0;
        foreach ($rugs as $r) {
            $area += (float) ($r['areaM2'] ?? 0);
            $price += (float) ($r['totalPrice'] ?? 0);
        }
        return [
            'number' => $order['number'],
            'firstName' => $order['customer_firstName'] ?? '',
            'lastName' => $order['customer_lastName'] ?? '',
            'rugCount' => count($rugs),
            'areaM2' => number_format($area, 2, '.', ''),
            'totalPrice' => number_format($price, 2, '.', ''),
        ];
    }

    /** @return array{0: array, 1: ?string} (rug_after_update, error) */
    public static function changeRugStatus(string $rugId, string $toStatus, string $userId, string $userRole, string $source = 'manual', ?string $comment = null): array
    {
        if (!in_array($toStatus, Statuses::RUG_STATUSES, true)) {
            return [[], 'Nieznany status: ' . $toStatus];
        }
        $allowed = Statuses::ALLOWED_BY_ROLE[$userRole] ?? null;
        if ($allowed !== null && !in_array($toStatus, $allowed, true)) {
            return [[], 'Twoja rola nie może nadać statusu „' . $toStatus . '".'];
        }
        $pdo = Db::get();
        $st = $pdo->prepare('SELECT * FROM rugs WHERE id = ?');
        $st->execute([$rugId]);
        $rug = $st->fetch();
        if (!$rug) return [[], 'Nie znaleziono dywanu.'];

        if ($rug['currentStatus'] === $toStatus) {
            return [$rug, null]; // idempotentnie
        }

        $location = Statuses::STATUS_TO_LOCATION[$toStatus] ?? $rug['physicalLocation'];
        $up = $pdo->prepare('UPDATE rugs SET currentStatus = ?, physicalLocation = ? WHERE id = ?');
        $up->execute([$toStatus, $location, $rugId]);

        $ev = $pdo->prepare(
            'INSERT INTO rug_status_events (id, rugId, fromStatus, toStatus, changedByUserId, source, comment)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $ev->execute([Db::cuid(), $rugId, $rug['currentStatus'], $toStatus, $userId, $source, $comment]);

        // Rozliczenie kierowcy: DELIVERED_TO_CUSTOMER + cena > 0
        if ($toStatus === 'DELIVERED_TO_CUSTOMER' && (float) ($rug['totalPrice'] ?? 0) > 0) {
            $ord = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
            $ord->execute([$rug['orderId']]);
            $order = $ord->fetch();
            if ($order && !empty($order['driverId'])) {
                $day = date('Y-m-d');
                $sel = $pdo->prepare('SELECT id FROM driver_daily_settlements WHERE driverUserId = ? AND day = ?');
                $sel->execute([$order['driverId'], $day]);
                $sid = $sel->fetchColumn();
                if (!$sid) {
                    $sid = Db::cuid();
                    $ins = $pdo->prepare('INSERT INTO driver_daily_settlements (id, driverUserId, day, totalCashCollected) VALUES (?, ?, ?, ?)');
                    $ins->execute([$sid, $order['driverId'], $day, $rug['totalPrice']]);
                } else {
                    $upS = $pdo->prepare('UPDATE driver_daily_settlements SET totalCashCollected = totalCashCollected + ? WHERE id = ?');
                    $upS->execute([$rug['totalPrice'], $sid]);
                }
                $iIt = $pdo->prepare(
                    'INSERT INTO driver_settlement_items (id, settlementId, orderId, rugId, amountCollected) VALUES (?, ?, ?, ?, ?)'
                );
                $iIt->execute([Db::cuid(), $sid, $order['id'], $rug['id'], $rug['totalPrice']]);
            }
        }

        self::recomputeOrderTotals($rug['orderId']);
        $st->execute([$rugId]);
        return [$st->fetch(), null];
    }
}
