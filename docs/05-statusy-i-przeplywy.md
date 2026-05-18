# 05. Statusy i przepływy procesu

Dokument opisuje pełną listę statusów dywanu, mapowanie pakietów na
wymagane etapy oraz typowe ścieżki procesu w zależności od źródła zlecenia.

## 1. Pełna lista statusów dywanu

| Kod | Etykieta PL | Kategoria |
| --- | --- | --- |
| `ORDER_PICKUP_ACCEPTED` | Przyjęto zlecenie odbioru | Logistyczny |
| `ACCEPTED_AT_PARTNER` | Przyjęto w placówce partnerskiej | Partnerski |
| `PICKED_UP_FROM_PARTNER` | Odebrano z placówki partnerskiej | Transportowy |
| `PICKED_UP_FROM_CUSTOMER` | Odebrano z adresu klienta | Transportowy |
| `ACCEPTED_AT_CENTRAL` | Przyjęto w magazynie centralnym | Magazynowy |
| `WASHING` | W praniu | Procesowy |
| `IMPREGNATION` | W impregnacji | Procesowy |
| `MITE_REMOVAL` | W eliminacji roztoczy | Procesowy |
| `ODOR_REMOVAL` | W usuwaniu zapachu | Procesowy |
| `HAIR_REMOVAL` | W usuwaniu sierści | Procesowy |
| `FRINGE_CLEANING` | W czyszczeniu frędzli | Procesowy |
| `FOIL_PACKING` | W pakowaniu w folię | Procesowy |
| `OZONATION` | W ozonowaniu | Procesowy |
| `DRYING` | W suszeniu | Procesowy |
| `READY_FOR_PICKUP` | Gotowy do wydania | Wydania |
| `READY_FOR_DELIVERY` | Gotowy do wydania do doręczenia | Wydania |
| `IN_DELIVERY` | W doręczeniu | Transportowy |
| `DELIVERED` | Wydano | Końcowy |
| `DELIVERED_TO_CUSTOMER` | Wydano pod adres klienta | Końcowy |

## 2. Pakiety i wymagane etapy

Lista wymaganych statusów per pakiet jest **edytowalna przez właściciela**
(`Package.RequiredStep`). Poniżej proponowana wartość domyślna.

Stałe etapy (zawsze obecne):

- `WASHING`,
- `DRYING`,
- `FOIL_PACKING`.

| Pakiet | Wymagane etapy dodatkowe |
| --- | --- |
| Standard (25 zł/m²) | brak |
| Brązowy (38 zł/m²) | `MITE_REMOVAL` |
| Srebrny (46 zł/m²) | `MITE_REMOVAL`, `ODOR_REMOVAL` |
| Złoty (55 zł/m²) | `MITE_REMOVAL`, `ODOR_REMOVAL`, `HAIR_REMOVAL`, `FRINGE_CLEANING` |
| Platynowy (65 zł/m²) | `MITE_REMOVAL`, `ODOR_REMOVAL`, `HAIR_REMOVAL`, `FRINGE_CLEANING`, `IMPREGNATION`, `OZONATION` |

Reguła: dywan może otrzymać status `READY_FOR_PICKUP` lub
`READY_FOR_DELIVERY` dopiero po przejściu **wszystkich** wymaganych etapów
swojego pakietu. Wyjątki ręczne wprowadza tylko OWNER (z komentarzem do
audit logu).

> Wartości domyślne to propozycja — finalną mapę uzgadnia właściciel,
> wpisując w ustawieniach systemowych.

## 3. Ścieżki procesu wg źródła zlecenia

### 3.1. Zlecenie przyjęte w placówce stacjonarnej (sieci)

Dotyczy: klient sam przyniósł dywan.

```
[STATIONARY] DELIVERED (status początkowy nie istnieje — zaczynamy od przyjęcia)
   │
   ▼
ACCEPTED_AT_CENTRAL  (jeśli to magazyn centralny)
ACCEPTED_AT_PARTNER  ❌ – nie dotyczy
   │
   │   (placówka stacjonarna sieci → po skanie kierowcy → ACCEPTED_AT_CENTRAL)
   │
   ▼
WASHING → [opcjonalnie wymagane etapy z pakietu] → DRYING → FOIL_PACKING
   │
   ▼
READY_FOR_PICKUP
   │
   ▼
DELIVERED            // wydano w placówce
```

Powiadomienia:

- przy przyjęciu (po zatwierdzeniu zlecenia),
- gdy **wszystkie** dywany ze zlecenia mają status `READY_FOR_PICKUP`.

### 3.2. Zlecenie telefoniczne / mailowe (logistyka)

```
ORDER_PICKUP_ACCEPTED      // utworzone przez logistykę
   │
   ▼
PICKED_UP_FROM_CUSTOMER    // kierowca odebrał, ewentualnie nakleił QR
   │
   ▼
ACCEPTED_AT_CENTRAL        // pracownik magazynu skanuje QR i mierzy
   │
   ▼
WASHING → [...] → DRYING → FOIL_PACKING
   │
   ▼
READY_FOR_DELIVERY
   │
   ▼
IN_DELIVERY                // kierowca pobiera + skanuje
   │
   ▼
DELIVERED_TO_CUSTOMER      // u klienta + ewentualne pobranie gotówki
```

