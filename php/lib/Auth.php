<?php
declare(strict_types=1);

class Auth
{
    /** @return array|null { id, email, role, firstName, lastName, primaryBranchId, primaryBranchType } */
    public static function current(): ?array
    {
        $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        // Niektóre konfiguracje Apache strippują nagłówek Authorization
        if (!$hdr && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $hdr = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }
        if (!$hdr || strncmp($hdr, 'Bearer ', 7) !== 0) return null;
        $token = trim(substr($hdr, 7));
        try {
            [$h, $p, $s] = explode('.', $token);
            $payload = json_decode(self::b64dec($p), true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($payload)) return null;
            if (($payload['exp'] ?? 0) < time()) return null;
            $cfg = Config::load();
            $secret = $cfg['jwt_secret'] ?? '';
            $check = hash_hmac('sha256', $h . '.' . $p, $secret, true);
            if (!hash_equals(self::b64dec($s), $check)) return null;
            return self::loadUser((string) $payload['sub']);
        } catch (Throwable $e) {
            return null;
        }
    }

    public static function require(): array
    {
        $u = self::current();
        if (!$u) {
            Json::error('Wymagane logowanie', 401);
            exit;
        }
        return $u;
    }

    public static function requireRoles(string ...$roles): array
    {
        $u = self::require();
        if (!in_array($u['role'], $roles, true)) {
            Json::error('Brak uprawnień', 403);
            exit;
        }
        return $u;
    }

    public static function sign(string $userId): string
    {
        $cfg = Config::load();
        $secret = $cfg['jwt_secret'] ?? '';
        $head = self::b64enc(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = self::b64enc(json_encode(['sub' => $userId, 'iat' => time(), 'exp' => time() + 12 * 3600]));
        $sig = self::b64enc(hash_hmac('sha256', $head . '.' . $payload, $secret, true));
        return $head . '.' . $payload . '.' . $sig;
    }

    public static function hashPassword(string $plain): string
    {
        return password_hash($plain, PASSWORD_BCRYPT);
    }

    public static function verifyPassword(string $plain, string $hash): bool
    {
        return password_verify($plain, $hash);
    }

    public static function loadUser(string $id): ?array
    {
        $st = Db::get()->prepare(
            'SELECT u.*, m.branchId AS membershipBranchId, b.type AS branchType
             FROM users u
             LEFT JOIN memberships m ON m.userId = u.id
             LEFT JOIN branches b ON b.id = m.branchId
             WHERE u.id = ? LIMIT 1'
        );
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row || !$row['isActive']) return null;
        return [
            'id' => $row['id'],
            'email' => $row['email'],
            'role' => $row['role'],
            'firstName' => $row['firstName'],
            'lastName' => $row['lastName'],
            'primaryBranchId' => $row['membershipBranchId'] ?? null,
            'primaryBranchType' => $row['branchType'] ?? null,
        ];
    }

    private static function b64enc(string $s): string
    {
        return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
    }

    private static function b64dec(string $s): string
    {
        $pad = strlen($s) % 4;
        if ($pad) $s .= str_repeat('=', 4 - $pad);
        return base64_decode(strtr($s, '-_', '+/'));
    }
}
