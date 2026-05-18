# 02. Architektura techniczna

Dokument opisuje proponowany stack technologiczny, sposób uruchomienia
aplikacji jako PWA, hosting, bezpieczeństwo oraz integracje (SMTP, SMS,
centrala telefoniczna).

Wybór konkretnych narzędzi nie jest sztywny — w sekcjach niżej podaję
**rekomendowane** rozwiązanie i **alternatywy**, żebyś mógł świadomie
zdecydować przed startem implementacji.

## 1. Architektura wysokopoziomowa

```
                     ┌──────────────────────────────────────┐
                     │            Przeglądarka              │
                     │  (PWA: desktop + mobile + offline)   │
                     └───────────────┬──────────────────────┘
                                     │ HTTPS
                                     ▼
                     ┌──────────────────────────────────────┐
                     │             API Backend              │
                     │   (REST/JSON, autoryzacja JWT)       │
                     └───┬─────────────┬───────────────┬────┘
                         │             │               │
              ┌──────────▼──┐   ┌──────▼──────┐  ┌─────▼──────┐
              │  Postgres   │   │ Object store│  │  Workers    │
              │  (dane)     │   │ (zdjęcia)   │  │ (SMS/email/ │
              │             │   │             │  │  stats)     │
              └─────────────┘   └─────────────┘  └─────┬──────┘
                                                       │
                                  ┌────────────────────┼────────────────────┐
                                  ▼                    ▼                    ▼
                            ┌───────────┐       ┌────────────┐      ┌───────────────┐
                            │  SMTP     │       │  SMS API   │      │ Centrala tel. │
                            │ (e-mail)  │       │ (np. SMSAPI│      │ (webhook CTI) │
                            │           │       │  / Twilio) │      │               │
                            └───────────┘       └────────────┘      └───────────────┘
```

Komponenty:

- **PWA frontend** — aplikacja webowa, responsywna, z osobnymi layoutami
  per panel (desktop + mobile), z service workerem.
- **Backend API** — REST/JSON, autoryzacja po JWT, autoryzacja oparta na
  rolach (RBAC). Część endpointów dostępnych tylko dla wybranych ról i tylko
  dla danych, do których użytkownik ma uprawnienia (np. partner widzi tylko
  swoje zlecenia).
- **Baza danych relacyjna** — PostgreSQL.
- **Object storage** — przechowywanie zdjęć dywanów (np. S3 / MinIO).
- **Workery / kolejka** — wysyłka SMS, e-mail, generowanie statystyk,
  zadania okresowe (np. dzienne raporty kierowców).

## 2. Stack technologiczny — rekomendacja

### Frontend (PWA)

- **Framework:** React + TypeScript (alternatywa: Vue 3 + TS).
- **Bundler/dev:** Vite.
- **Styling:** Tailwind CSS + warstwa komponentów `ui/` (np. lokalne
  komponenty, niekoniecznie zewnętrzna biblioteka). Alternatywa: SCSS modules.
- **Routing:** React Router (osobne layouty per panel).
- **State:** TanStack Query (server state) + lekki store (np. Zustand) na
  state UI.
- **Skanowanie QR:** biblioteka działająca na getUserMedia (np. `zxing-js`
  / `html5-qrcode`). Wymaga HTTPS.
- **PWA:** Vite PWA plugin (Workbox), manifest, ikony, ekran startowy,
  offline shell dla wybranych widoków.
- **Formularze:** React Hook Form + Zod (walidacja).

### Backend

- **Język:** Node.js + TypeScript (alternatywy: PHP/Laravel, Python/FastAPI).
- **Framework:** NestJS (struktura modułowa, dekoratory, łatwe RBAC).
  Alternatywa: Express + warstwa auth.
- **ORM:** Prisma.
- **Auth:** JWT (access + refresh), hasła hashowane Argon2/bcrypt.
- **Walidacja:** class-validator / Zod.
- **API:** REST/JSON. Dokumentacja: OpenAPI (Swagger) generowane z kodu.
- **Webhooks:** endpointy do centrali telefonicznej i statusów wysyłki SMS.

### Baza danych

- **PostgreSQL 16+** — bo:
  - relacje 1-do-wielu (Zlecenie → Dywany, Klient → Zlecenia),
  - JSONB do historii zdarzeń,
  - bardzo dobre wsparcie dla wyszukiwania pełnotekstowego (klient,
    nazwisko, numery),
  - solidne wsparcie dla tranzakcji (krytyczne przy seryjnym skanowaniu).

### Object storage

- **S3-compatible** (AWS S3 / Wasabi / MinIO on-prem). Zdjęcia dywanów
  trafiają tu, w bazie zapisujemy tylko klucze.
- Dla szybszej obsługi mobile: zdjęcia kompresowane po stronie klienta
  (np. do 1600 px dłuższego boku, JPEG ~85%).

### Kolejka / workery

- **BullMQ** (Redis) do obsługi: wysyłki SMS, wysyłki e-mail, generowania
  agregatów, retry.
- Redis dodatkowo jako cache dla najbardziej obciążonych endpointów (np.
  pulpit właściciela).

## 3. PWA — wymagania szczegółowe

### 3.1. Manifest

Manifest aplikacji zawiera:

- name, short_name,
- start_url,
- display: `standalone`,
- background_color, theme_color,
- ikony 192/512 + maskable.

### 3.2. Service worker

- Strategia: **App Shell** — HTML/CSS/JS z `cache first`, z fallbackiem
  network.
- API cache (selektywne): **stale-while-revalidate** dla endpointów
  „read-mostly” (np. lista pakietów, lista statusów).
- Offline-first widoki:
  - lista doręczeń kierowcy na dziś (kierowca ma niski zasięg pod adresami),
  - karta dywanu po skanie (z ostatnich N otwartych).
