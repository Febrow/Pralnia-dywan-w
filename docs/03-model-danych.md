# 03. Model danych

Dokument opisuje strukturę bazy danych: encje, relacje, klucze. Notacja
nieformalna (bliska Prisma / SQL), żeby łatwo było ją przerobić na schemat
docelowego ORM.

## 1. Diagram (uproszczony)

```
User ──< Membership >── Branch
                         │
                         ├──< Order >──< Rug >──< RugPhoto
                         │                 │
                         │                 ├──< RugStatusEvent
                         │                 └── currentStatus, qrCode
                         │
                         └── Partner (opcjonalnie)
                              └── PartnerPriceList ──< PartnerPriceItem

Customer ──< Order
Driver  ──< OrderAssignment, DriverDailySettlement
Package ──< RequiredStep
PriceList ──< PriceListItem (centralny cennik)

QrCodePool — wcześniej przygotowane kody QR
NotificationLog — historia SMS/e-mail
AuditEvent — globalny audit log (kto, kiedy, co)
SystemSetting — SMTP, SMS, szablony, branding
```

## 2. Słowniki / enumy

### 2.1. Role użytkowników

```
Role:
  OWNER                         // właściciel
  STATIONARY_BRANCH_WORKER      // pracownik placówki stacjonarnej
  WASHING_WORKER                // pracownik prania
  DRIVER                        // kierowca
  LOGISTICS                     // logistyka
  PARTNER_BRANCH                // konto placówki partnerskiej (logiczne; user należy do partnera)
  STATIONARY_BRANCH             // konto placówki sieci (logiczne; user należy do oddziału sieci)
```

### 2.2. Typy placówek

```
BranchType:
  CENTRAL_WAREHOUSE             // magazyn centralny (jedna placówka)
  STATIONARY                    // pozostałe placówki sieci
  PARTNER                       // placówki partnerskie
```

### 2.3. Źródło zlecenia

```
OrderSource:
  STATIONARY            // przyjęte w placówce stacjonarnej (sieci)
  CENTRAL_WAREHOUSE     // przyjęte w magazynie centralnym
  LOGISTICS_PHONE       // zlecenie telefoniczne / mailowe (logistyka)
  DRIVER_FIELD          // zlecenie spontanicznie dodane przez kierowcę
  PARTNER               // zlecenie z placówki partnerskiej
```

### 2.4. Status dywanu (Rug)

Pełna lista statusów (źródła zleceń wykorzystują podzbiory — zob.
[`05-statusy-i-przeplywy.md`](05-statusy-i-przeplywy.md)):

```
RugStatus:
  ORDER_PICKUP_ACCEPTED          // Przyjęto zlecenie odbioru
  ACCEPTED_AT_PARTNER            // Przyjęto w placówce partnerskiej
  PICKED_UP_FROM_PARTNER         // Odebrano z placówki partnerskiej
  PICKED_UP_FROM_CUSTOMER        // Odebrano z adresu klienta
  ACCEPTED_AT_CENTRAL            // Przyjęto w magazynie centralnym
  WASHING                        // W praniu
  IMPREGNATION                   // W impregnacji
  MITE_REMOVAL                   // W eliminacji roztoczy
  ODOR_REMOVAL                   // W usuwaniu zapachu
  HAIR_REMOVAL                   // W usuwaniu sierści
  FRINGE_CLEANING                // W czyszczeniu frędzli
  FOIL_PACKING                   // W pakowaniu w folię
  OZONATION                      // W ozonowaniu
  DRYING                         // W suszeniu
  READY_FOR_PICKUP               // Gotowy do wydania (klient sam odbiera w placówce)
  READY_FOR_DELIVERY             // Gotowy do wydania do doręczenia (przez kierowcę)
  IN_DELIVERY                    // W doręczeniu
  DELIVERED                      // Wydano (w placówce)
  DELIVERED_TO_CUSTOMER          // Wydano pod adres klienta
```

