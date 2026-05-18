# Pralnia Dywanów — System zarządzania (PWA)

Pełen, działający szkielet aplikacji webowej (PWA) do zarządzania pralnią
dywanów. Monorepo zawiera backend i frontend, instalator (kreator
pierwszego uruchomienia) oraz wszystkie 7 paneli ról (właściciel,
pracownik placówki, pracownik prania, kierowca, logistyka, partner,
placówka sieci).

> Dokumentacja produktu: [`docs/`](docs/) — specyfikacja, model danych,
> role, statusy, plan etapów.

## Wymagania

- **Node.js 20+** (testowane na 22).
- npm (jest dołączony).

## Pierwsze uruchomienie

```bash
# 1. Zainstaluj zależności + przygotuj bazę + zbuduj frontend
npm run setup

# 2. Uruchom aplikację (backend + serwowanie zbudowanego frontu)
npm start
```

Otwórz przeglądarkę na **http://localhost:3000**. System wykryje, że nie
ma jeszcze konta właściciela i pokaże **kreator instalacji** (5 kroków):

1. Konto właściciela (e-mail, hasło, imię i nazwisko).
2. Magazyn centralny (nazwa, miasto, adres).
3. SMTP (opcjonalnie — możesz pominąć i ustawić później).
4. SMS (domyślnie „Console" — SMS-y idą tylko do logów; możesz wybrać
   dostawcę później).
5. Pula kodów QR (system od razu wygeneruje N unikalnych kodów do
   nadrukowania na naklejkach; możesz później dogenerować więcej).

Po zakończeniu kreatora zostaniesz przeniesiony do logowania.

## Tryb developerski (hot reload)

```bash
npm run dev
```

Uruchomi backend (port 3000) i frontend Vite (port 5173). W tym trybie
otwórz http://localhost:5173 — Vite proxy-uje `/api` i `/uploads` do
backendu.

## Reset bazy

```bash
npm run db:reset
```

Skasuje bazę SQLite (uwaga: dane przepadają). Uruchom potem ponownie
`npm start`, żeby przejść instalację od zera.

## Struktura

```
apps/
  api/                Backend: Express + Prisma + SQLite
    src/
      server.ts       Wejście — Express + serwowanie frontendu (jeden port)
      routes/         Endpointy domenowe (auth, orders, rugs, scan, …)
      lib/            Wspólna logika (auth, statuses, notifications, prisma)
    prisma/schema.prisma
    data/             Plik bazy SQLite + uploady (tworzone runtime)
  web/                Frontend: React + Vite + Tailwind + PWA
    src/
      panels/         Każda rola ma swój katalog z layoutem desktop+mobile
      components/     OrdersList (wspólna lista zleceń), QrScanner, …
      pages/          Wspólne strony (logowanie, instalator, intake, detale)
      lib/            api, auth, statuses, useIsMobile
docs/                 Specyfikacja, architektura, model danych, plan etapów
```

## Konta i role

| Rola | Panel startowy | Layout |
| --- | --- | --- |
| OWNER | `/owner` | desktop + mobile |
| STATIONARY_BRANCH_WORKER | `/stationary` | desktop + mobile |
| WASHING_WORKER | `/washing` | desktop + mobile |
| DRIVER | `/driver` | **tylko mobile** |
| LOGISTICS | `/logistics` | desktop + mobile |
| PARTNER_BRANCH | `/partner` | desktop + mobile |
| STATIONARY_BRANCH | `/branch` | desktop + mobile |

Konta tworzy właściciel w panelu **Użytkownicy**.

## PWA / instalacja na telefonie

Po wejściu na aplikację z telefonu (ważne: przez HTTPS w produkcji) w
przeglądarce pojawi się opcja „Dodaj do ekranu głównego". W trybie
deweloperskim PWA działa, ale skaner kamerowy wymaga HTTPS lub
`localhost`.

## Co jest gotowe

- Instalator (kreator pierwszego uruchomienia).
- Wszystkie 7 paneli z osobnymi layoutami desktop/mobile.
- Wspólny komponent listy zleceń (`OrdersList.tsx`) i wspólny CSS — używa
  go każda rola.
- Pełen model danych w Prisma (Order, Rug, Customer, Branch, Package,
  PriceList, QrCode, NotificationLog, DriverDailySettlement, AuditEvent…).
- RBAC w API + filtrowanie zasobów per rola.
- Skanowanie QR pojedyncze i seryjne.
- Statusy procesu prania, walidacja per rola.
- Wycena automatyczna + cenniki partnerskie.
- Powiadomienia e-mail (SMTP) i SMS (z prowiderem-stubem „Console").
- Rozliczenia gotówki kierowców (dziennie).
- Pula kodów QR (generowanie i przypisywanie).
- Konfiguracja SMTP, SMS, szablonów wiadomości w panelu właściciela.

## Co świadomie zostawione jako TODO

- Realna integracja z dostawcami SMS (SMSAPI / SerwerSMS / Twilio).
- Integracja z centralą telefoniczną — zależna od dokumentacji API danej
  centrali.
- Pełne dashboardy z wykresami (są endpointy + tabele).
- Bardziej rozbudowane walidacje przejść statusów oraz wymagane etapy
  pakietu wymuszane przy `READY_FOR_*`.
- Testy E2E.

Te elementy są gotowe do podpięcia bez przebudowy bazy ani struktury kodu.
