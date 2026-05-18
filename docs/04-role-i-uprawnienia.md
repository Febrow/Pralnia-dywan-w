# 04. Role i uprawnienia

## 1. Lista ról

| # | Rola | Skrót | Główny kontekst |
| --- | --- | --- | --- |
| 1 | Pracownik placówki stacjonarnej (sieci) | `STATIONARY_BRANCH_WORKER` | Przyjmuje i wydaje dywany w danej placówce. |
| 2 | Pracownik prania | `WASHING_WORKER` | Procesuje dywany w magazynie centralnym. |
| 3 | Kierowca / kurier | `DRIVER` | Odbiera i doręcza dywany, pobiera gotówkę. **Tylko mobile.** |
| 4 | Pracownik logistyki | `LOGISTICS` | Obsługa zleceń telefonicznych/mailowych, koordynacja kierowców. |
| 5 | Placówka partnerska | `PARTNER_BRANCH` | Konto placówki partnerskiej. Widzi tylko własne zlecenia. |
| 6 | Właściciel / administrator | `OWNER` | Pełny dostęp + konfiguracja. |
| 7 | Placówka stacjonarna sieci (konto placówki) | `STATIONARY_BRANCH` | Analogicznie do partnera, ale cennik centralny. |

> Uwaga: rola **placówki** (5, 7) i rola **pracownika placówki stacjonarnej**
> (1) to nie to samo. Konto „placówki” jest jak konto użytkownika partnera —
> ograniczony widok zleceń tej placówki, nie pełny panel pracownika
> magazynu centralnego.

## 2. Macierz uprawnień

Legenda: ✅ pełny dostęp · 🟡 ograniczony / podgląd · ❌ brak.

| Funkcja | Pracownik placówki | Pracownik prania | Kierowca | Logistyka | Placówka partnerska | Placówka sieci | Właściciel |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Logowanie | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dodanie zlecenia stacjonarnego | ✅ | ❌ | ❌ | ✅ | ✅ (tylko własne) | ✅ (tylko własne) | ✅ |
| Dodanie zlecenia telefonicznego | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Dodanie zlecenia w terenie | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Dodanie dywanu | ✅ | ❌ | ✅ (bez pomiaru) | ✅ (planowo) | ✅ (bez pomiaru) | ✅ (bez pomiaru) | ✅ |
| Pomiar dywanu | ✅ | 🟡 (opcj.) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Dodanie zdjęć | ✅ | 🟡 | 🟡 | ❌ | ✅ | ✅ | ✅ |
| Zmiana pakietu / wyceny | ✅ | 🟡 | ❌ | 🟡 | ❌ | ❌ | ✅ |
| Zmiana statusu prania | ❌ | ✅ | ❌ | 🟡 podgląd | ❌ | ❌ | ✅ |
| Zmiana statusu transportowego | ❌ | ❌ | ✅ | ✅ | 🟡 | 🟡 | ✅ |
| Wydanie w placówce | ✅ | ❌ | ❌ | ❌ | ✅ (własne) | ✅ (własne) | ✅ |
| Wydanie pod adresem klienta | ❌ | ❌ | ✅ | 🟡 podgląd | ❌ | ❌ | ✅ |
| Pobranie gotówki | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Rozliczenie kierowcy (akcept) | ❌ | ❌ | ❌ | 🟡 (opcj.) | ❌ | ❌ | ✅ |
| Statystyki własnej placówki | 🟡 | ❌ | ❌ | ❌ | ✅ (własna) | ✅ (własna) | ✅ |
| Statystyki globalne | ❌ | ❌ | ❌ | 🟡 | ❌ | ❌ | ✅ |
| Konfiguracja SMTP / SMS | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Edycja szablonów wiadomości | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Edycja pakietów i cen | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Edycja cenników partnerskich | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Zarządzanie użytkownikami | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Zarządzanie placówkami | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit log | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## 3. Dodatkowe ograniczenia widoczności