### 2.5. Status zlecenia (wyliczany)

```
OrderStatus (computed):
  NEW                  // żaden dywan nie ma jeszcze terminalnego statusu
  IN_PROGRESS          // mieszany
  ALL_READY            // wszystkie gotowe do wydania / doręczenia
  PARTIALLY_DELIVERED  // część wydana
  COMPLETED            // wszystkie wydane
  CANCELLED            // anulowane (rzadko, ręcznie)
```

### 2.6. Lokalizacja fizyczna

```
PhysicalLocation:
  STATIONARY_BRANCH
  CENTRAL_WAREHOUSE
  WASHING_HALL
  DRYING_ROOM
  PACKING_ZONE
  DRIVER_VEHICLE
  PARTNER_BRANCH
  AT_CUSTOMER
```

### 2.7. Status kodu QR

```
QrCodeStatus:
  AVAILABLE   // wolny w puli
  ASSIGNED    // przypisany do aktywnego dywanu
  ARCHIVED    // dywan wydany; kod wyłączony
```

## 3. Encje

### 3.1. User

```
User {
  id: UUID PK
  email: string UNIQUE
  passwordHash: string
  firstName: string
  lastName: string
  role: Role
  isActive: bool
  createdAt, updatedAt
  // jeden user może być przypisany do wielu placówek (np. pracownik
  // placówki stacjonarnej + magazynu centralnego). Powiązanie przez
  // tabelę Membership.
}
```

### 3.2. Membership (User × Branch)

```
Membership {
  id: UUID PK
  userId: UUID FK -> User
  branchId: UUID FK -> Branch
  role: Role            // efektywna rola w tej placówce
  createdAt
  UNIQUE (userId, branchId)
}
```

### 3.3. Branch

```
Branch {
  id: UUID PK
  type: BranchType        // CENTRAL_WAREHOUSE | STATIONARY | PARTNER
  name: string
  city: string
  address: string
  isActive: bool
  partnerPriceListId: UUID? FK -> PriceList   // tylko dla PARTNER
  createdAt, updatedAt
}

// Reguła: dokładnie jedna placówka typu CENTRAL_WAREHOUSE.
```

### 3.4. Customer

```
Customer {
  id: UUID PK
  firstName: string
  lastName: string
  phone: string INDEX
  email: string INDEX
  defaultPickupAddress: AddressJSON?
  defaultDeliveryAddress: AddressJSON?
  consentSms: bool
  consentEmail: bool
  createdAt, updatedAt
}
```

`AddressJSON`:
```
{ street, houseNo, apartmentNo?, postalCode, city }
```

### 3.5. Order

```
Order {
  id: UUID PK
  number: string UNIQUE INDEX           // numer zlecenia (czytelny)
  source: OrderSource
  acceptingBranchId: UUID FK -> Branch  // gdzie/przez kogo zostało przyjęte
  acceptingUserId: UUID FK -> User
  customerId: UUID FK -> Customer
  pickupAddress: AddressJSON?
  deliveryAddress: AddressJSON?
  notesForDriver: text?
  internalNotes: text?
  declaredRugCount: int?                // gdy logistyka/partner wpisze deklarację
  totalAreaM2: decimal(10,2)            // sumaryczna, wyliczana
  totalGrossPrice: decimal(10,2)        // sumaryczna, wyliczana
  computedStatus: OrderStatus
  driverId: UUID? FK -> User            // przypisany kierowca
  partnerBranchId: UUID? FK -> Branch   // jeśli źródło = PARTNER
  createdAt, updatedAt
}
```

Reguły numeracji:

- jeśli zlecenie ma 1 dywan → `Order.number` może = `Rug.qrCode`,
- jeśli zlecenie ma >1 dywan → `Order.number` jest niezależny od kodów QR.

### 3.6. Rug (dywan)

