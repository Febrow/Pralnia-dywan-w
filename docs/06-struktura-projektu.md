# 06. Struktura projektu

Dokument opisuje, jak zaproponowana jest struktura katalogów i plików, ze
szczególnym uwzględnieniem **osobnych layoutów per panel** (desktop + mobile)
oraz **wspólnego CSS dla listy zleceń**.

> Założenia stackowe: React + TypeScript + Vite (frontend), NestJS +
> TypeScript + Prisma (backend), monorepo. Stack można zmienić — wtedy
> przeniesiemy nazewnictwo na ekwiwalentne pliki.

## 1. Monorepo — układ katalogów

```
/ (repo root)
├── README.md
├── docs/
│   ├── 01-specyfikacja-funkcjonalna.md
│   ├── 02-architektura-techniczna.md
│   ├── 03-model-danych.md
│   ├── 04-role-i-uprawnienia.md
│   ├── 05-statusy-i-przeplywy.md
│   ├── 06-struktura-projektu.md
│   └── 07-plan-etapow.md
├── apps/
│   ├── web/                     # frontend PWA
│   └── api/                     # backend
└── packages/
    ├── shared-types/            # współdzielone typy (DTO, enumy)
    └── ui/                      # opcjonalnie: współdzielone komponenty UI
```

## 2. Frontend (`apps/web`)

```
apps/web/
├── public/
│   ├── manifest.webmanifest
│   ├── icons/
│   └── offline.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── index.tsx                 # przekierowanie wg roli
│   │   ├── login/
│   │   │   └── LoginPage.tsx
│   │   ├── owner/                    # panel właściciela
│   │   ├── stationary/               # panel pracownika placówki stacjonarnej
│   │   ├── washing/                  # panel pracownika prania
│   │   ├── driver/                   # panel kierowcy (TYLKO mobile)
│   │   ├── logistics/                # panel logistyki
│   │   ├── partner/                  # panel placówki partnerskiej
│   │   └── branch-account/           # panel placówki sieci (konto placówki)
│   │
│   ├── layouts/
│   │   ├── owner/
│   │   │   ├── OwnerLayout.desktop.tsx
│   │   │   ├── OwnerLayout.mobile.tsx
│   │   │   └── OwnerLayout.module.css
│   │   ├── stationary/
│   │   │   ├── StationaryLayout.desktop.tsx
│   │   │   ├── StationaryLayout.mobile.tsx
│   │   │   └── StationaryLayout.module.css
│   │   ├── washing/
│   │   │   ├── WashingLayout.desktop.tsx
│   │   │   ├── WashingLayout.mobile.tsx
│   │   │   └── WashingLayout.module.css
│   │   ├── driver/
│   │   │   ├── DriverLayout.mobile.tsx        # TYLKO mobile
│   │   │   ├── DriverLayout.module.css
│   │   │   └── DriverNotAvailableOnDesktop.tsx
│   │   ├── logistics/
│   │   │   ├── LogisticsLayout.desktop.tsx
│   │   │   ├── LogisticsLayout.mobile.tsx
│   │   │   └── LogisticsLayout.module.css
│   │   ├── partner/
│   │   │   ├── PartnerLayout.desktop.tsx
│   │   │   ├── PartnerLayout.mobile.tsx
│   │   │   └── PartnerLayout.module.css
│   │   └── branch-account/
│   │       ├── BranchLayout.desktop.tsx
│   │       ├── BranchLayout.mobile.tsx
│   │       └── BranchLayout.module.css
│   │
│   ├── features/
│   │   ├── orders/
│   │   │   ├── components/
│   │   │   │   ├── OrdersList.tsx               # WSPÓLNY komponent listy zleceń
│   │   │   │   ├── OrdersList.module.css        # WSPÓLNY CSS listy zleceń
│   │   │   │   ├── OrdersListFilters.tsx
│   │   │   │   ├── OrderRow.tsx
│   │   │   │   ├── OrderDetails.tsx
│   │   │   │   └── RugCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useOrders.ts
│   │   │   │   └── useOrder.ts
│   │   │   └── pages/
│   │   │       ├── OrdersListPage.tsx
│   │   │       └── OrderDetailsPage.tsx
│   │   ├── intake/                              # przyjmowanie zleceń (placówka)
│   │   ├── handover/                            # wydawanie dywanów
│   │   ├── washing-process/                     # statusy procesu prania
│   │   ├── scan/
│   │   │   ├── components/
│   │   │   │   ├── QrScanner.tsx
│   │   │   │   └── BulkScanScreen.tsx
│   │   │   └── hooks/useQrScanner.ts
│   │   ├── driver/
│   │   │   ├── pages/
│   │   │   │   ├── PickupsPage.tsx
│   │   │   │   ├── DeliveriesPage.tsx
│   │   │   │   ├── NewFieldOrderPage.tsx
│   │   │   │   └── CashSettlementPage.tsx
│   │   │   └── components/
│   │   ├── logistics/
│   │   ├── partner/
│   │   ├── owner/
│   │   │   ├── dashboard/
│   │   │   ├── drivers/
│   │   │   ├── partners/
│   │   │   ├── users/
│   │   │   ├── branches/
│   │   │   ├── packages/
│   │   │   ├── notifications-templates/
│   │   │   └── settings/                        # SMTP, SMS
│   │   └── auth/
│   │
│   ├── components/                              # ogólne komponenty UI
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   └── ...
│   ├── styles/
│   │   ├── tokens.css                           # zmienne kolorów, spacing, typografia
│   │   ├── reset.css
│   │   └── globals.css
│   ├── lib/
│   │   ├── api/                                 # klient HTTP (axios/fetch)
│   │   ├── pwa/                                 # rejestracja SW, prompt instalacji
│   │   ├── auth/                                # JWT, RBAC po stronie klienta
│   │   ├── i18n/                                # tłumaczenia (PL)
│   │   └── utils/
│   ├── service-worker.ts                        # rejestracja SW (Workbox)
│   └── types/
│       └── domain.ts                            # zaimportowane z packages/shared-types
└── vite.config.ts
```