- Operacje pisma w trybie offline: kolejka zmian (np. zmiana statusu
  dywanu), synchronizacja po powrocie sieci. Każda operacja ma idempotency
  key, żeby uniknąć duplikatów.

### 3.3. Aparat i skaner QR

- Skaner QR działa wyłącznie po HTTPS (wymóg `getUserMedia`).
- W trybie seryjnym: ciągły strumień z kamery, debounce identycznych skanów,
  feedback dźwiękowy + wibracja na poprawnym skanie, lista zeskanowanych
  kodów po prawej / pod kamerą.
- Obsługa kodów QR i Code 128 (na wszelki wypadek; opcjonalnie).

### 3.4. Layouty

- **Desktop layout** i **mobile layout** to **osobne pliki** dla każdego
  panelu (zob. [`06-struktura-projektu.md`](06-struktura-projektu.md)).
- Lista zleceń ma **wspólny komponent + wspólny CSS** używany przez
  wszystkie role.
- Panel kierowcy: **wyłącznie mobile**. Desktop wyświetla informację, że
  ten panel jest dostępny tylko z urządzenia mobilnego.

## 4. Bezpieczeństwo

- HTTPS (Let's Encrypt) wszędzie, HSTS.
- JWT z krótkim okresem ważności (15 min) + refresh token (rotacja).
- Hasła hashowane (Argon2id).
- 2FA dla konta właściciela (TOTP) — opcjonalnie w MVP, mocno rekomendowane
  na produkcji.
- RBAC w warstwie API: każdy endpoint ma listę dozwolonych ról + dodatkowo
  filtrowanie zasobów (np. partner ma `WHERE partnerId = currentUser.partnerId`).
- Logowanie wszystkich zmian danych operacyjnych (audit log na poziomie DB +
  logiczna historia zdarzeń w aplikacji).
- Polityka haseł: min. 10 znaków, blokada po 5 nieudanych próbach (cooldown).
- CORS ograniczone do domeny aplikacji.
- Rate limit na endpointach logowania, wysyłki SMS, dodawania zleceń.
- Klucze API (SMS, SMTP) trzymane w secret managerze hostingu, nigdy w repo.
- RODO:
  - klient może być oznaczony do anonimizacji,
  - eksport danych klienta na żądanie (CSV/JSON),
  - retencja zdjęć: konfigurowalna (np. 12 miesięcy).

## 5. Integracje

### 5.1. SMTP (e-mail)

Konfiguracja w panelu właściciela:

- host, port, użytkownik, hasło, szyfrowanie (TLS/SSL),
- adres nadawcy, nazwa nadawcy.

System koleguje wysyłkę przez worker (BullMQ). Każda wiadomość trafia do
historii powiadomień zlecenia ze statusem (sent / failed / retry).

### 5.2. SMS API

Konfiguracja w panelu właściciela:

- dostawca (np. SMSAPI.pl, SerwerSMS, Twilio),
- klucz API / token,
- nadawca (sender name).

Webhook na status doręczenia (delivery report) zapisuje status w historii.

### 5.3. Centrala telefoniczna (Etap 3)

- Webhook od centrali: zdarzenie „połączenie przychodzące” z numerem.
- Aplikacja w panelu logistyki pokazuje pop-up z:
  - numerem dzwoniącego,
  - dopasowaniem klienta (jeśli numer istnieje),
  - poprzednimi i aktywnymi zleceniami,
  - akcjami: utwórz nowe zlecenie / dopisz notatkę / przejdź do karty.
- Konkretny zakres zależy od API danej centrali — należy uzyskać
  dokumentację i dane dostępowe.

## 6. Hosting i infrastruktura

Rekomendacja MVP:

- **Frontend (PWA):** Cloudflare Pages / Vercel (statyczny build z CDN).
- **Backend API:** kontener Docker uruchamiany na VPS (Hetzner) lub w
  managed środowisku (Render / Railway / Fly.io).
- **Postgres:** managed DB (Render/Supabase/Neon) albo własny na VPS z
  backupami.
- **Object storage:** Wasabi / MinIO / S3.
- **Redis:** Upstash lub własny (na tym samym VPS).
- **Domena + HTTPS:** Cloudflare (DNS + cache + WAF).

Backupy:

- baza: codziennie + retencja 30 dni,
- object storage: wersjonowanie obiektów (jeśli dostępne),
- raz w tygodniu test odtworzenia bazy ze snapshota.

Środowiska:

- `dev` (lokalnie),
- `staging` (do testów),
- `prod`.

CI/CD: GitHub Actions — build, lint, testy, deploy.

## 7. Obserwowalność

- Logi aplikacji (structured JSON) do agregatora (np. Better Stack /
  Grafana Loki).
- Metryki: czas odpowiedzi API, błędy 5xx, kolejki workerów, czas wysyłki
  SMS/e-mail.
- Sentry (frontend + backend) — błędy runtime z kontekstem użytkownika.
- Healthcheck: `/healthz` w API.

## 8. Decyzje techniczne otwarte (do potwierdzenia)

| Decyzja | Domyślnie | Alternatywy |
| --- | --- | --- |
| Frontend framework | React + TS | Vue 3, Svelte |
| Backend framework | NestJS | Laravel/PHP, FastAPI/Python |
| ORM | Prisma | TypeORM, Drizzle |
| Hosting backend | Render/Railway | własny VPS (Hetzner) |
| SMS dostawca | SMSAPI.pl | SerwerSMS, Twilio |
| Multi-tenancy | jedna firma | wsparcie wielu firm — **poza zakresem** |

Decyzje te warto potwierdzić przed Etapem 1.
