# Pralnia Dywanów — wariant PHP/MySQL (hosting współdzielony)

Wariant pod **hosting współdzielony** (np. SeoHost.pl, mydevil.net, home.pl,
AttHost itp.) — backend napisany w czystym **PHP 8 + MySQL (PDO)**, frontend
to ten sam **PWA** w React.

> Inne warianty są na innych gałęziach repo:
>
> - `feat/full-mvp` — backend Node.js + MySQL (dla VPS lub Dockera).
> - `main` — sama dokumentacja produktu.

## Instalacja krok po kroku (dla laika)

👉 **[docs/SEOHOST.md](docs/SEOHOST.md)** — kompletna instrukcja dla
pakietu hostingowego SeoHost.pl. Bez SSH, bez linii poleceń. Wystarczy
panel + FTP.

W skrócie:

1. W panelu hostingu utwórz bazę MySQL.
2. Wgraj pliki na FTP do `public_html`.
3. Wejdź na swoją domenę → kreator instalacji w przeglądarce (6 kroków).

## Wymagania

- **PHP 8.0+** z rozszerzeniami: `pdo_mysql`, `mbstring`, `json`,
  `openssl`, `curl`.
- **MySQL 5.7+** lub **MariaDB 10.4+**.
- Włączony `mod_rewrite` (na SeoHost jest domyślnie).
- Wsparcie dla `.htaccess` (Apache) — standard na hostingu współdzielonym.

## Struktura plików

```
apps/web/dist/            ← zbudowany frontend (HTML/JS/CSS)
                            wgrywasz zawartość do public_html/
php/                      ← backend PHP
  index.php                  router (front controller)
  .htaccess                  routing API
  lib/                       Auth, Db, Router, Notifications, ...
  sql/schema.sql             schema bazy (CREATE TABLE IF NOT EXISTS)
  config/config.php          stworzy go instalator (NIE COMMITUJ)
  uploads/                   zdjęcia dywanów (uploady)
docs/SEOHOST.md           ← instrukcja krok po kroku dla hostingu SeoHost
docs/                     ← reszta dokumentacji (specyfikacja, model, role)
```

## Endpointy API (w `/api/*`)

Identyczne jak w wariancie Node.js: `auth/login`, `me`, `orders`, `rugs`,
`scan/bulk`, `qr-pool`, `packages`, `branches`, `users`, `customers`,
`photos/:rugId`, `settings`, `settlements`, `statistics/dashboard`,
`statistics/drivers-today`, `statistics/partners-month`, `install/status`,
`install/run`.

## Frontend

Wszystkie panele/role i layouty desktop+mobile z wariantu Node.js są
identyczne. Frontend tworzy się komendą `npm install && npm run build` w
katalogu głównym. W repo wystarczy raz zbudować — produkt to katalog
`apps/web/dist/`.

## Co jest gotowe

- Cały kreator instalacji (6 kroków: właściciel, magazyn centralny,
  baza MySQL, SMTP, SMS, pula QR).
- Logowanie JWT (HS256), RBAC w API.
- Wszystkie 7 paneli ról (z osobnymi layoutami desktop/mobile + panel
  kierowcy tylko mobile).
- Skanowanie QR pojedyncze i seryjne, automatyczna wycena.
- Pula kodów QR (generowanie i przypisywanie).
- Cenniki partnerskie.
- Rozliczenia gotówki kierowców (dziennie).
- Powiadomienia e-mail (własny prosty SMTP w PHP) + SMS (SMSAPI.pl).
- Konfiguracja SMTP/SMS/szablonów wiadomości w panelu właściciela.
- Upload zdjęć dywanów.

## Co świadomie zostawione jako TODO

- Dokładniejsze walidacje przejść statusów per pakiet.
- Pełne dashboardy z wykresami (są endpointy + tabele).
- Integracja z centralą telefoniczną (wymaga API konkretnego dostawcy).

## Smoke test

Wariant jest przetestowany end-to-end w środowisku PHP 8.2 + Apache +
MySQL 8 (Docker). Sprawdzono: instalator, logowanie, listę pakietów,
pulę QR, tworzenie zlecenia z dywanem, automatyczną wycenę
(6 m² × 25 zł/m² = 150 zł), skanowanie seryjne ze zmianą statusu,
statystyki dashboard.