### 3.1. Placówka partnerska

- Widzi tylko zlecenia, których `partnerBranchId = currentUser.branchId`.
- Ceny w panelu liczone są wg jej własnego cennika partnerskiego.
- Nie widzi nazwisk innych klientów ani zleceń innych placówek.
- Nie widzi rozliczeń kierowców i statystyk globalnych.

### 3.2. Placówka stacjonarna sieci (konto placówki)

- Widzi tylko zlecenia, których `acceptingBranchId = currentUser.branchId`.
- Cennik = centralny.

### 3.3. Pracownik placówki stacjonarnej

- Widzi i edytuje zlecenia w swojej placówce.
- Jeśli pracownik jest przypisany do magazynu centralnego, dodatkowo może
  przyjmować dywany przywiezione przez kierowców (skanowanie QR + pomiar).
- Przypisanie do placówki realizowane przez `Membership`.

### 3.4. Kierowca

- Widzi tylko swoje aktywne odbiory i doręczenia.
- Widzi własne dzienne rozliczenia, nie cudze.
- Nie widzi statystyk globalnych ani innych kierowców.
- Panel **wyłącznie mobilny** (na desktop wyświetla informację, że ten panel
  jest dostępny tylko na telefonie).

### 3.5. Pracownik prania

- Widzi listę dywanów i ich karty (po skanie).
- Nie widzi pełnych danych klienta (telefon, e-mail) — tylko imię i
  pierwszą literę nazwiska, jeśli to konieczne.
- Nie widzi cen.

### 3.6. Logistyka

- Widzi pełną listę zleceń (chronologicznie) z filtrami.
- Może przypisywać kierowców do zleceń.
- Może edytować dane logistyczne zlecenia (adres, terminy).

### 3.7. Właściciel

- Pełny dostęp.
- Jako jedyny ma wgląd w audit log i konfigurację techniczną.

## 4. Kontrola statusów per rola

| Status | Kto może nadać |
| --- | --- |
| `ORDER_PICKUP_ACCEPTED` | LOGISTICS, OWNER (auto przy utworzeniu zlecenia logistycznego) |
| `ACCEPTED_AT_PARTNER` | PARTNER_BRANCH (auto przy przyjęciu) |
| `PICKED_UP_FROM_PARTNER` | DRIVER (skan), OWNER |
| `PICKED_UP_FROM_CUSTOMER` | DRIVER (skan), OWNER |
| `ACCEPTED_AT_CENTRAL` | STATIONARY_BRANCH_WORKER (w magazynie centralnym), OWNER |
| `WASHING`, `IMPREGNATION`, ... `DRYING` | WASHING_WORKER, OWNER |
| `READY_FOR_PICKUP` | WASHING_WORKER, STATIONARY_BRANCH_WORKER, OWNER |
| `READY_FOR_DELIVERY` | WASHING_WORKER, OWNER |
| `IN_DELIVERY` | DRIVER (skan), OWNER |
| `DELIVERED` | STATIONARY_BRANCH_WORKER, PARTNER_BRANCH, STATIONARY_BRANCH, OWNER |
| `DELIVERED_TO_CUSTOMER` | DRIVER, OWNER |

## 5. Walidacje cross-role

- Nie można cofnąć statusu wcześniej niż obecny bez uprawnień OWNER.
- Nie można nadać `READY_FOR_PICKUP` / `READY_FOR_DELIVERY`, jeśli dywan nie
  przeszedł wszystkich `RequiredStep` swojego pakietu (chyba że OWNER zrobi
  ręczny wyjątek z komentarzem).
- Nie można przypisać kodu QR `ASSIGNED` do dywanu — system blokuje
  i informuje, że kod jest już w użyciu.
- Próba zmiany pakietu po statusie późniejszym niż `WASHING` wymaga
  uprawnień OWNER i powoduje rekalkulację ceny + wpis w audit log.