```
Rug {
  id: UUID PK
  orderId: UUID FK -> Order
  qrCode: string UNIQUE INDEX
  widthCm: int?                  // może być null (do pomiaru w magazynie)
  heightCm: int?
  areaM2: decimal(10,2)?         // wyliczane gdy są wymiary
  packageId: UUID? FK -> Package
  pricePerM2: decimal(10,2)?     // brutto, snapshot z pakietu / cennika partnera
  totalPrice: decimal(10,2)?     // areaM2 * pricePerM2
  notes: text?
  currentStatus: RugStatus
  physicalLocation: PhysicalLocation?
  isFromPartner: bool
  isFromDriverPickup: bool
  createdAt, updatedAt
}
```

### 3.7. RugPhoto

```
RugPhoto {
  id: UUID PK
  rugId: UUID FK -> Rug
  storageKey: string             // klucz w S3 / MinIO
  sha256: string?
  takenAt: timestamp
  uploadedByUserId: UUID FK -> User
}
```

### 3.8. RugStatusEvent (historia statusów)

```
RugStatusEvent {
  id: UUID PK
  rugId: UUID FK -> Rug
  fromStatus: RugStatus?
  toStatus: RugStatus
  changedByUserId: UUID FK -> User
  changedAt: timestamp
  source: 'manual' | 'serial_scan' | 'system'
  comment: text?
}
```

### 3.9. QrCodePool

```
QrCodePool {
  code: string PK            // wartość zakodowana w QR (np. RUG-123456)
  status: QrCodeStatus
  rugId: UUID? FK -> Rug     // gdy ASSIGNED
  createdAt, archivedAt
}
```

### 3.10. Package i RequiredStep

```
Package {
  id: UUID PK
  name: string                 // Standard | Brązowy | Srebrny | Złoty | Platynowy
  pricePerM2: decimal(10,2)    // brutto, centralny cennik
  isActive: bool
  sortOrder: int
}

RequiredStep {
  id: UUID PK
  packageId: UUID FK -> Package
  status: RugStatus            // np. WASHING, IMPREGNATION
  sortOrder: int
  UNIQUE(packageId, status)
}
```

Mapowanie pakiet → wymagane statusy znajduje się w
[`05-statusy-i-przeplywy.md`](05-statusy-i-przeplywy.md). Edytuje je
właściciel.

### 3.11. PriceList (cennik partnerski)

```
PriceList {
  id: UUID PK
  ownerBranchId: UUID FK -> Branch    // placówka partnerska
  name: string
  isActive: bool
  createdAt
}

PriceListItem {
  id: UUID PK
  priceListId: UUID FK -> PriceList
  packageId: UUID FK -> Package
  pricePerM2: decimal(10,2)           // brutto, indywidualny dla partnera
  UNIQUE(priceListId, packageId)
}
```

Dla zleceń z `OrderSource = PARTNER`:
`Rug.pricePerM2 = PriceListItem.pricePerM2 (snapshot)`

Dla pozostałych:
`Rug.pricePerM2 = Package.pricePerM2 (snapshot)`

Snapshot oznacza: w momencie zatwierdzenia ceny zapisujemy ją na dywanie,
żeby późniejsza zmiana cennika nie modyfikowała historii.

### 3.12. DriverDailySettlement (rozliczenie dzienne kierowcy)

```
DriverDailySettlement {
  id: UUID PK
  driverUserId: UUID FK -> User
  day: date
  totalCashCollected: decimal(10,2)
  status: 'PENDING' | 'SETTLED'
  settledAt: timestamp?
  settledByUserId: UUID? FK -> User
  notes: text?
  UNIQUE(driverUserId, day)
}

DriverSettlementItem {
  id: UUID PK
  settlementId: UUID FK -> DriverDailySettlement
  orderId: UUID FK -> Order
  rugId: UUID FK -> Rug
  amountCollected: decimal(10,2)
  collectedAt: timestamp
}
```

