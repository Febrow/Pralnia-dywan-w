<?php
declare(strict_types=1);

class Db
{
    private static ?PDO $pdo = null;

    public static function get(): PDO
    {
        if (self::$pdo) return self::$pdo;
        $cfg = Config::load();
        $host = $cfg['db_host'] ?? 'localhost';
        $port = (int) ($cfg['db_port'] ?? 3306);
        $name = $cfg['db_name'] ?? '';
        $user = $cfg['db_user'] ?? '';
        $pass = $cfg['db_pass'] ?? '';
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $name);
        $opts = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        self::$pdo = new PDO($dsn, $user, $pass, $opts);
        return self::$pdo;
    }

    public static function isInstalled(): bool
    {
        if (!Config::exists()) return false;
        try {
            $row = self::get()->query("SELECT COUNT(*) AS c FROM users WHERE role='OWNER'")->fetch();
            return ((int) $row['c']) > 0;
        } catch (Throwable $e) {
            return false;
        }
    }

    /** Tworzy schemat tabel (idempotentnie). */
    public static function ensureSchema(): void
    {
        $sql = file_get_contents(__DIR__ . '/../sql/schema.sql');
        if ($sql === false) throw new RuntimeException('Brak schema.sql');
        // wykonujemy po jednym statemencie
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        $pdo = self::get();
        foreach ($statements as $stmt) {
            if ($stmt === '') continue;
            $pdo->exec($stmt);
        }
    }

    public static function cuid(): string
    {
        // Lekki zamiennik cuid: czasprefix + 12 losowych znaków base36
        $time = base_convert((string) (int) (microtime(true) * 1000), 10, 36);
        $rand = '';
        $alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
        for ($i = 0; $i < 12; $i++) {
            $rand .= $alphabet[random_int(0, 35)];
        }
        return 'c' . $time . $rand;
    }
}
