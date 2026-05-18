<?php
declare(strict_types=1);

// Prosty front controller dla całej aplikacji (PHP, hosting współdzielony).

session_start();
date_default_timezone_set('Europe/Warsaw');
mb_internal_encoding('UTF-8');

require __DIR__ . '/lib/Config.php';
require __DIR__ . '/lib/Db.php';
require __DIR__ . '/lib/Auth.php';
require __DIR__ . '/lib/Json.php';
require __DIR__ . '/lib/Notifications.php';
require __DIR__ . '/lib/OrderHelpers.php';
require __DIR__ . '/lib/Statuses.php';
require __DIR__ . '/lib/Router.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

// 1) Wszystkie żądania API obsługujemy w PHP
if (strncmp($path, '/api/', 5) === 0) {
    Router::dispatch($path);
    exit;
}

// 2) Pozostałe żądania (front PWA / SPA) — serwujemy index.html z folderu z buildem
$webDist = __DIR__ . '/../public/index.html';
if (is_file($webDist)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($webDist);
} else {
    http_response_code(404);
    echo 'Brak zbudowanego frontendu (../public/index.html). Wgraj zawartość apps/web/dist do katalogu public/.';
}
