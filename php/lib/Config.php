<?php
declare(strict_types=1);

class Config
{
    /**
     * Ścieżka do pliku z konfiguracją bazy/aplikacji. Tworzy go instalator.
     * Plik trzymamy w katalogu `config/` obok `index.php` — poza document_root
     * pliku publicznego (jest zablokowany przez .htaccess + dodatkowo można go
     * przenieść poza public_html w README — patrz docs/SEOHOST.md).
     */
    public static function path(): string
    {
        return __DIR__ . '/../config/config.php';
    }

    public static function exists(): bool
    {
        return is_file(self::path());
    }

    /** @return array<string, mixed> */
    public static function load(): array
    {
        if (!self::exists()) {
            return [];
        }
        /** @noinspection PhpIncludeInspection */
        return (array) include self::path();
    }

    /** @param array<string, mixed> $cfg */
    public static function save(array $cfg): void
    {
        $dir = dirname(self::path());
        if (!is_dir($dir)) {
            mkdir($dir, 0750, true);
        }
        $php = "<?php\nreturn " . var_export($cfg, true) . ";\n";
        file_put_contents(self::path(), $php);
        @chmod(self::path(), 0640);
    }

    public static function uploadsDir(): string
    {
        $cfg = self::load();
        $dir = $cfg['upload_dir'] ?? (__DIR__ . '/../uploads');
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        return $dir;
    }

    public static function uploadsUrl(): string
    {
        // Folder uploads/ jest serwowany przez Apache spod tego samego hosta.
        return '/uploads';
    }
}