Każdy dywan wydany pod adres klienta tworzy item; agregaty sumowane są na
poziomie `DriverDailySettlement` (jedno na dzień / kierowcę).

### 3.13. NotificationLog (historia wysyłek)

```
NotificationLog {
  id: UUID PK
  orderId: UUID FK -> Order
  channel: 'SMS' | 'EMAIL'
  trigger: 'ORDER_ACCEPTED' | 'READY_FOR_PICKUP' | 'IN_DELIVERY_TODAY'
  to: string
  subject: string?
  body: text
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'DELIVERED'
  providerMessageId: string?
  error: text?
  createdAt, sentAt?
}
```

### 3.14. AuditEvent (audit log)

```
AuditEvent {
  id: UUID PK
  actorUserId: UUID? FK -> User
  entity: string          // 'Order' | 'Rug' | 'User' | 'PriceList' | ...
  entityId: UUID
  action: string          // 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'
  diff: JSONB             // przed / po
  context: JSONB?         // np. ip, userAgent
  createdAt
}
```

### 3.15. SystemSetting

```
SystemSetting {
  key: string PK          // 'smtp', 'sms', 'templates.email.order_accepted', ...
  value: JSONB
  updatedByUserId: UUID FK -> User
  updatedAt
}
```

Przykładowe klucze:

- `smtp` — host, port, user, password, from, fromName
- `sms` — provider, apiKey, sender
- `templates.email.order_accepted`
- `templates.email.ready_for_pickup`
- `templates.email.in_delivery`
- `templates.sms.order_accepted`
- `templates.sms.ready_for_pickup`
- `templates.sms.in_delivery`
- `branding.companyName`, `branding.contactPhone`, `branding.contactEmail`

## 4. Reguły integralności i indeksy

- `Branch`: trigger lub constraint zapewniający, że istnieje dokładnie jedna
  placówka typu `CENTRAL_WAREHOUSE`.
- `Rug.qrCode`: unikalny w obrębie aktywnych dywanów (kod może wrócić do
  puli tylko po archiwizacji dywanu, jeżeli właściciel włączy taką
  politykę).
- Indeksy:
  - `Customer(phone)`, `Customer(email)`, `Customer(lastName)` — wyszukiwarka,
  - `Order(number)`, `Order(createdAt)`, `Order(driverId)`,
    `Order(partnerBranchId)`, `Order(acceptingBranchId)`,
  - `Rug(qrCode)`, `Rug(currentStatus)`, `Rug(physicalLocation)`,
  - `RugStatusEvent(rugId, changedAt)`,
  - `DriverDailySettlement(driverUserId, day)`.
- Pełnotekstowe wyszukiwanie (Postgres `tsvector`) na polach klienta i
  numerze zlecenia.

## 5. Wyliczane pola i triggery aplikacyjne

- Po dodaniu / edycji dywanu pola `Order.totalAreaM2`, `Order.totalGrossPrice`
  i `Order.computedStatus` są przeliczane na poziomie aplikacji w jednej
  transakcji.
- Zmiana statusu dywanu zapisuje wpis w `RugStatusEvent` i aktualizuje
  `Rug.currentStatus`. To dwie operacje w jednej tranzakcji.
- Zmiana statusu na `DELIVERED_TO_CUSTOMER` z ceną > 0 dodaje wpis do
  `DriverSettlementItem` i aktualizuje `DriverDailySettlement.totalCashCollected`.
- Dodanie dywanu o ustawionych wymiarach automatycznie wylicza `areaM2` i
  `totalPrice`.

## 6. Migracje i wersjonowanie

- Migracje przez Prisma Migrate.
- Każda zmiana schematu w MR z opisem.
- Seed:
  - 1 user `OWNER`,
  - 1 placówka `CENTRAL_WAREHOUSE`,
  - 5 pakietów (Standard, Brązowy, Srebrny, Złoty, Platynowy) z domyślnymi
    cenami,
  - słowniki statusów i lokalizacji.