Powiadomienia:

- przy przyjęciu w magazynie centralnym (z ostateczną wyceną — to jest
  pierwszy moment, gdy klient zna cenę),
- gdy kierowca rusza w trasę (status `IN_DELIVERY`).

### 3.3. Zlecenie spontanicznie odebrane przez kierowcę (na ulicy)

```
PICKED_UP_FROM_CUSTOMER    // kierowca przykleił QR, zrobił zdjęcia, opcjonalnie wybrał pakiet
   │
   ▼
ACCEPTED_AT_CENTRAL        // pracownik magazynu mierzy i wycenia
   │
   ▼
WASHING → [...] → DRYING → FOIL_PACKING
   │
   ▼
READY_FOR_DELIVERY
   │
   ▼
IN_DELIVERY
   │
   ▼
DELIVERED_TO_CUSTOMER
```

Powiadomienia:

- przy przyjęciu w magazynie centralnym (z ostateczną wyceną),
- gdy kierowca rusza w trasę (`IN_DELIVERY`).

### 3.4. Zlecenie z placówki partnerskiej

```
ACCEPTED_AT_PARTNER        // partner przyjął i naklejł QR
   │
   ▼
PICKED_UP_FROM_PARTNER     // kierowca skanuje
   │
   ▼
ACCEPTED_AT_CENTRAL        // magazyn mierzy + wycenia wg cennika partnera
   │
   ▼
WASHING → [...] → DRYING → FOIL_PACKING
   │
   ▼
READY_FOR_PICKUP            // dywany wracają do partnera, NIE bezpośrednio do klienta
   │
   ▼
DELIVERED                   // partner wydaje klientowi (nasz system rejestruje wydanie)
```

Powiadomienia: brak SMS/e-mail z naszej strony do klienta. Klienta obsługuje
partner — to on komunikuje się z klientem. (Nasz system wysyła powiadomienia
tylko dla zleceń bezpośrednich.)

## 4. Wyliczanie statusu zlecenia (`Order.computedStatus`)

Reguły (kolejność sprawdzania):

1. Jeśli wszystkie dywany w zleceniu są w statusie `DELIVERED` lub
   `DELIVERED_TO_CUSTOMER` → `COMPLETED`.
2. Jeśli wszystkie dywany są w statusach `READY_FOR_PICKUP` lub
   `READY_FOR_DELIVERY` → `ALL_READY`.
3. Jeśli część dywanów jest w statusach końcowych (`DELIVERED*`), a część
   nie → `PARTIALLY_DELIVERED`.
4. W przeciwnym razie, jeśli istnieje co najmniej jeden dywan w statusie
   procesowym lub transportowym → `IN_PROGRESS`.
5. W przeciwnym razie → `NEW`.
6. `CANCELLED` ustawiane tylko ręcznie (poza zakresem MVP).

Powiadomienie „gotowy do odbioru” wysyłane jest, gdy
`Order.computedStatus` przechodzi w `ALL_READY` i źródło zlecenia to
zlecenie odbierane samodzielnie przez klienta.

## 5. Walidacje przy seryjnym skanowaniu

Tryb seryjny wymaga wybrania docelowego statusu **przed** skanowaniem.

Przy każdym skanie system sprawdza:

- czy kod QR istnieje i jest przypisany do aktywnego dywanu,
- czy nadanie statusu jest dozwolone wg reguł (rola, ścieżka, pakiet),
- czy status nie jest już aktualny (idempotencja),
- czy dywan nie jest archiwizowany.

Skany niespełniające reguł trafiają na listę „odrzucone” z opisem powodu.
Po zatwierdzeniu trybu seryjnego, system zapisuje wszystkie poprawne zmiany
w jednej tranzakcji, każda z wpisem w `RugStatusEvent`.

## 6. Lokalizacja fizyczna a status

Po zmianie statusu system aktualizuje też domyślną lokalizację fizyczną:

| Status | Domyślna lokalizacja |
| --- | --- |
| `ACCEPTED_AT_PARTNER` | `PARTNER_BRANCH` |
| `PICKED_UP_FROM_PARTNER`, `PICKED_UP_FROM_CUSTOMER`, `IN_DELIVERY` | `DRIVER_VEHICLE` |
| `ACCEPTED_AT_CENTRAL` | `CENTRAL_WAREHOUSE` |
| `WASHING`, `IMPREGNATION`, `MITE_REMOVAL`, `ODOR_REMOVAL`, `HAIR_REMOVAL`, `FRINGE_CLEANING`, `OZONATION` | `WASHING_HALL` |
| `DRYING` | `DRYING_ROOM` |
| `FOIL_PACKING` | `PACKING_ZONE` |
| `READY_FOR_PICKUP`, `READY_FOR_DELIVERY` | `CENTRAL_WAREHOUSE` lub `STATIONARY_BRANCH` (zależnie od kontekstu) |
| `DELIVERED` | `STATIONARY_BRANCH` |
| `DELIVERED_TO_CUSTOMER` | `AT_CUSTOMER` |

Lokalizacja fizyczna może być nadpisana ręcznie w sytuacjach niestandardowych.