### 2.1. Zasada osobnych layoutów

Każdy panel ma osobny katalog `layouts/<panel>` zawierający:

- `*.desktop.tsx` — layout dla widoku desktop,
- `*.mobile.tsx` — layout dla widoku mobile,
- `*.module.css` — style scoped do tego layoutu.

Wybór layoutu desktop vs. mobile odbywa się centralnie w `App.tsx` na
podstawie media query (np. `useIsMobile()` hook). Dla panelu kierowcy
desktop wyświetla zastępczy ekran `DriverNotAvailableOnDesktop`.

### 2.2. Wspólny CSS listy zleceń

`features/orders/components/OrdersList.tsx` jest **jednym wspólnym**
komponentem listy zleceń, używanym przez wszystkie panele. Jego style są w
`OrdersList.module.css` (lub Tailwind `apply` z aliasami) i są **wspólne**
dla każdej roli — niezależnie od tego, kto otwiera listę.

Dane do listy mogą się różnić (zakres widocznych zleceń), ale wygląd jest
jednolity, zgodnie z wymaganiem.

### 2.3. Ekran logowania a wybór panelu

Po logowaniu serwer zwraca rolę i listę przypisanych placówek. Frontend
przekierowuje na właściwy panel:

| Rola | Panel startowy |
| --- | --- |
| OWNER | `/owner/dashboard` |
| STATIONARY_BRANCH_WORKER | `/stationary/orders` |
| WASHING_WORKER | `/washing` |
| DRIVER | `/driver` (mobile) |
| LOGISTICS | `/logistics/orders` |
| PARTNER_BRANCH | `/partner/orders` |
| STATIONARY_BRANCH | `/branch-account/orders` |

## 3. Backend (`apps/api`)

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── auth/                       # logowanie, JWT, refresh
│   │   ├── users/
│   │   ├── branches/
│   │   ├── customers/
│   │   ├── orders/
│   │   ├── rugs/
│   │   ├── photos/                     # upload do S3
│   │   ├── qr-codes/
│   │   ├── packages/
│   │   ├── price-lists/
│   │   ├── statuses/                   # walidacja przejść statusów
│   │   ├── notifications/              # SMTP + SMS, kolejka
│   │   ├── audit/
│   │   ├── statistics/
│   │   ├── driver-settlements/
│   │   ├── settings/                   # SMTP, SMS, szablony, branding
│   │   └── webhooks/                   # centrala telefoniczna, delivery reports
│   ├── common/
│   │   ├── guards/                     # RBAC guards
│   │   ├── interceptors/
│   │   ├── decorators/Roles.ts
│   │   └── filters/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── config/
├── test/
└── package.json
```

### 3.1. RBAC w API

Każdy endpoint ma:

- `@Roles(...)` — dozwolone role,
- guard sprawdzający, czy użytkownik widzi dany zasób (np. partner widzi
  tylko zlecenia powiązane z jego placówką).

Przykład:

```ts
@Roles(Role.PARTNER_BRANCH, Role.OWNER)
@Get('orders')
async list(@CurrentUser() user) {
  return this.ordersService.listForUser(user);
}
```

`OrdersService.listForUser` automatycznie zawęża zapytanie wg roli.

## 4. Współdzielone typy (`packages/shared-types`)

W tym pakiecie znajdują się:

- enumy (`Role`, `RugStatus`, `OrderSource`, `BranchType`, ...),
- DTO requestów i odpowiedzi (np. `CreateOrderDto`, `RugDto`),
- typy widoków list (`OrderListRowDto`).

Dzięki temu frontend i backend dzielą jeden typ, co eliminuje rozjazdy.

## 5. Zasoby PWA

```
apps/web/public/
├── manifest.webmanifest
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-512-maskable.png
├── splash/
│   └── splash-*.png
└── offline.html
```

Service worker:

- generowany przez `vite-plugin-pwa`,
- precache dla shell,
- runtime cache dla `/api/packages`, `/api/statuses` (stale-while-revalidate),
- background sync dla zmian statusu w trybie offline.

## 6. Zasady kodu

- TypeScript w strict mode na froncie i backendzie.
- ESLint + Prettier + commit hooks (lint-staged).
- Konwencja commitów: Conventional Commits.
- Testy:
  - jednostkowe (Vitest / Jest),
  - integracyjne API (testy modułów + DB w docker compose),
  - E2E (Playwright) — minimum: logowanie, dodanie zlecenia, wydanie dywanu,
    skan seryjny, rozliczenie kierowcy.

## 7. Środowiska i konfiguracja

- `.env.example` w `apps/web` i `apps/api` z opisem zmiennych.
- Sekrety w secret managerze hostingu, nigdy w repozytorium.
- Migracje DB: `prisma migrate deploy` w pipeline.
