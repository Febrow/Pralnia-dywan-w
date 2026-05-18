<?php
declare(strict_types=1);

class Notifications
{
    /** @return array<string, mixed>|null */
    public static function setting(string $key): ?array
    {
        $st = Db::get()->prepare('SELECT value FROM system_settings WHERE setting_key = ?');
        $st->execute([$key]);
        $row = $st->fetch();
        if (!$row) return null;
        try {
            $val = json_decode((string) $row['value'], true, 512, JSON_THROW_ON_ERROR);
            return is_array($val) ? $val : null;
        } catch (Throwable $e) {
            return null;
        }
    }

    public static function template(string $key): array
    {
        return self::setting($key) ?? [];
    }

    public static function render(string $tpl, array $vars): string
    {
        return preg_replace_callback('/\{\{\s*(\w+)\s*\}\}/u', function ($m) use ($vars) {
            return (string) ($vars[$m[1]] ?? '');
        }, $tpl) ?? $tpl;
    }

    public static function logRow(string $orderId, string $channel, string $trigger, string $to, ?string $subject, string $body): string
    {
        $id = Db::cuid();
        $st = Db::get()->prepare(
            'INSERT INTO notification_logs (id, orderId, channel, trigger_event, toAddress, subject, body, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $st->execute([$id, $orderId, $channel, $trigger, $to, $subject, $body, 'QUEUED']);
        return $id;
    }

    public static function markSent(string $id, ?string $providerMessageId = null): void
    {
        $st = Db::get()->prepare('UPDATE notification_logs SET status=?, sentAt=NOW(), providerMessageId=? WHERE id=?');
        $st->execute(['SENT', $providerMessageId, $id]);
    }

    public static function markFailed(string $id, string $error): void
    {
        $st = Db::get()->prepare('UPDATE notification_logs SET status=?, error=? WHERE id=?');
        $st->execute(['FAILED', $error, $id]);
    }

    /** @param array<string, mixed> $args  required: orderId, to, subject, body, trigger */
    public static function sendEmail(array $args): void
    {
        $logId = self::logRow($args['orderId'], 'EMAIL', $args['trigger'], $args['to'], $args['subject'], $args['body']);
        $cfg = self::setting('smtp');
        if (!$cfg || empty($cfg['host'])) {
            self::markFailed($logId, 'Brak konfiguracji SMTP.');
            return;
        }
        try {
            $sent = self::smtpSend($cfg, $args['to'], $args['subject'] ?? '', $args['body']);
            self::markSent($logId, $sent);
        } catch (Throwable $e) {
            self::markFailed($logId, $e->getMessage());
        }
    }

    public static function sendSms(array $args): void
    {
        $logId = self::logRow($args['orderId'], 'SMS', $args['trigger'], $args['to'], null, $args['body']);
        $cfg = self::setting('sms');
        if (!$cfg) {
            self::markFailed($logId, 'Brak konfiguracji SMS.');
            return;
        }
        $provider = $cfg['provider'] ?? 'console';
        if ($provider === 'console' || empty($cfg['apiKey'])) {
            error_log('[SMS-CONSOLE] do=' . $args['to'] . ' treść=' . $args['body']);
            self::markSent($logId, 'console-' . $logId);
            return;
        }
        if ($provider === 'smsapi') {
            try {
                $result = self::smsApiSend($cfg, $args['to'], $args['body']);
                self::markSent($logId, (string) ($result ?? null));
            } catch (Throwable $e) {
                self::markFailed($logId, $e->getMessage());
            }
            return;
        }
        self::markFailed($logId, sprintf('Provider "%s" wymaga implementacji.', $provider));
    }

    /** Minimalny klient SMTP: SSL/465 lub STARTTLS/587, AUTH LOGIN. */
    private static function smtpSend(array $cfg, string $to, string $subject, string $body): ?string
    {
        $host = $cfg['host'];
        $port = (int) ($cfg['port'] ?? 587);
        $secure = !empty($cfg['secure']);
        $user = $cfg['user'] ?? '';
        $pass = $cfg['password'] ?? '';
        $from = $cfg['from'] ?? $user;
        $fromName = $cfg['fromName'] ?? '';

        $remote = ($secure ? 'ssl://' : '') . $host . ':' . $port;
        $errno = 0;
        $errstr = '';
        $fp = @stream_socket_client($remote, $errno, $errstr, 15);
        if (!$fp) throw new RuntimeException("SMTP connect failed: $errstr ($errno)");
        stream_set_timeout($fp, 15);
        $read = function () use ($fp): string {
            $resp = '';
            while (!feof($fp)) {
                $line = fgets($fp, 515);
                if ($line === false) break;
                $resp .= $line;
                if (strlen($line) > 3 && $line[3] === ' ') break;
            }
            return $resp;
        };
        $write = function (string $cmd) use ($fp) {
            fwrite($fp, $cmd . "\r\n");
        };
        $expect = function (string $resp, string $code) {
            if (strncmp($resp, $code, 3) !== 0) {
                throw new RuntimeException('SMTP error: ' . trim($resp));
            }
        };
        $expect($read(), '220');
        $write('EHLO localhost'); $expect($read(), '250');
        if (!$secure) {
            // spróbuj STARTTLS jeśli serwer wspiera
            $write('STARTTLS');
            $expect($read(), '220');
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('STARTTLS failed');
            }
            $write('EHLO localhost'); $expect($read(), '250');
        }
        if ($user && $pass) {
            $write('AUTH LOGIN'); $expect($read(), '334');
            $write(base64_encode($user)); $expect($read(), '334');
            $write(base64_encode($pass)); $expect($read(), '235');
        }
        $write('MAIL FROM: <' . $from . '>'); $expect($read(), '250');
        $write('RCPT TO: <' . $to . '>'); $expect($read(), '250');
        $write('DATA'); $expect($read(), '354');

        $headers = [];
        $fromHeader = $fromName ? sprintf('"%s" <%s>', addslashes($fromName), $from) : $from;
        $headers[] = 'From: ' . $fromHeader;
        $headers[] = 'To: ' . $to;
        $headers[] = 'Subject: ' . self::encodeMimeHeader($subject);
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: 8bit';
        $headers[] = 'Date: ' . date('r');
        $msg = implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n.", "\n..", $body) . "\r\n.";
        $write($msg);
        $expect($read(), '250');
        $write('QUIT');
        fclose($fp);
        return null;
    }

    private static function encodeMimeHeader(string $s): string
    {
        if (preg_match('/[^\x20-\x7E]/', $s)) {
            return '=?UTF-8?B?' . base64_encode($s) . '?=';
        }
        return $s;
    }

    /** Bardzo prosta integracja z SMSAPI.pl (REST). */
    private static function smsApiSend(array $cfg, string $to, string $body): ?string
    {
        $token = $cfg['apiKey'];
        $sender = $cfg['sender'] ?? 'Test';
        $ch = curl_init('https://api.smsapi.pl/sms.do');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token],
            CURLOPT_POSTFIELDS => http_build_query([
                'to' => $to,
                'message' => $body,
                'from' => $sender,
                'format' => 'json',
                'encoding' => 'utf-8',
            ]),
        ]);
        $resp = curl_exec($ch);
        if ($resp === false) {
            $err = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException('SMS HTTP error: ' . $err);
        }
        $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($http >= 400) throw new RuntimeException('SMS API HTTP ' . $http . ': ' . substr((string) $resp, 0, 200));
        $data = json_decode((string) $resp, true);
        if (isset($data['error'])) throw new RuntimeException('SMS API error: ' . ($data['message'] ?? 'unknown'));
        return $data['list'][0]['id'] ?? null;
    }
}
