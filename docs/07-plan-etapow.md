# 07. Plan wdrożenia — 5 etapów

System powstaje **etapami**. Każdy etap dodaje konkretną część funkcjonalności
i bazuje na **tej samej** bazie danych oraz logice aplikacji. Dzięki temu
kolejne moduły nie są osobnymi systemami, tylko kolejnymi częściami jednej
wspólnej aplikacji.

## Podsumowanie

| Etap | Zakres | Cena netto |
| --- | --- | --- |
| Etap 1 | Panel właściciela, panel placówki centralnej, zlecenia, dywany, QR, zdjęcia, wycena, SMTP, mobilny widok przyjęcia i wydania dywanów | **38 000 zł** |
| Etap 2 | Panel pracownika prania, pełne statusy, skanowanie QR, skanowanie seryjne, mobilny widok pracownika prania | **24 000 zł** |
| Etap 3 | Logistyka, kierowcy, odbiory, doręczenia, rozliczenia gotówki, mobilny widok logistyki, integracja z centralą telefoniczną | **33 000 zł** |
| Etap 4 | Placówki partnerskie, indywidualne cenniki, rozliczenia partnerskie, mobilny widok placówki partnerskiej | **25 000 zł** |
| Etap 5 | Mobilny widok właściciela, SMS, PWA (dopracowanie), statystyki, optymalizacja i testy | **15 000 zł** |
| **Razem** | | **135 000 zł netto** |

---

## Etap 1 — podstawowa wersja systemu dla właściciela i placówki centralnej

### Cel

Stworzenie działającej wersji aplikacji dla głównej placówki / magazynu
centralnego. Po tym etapie system pozwala przyjmować dywany, przypisywać im
kody QR, dodawać zdjęcia, wyceniać usługę, wyszukiwać zlecenia, wydawać
dywany oraz wysyłać wiadomości e-mail do klientów.

Powstaje również panel właściciela do zarządzania ustawieniami systemu.

Baza danych jest projektowana **od razu** w sposób umożliwiający bezpieczne
dodanie kolejnych paneli (kierowca, logistyka, partner) bez migracji
ratunkowych.

### Zakres

- Logowanie do systemu (dwie role techniczne: właściciel + pracownik
  placówki centralnej; przygotowane „miejsca” na pozostałe role).
- Panel właściciela:
  - podgląd wszystkich zleceń i dywanów,
  - podstawowe statystyki,
  - lista klientów,
  - lista użytkowników, dodawanie i edycja użytkowników,
  - ustawienia pakietów prania i cen,
  - lista i konfiguracja statusów,
  - konfiguracja SMTP (host, port, login, hasło, nadawca),
  - audit log w wersji podstawowej.
- Panel pracownika placówki centralnej:
  - dodanie zlecenia (klient, dywany, QR, zdjęcia, wymiary, pakiet, cena,
    notatka),
  - obsługa wielu dywanów w jednym zleceniu,
  - automatyczne wyliczanie powierzchni i ceny,
  - wyszukiwarka zleceń (numer, QR, klient, telefon, e-mail),
  - wydawanie dywanów,
  - mobilny widok przyjęcia i wydania (PWA, dostęp do aparatu, skan QR).
- Wysyłka e-mail po przyjęciu zlecenia (SMTP).
- Historia zdarzeń (utworzenie zlecenia, dodanie dywanu, QR, zdjęcia, zmiana
  statusu, wydanie, wysyłka e-mail).

### Efekt

System pozwala obsłużyć pełen cykl klienta walk-in w magazynie centralnym:
od przyjęcia, przez wycenę, po wydanie dywanu i potwierdzenie e-mail.

### Cena

**38 000 zł netto**

---

## Etap 2 — proces prania, statusy i skanowanie seryjne

### Cel

Dodanie panelu pracownika zajmującego się praniem i procesowaniem dywanów.
Po tym etapie pracownik pralni może skanować dywany, zmieniać ich statusy i
obsługiwać etapy technologiczne wynikające z wybranego pakietu.

### Zakres

- Panel pracownika prania:
  - dwa główne przyciski: **Skanuj dywan**, **Seryjne skanowanie**,
  - karta dywanu po pojedynczym skanie (numer, QR, status, pakiet, etapy,
    notatki, zdjęcia, info o pozostałych dywanach w zleceniu),
  - tryb seryjnego skanowania ze zbiorczą zmianą statusu (licznik
    zeskanowanych, lista odrzuconych z powodem),
  - mobilny widok pracownika prania (duże przyciski, jedna ręka).
- Pełna lista statusów technologicznych: w praniu, w impregnacji, w
  eliminacji roztoczy, w usuwaniu zapachu, w usuwaniu sierści, w
  czyszczeniu frędzli, w ozonowaniu, w suszeniu, w pakowaniu, gotowy do
  wydania.
- Powiązanie pakietów z wymaganymi etapami (RequiredStep).
- Walidacja przejść statusów (blokady i ostrzeżenia).
- Rozszerzenie audit logu o zdarzenia procesowe.

### Efekt

System obsługuje proces prania od strony pracownika hali, w tym szybką
obsługę wielu dywanów naraz.

### Cena

**24 000 zł netto**

---

## Etap 3 — logistyka, kierowca i doręczenia

### Cel

Dodanie obsługi zleceń odbieranych od klientów oraz doręczanych pod adres.
Powstają panel logistyki i mobilny panel kierowcy.

### Zakres

- Panel logistyki:
  - chronologiczna lista wszystkich zleceń z filtrami,
  - dodanie zlecenia (dane klienta + adres odbioru/doręczenia),
  - przypisanie zlecenia do kierowcy,
  - widoki operacyjne (oczekujące na przypisanie, w trasie, zwroty itp.),
  - mobilny widok logistyki.
- Mobilny panel kierowcy (tylko mobile):
  - moje odbiory, moje doręczenia,
  - skan pojedynczy + seryjny,
  - dodanie nowego zlecenia w terenie (bez pomiaru),
  - zmiana statusu po odebraniu i po doręczeniu,
  - podgląd kwoty do pobrania.
- Statusy logistyczne: ORDER_PICKUP_ACCEPTED, PICKED_UP_FROM_CUSTOMER,
  ACCEPTED_AT_CENTRAL, READY_FOR_DELIVERY, IN_DELIVERY,
  DELIVERED_TO_CUSTOMER.
- Rozliczenia gotówki kierowcy:
  - dzienne rekordy, lista pobranych kwot per zlecenie/dywan,
  - status rozliczone / nierozliczone,
  - podgląd w panelu właściciela.
- Integracja z centralą telefoniczną (CTI):
  - webhook połączenia przychodzącego,
  - dopasowanie numeru do klienta,
  - pop-up z danymi i akcjami w panelu logistyki,
  - zakres zależny od API danej centrali (do potwierdzenia po otrzymaniu
    dokumentacji).

### Efekt

System obsługuje pełen obieg dla zleceń wymagających transportu — od
zlecenia telefonicznego po doręczenie i pobranie gotówki.

### Cena

**33 000 zł netto**

---

## Etap 4 — placówki partnerskie i rozliczenia z partnerami

### Cel

Dodanie obsługi placówek partnerskich (zewnętrzne punkty przyjmujące
dywany).

### Zakres

- Panel placówki partnerskiej:
  - dodanie zlecenia (klient, dywan, QR, zdjęcia, notatka),
  - widoczność tylko własnych zleceń,
  - oznaczenie wydania dywanu klientowi po powrocie z pralni,
  - mobilny widok partnera.
- Statusy partnerskie: ACCEPTED_AT_PARTNER, PICKED_UP_FROM_PARTNER.
- Odbiór z partnera przez kierowcę (skan pojedynczy/seryjny).
- Powrót dywanów do partnera (a nie bezpośrednio do klienta).
- Indywidualne cenniki partnerskie (per pakiet, per placówka).
- Zestawienia w panelu właściciela:
  - lista placówek partnerskich z miesięcznym podsumowaniem,
  - wejście w placówkę → lista zleceń z miesiąca i ich szczegóły.

### Efekt

System obsługuje współpracę B2B z placówkami partnerskimi z osobnymi
cennikami i raportami.

### Cena

**25 000 zł netto**

---

## Etap 5 — mobilny panel właściciela, SMS, PWA, statystyki, optymalizacja

### Cel

Domknięcie systemu jako pełnej aplikacji produkcyjnej. Powstaje mobilny
widok właściciela, doszlifowane PWA, powiadomienia SMS, rozbudowane
statystyki i końcowa optymalizacja.

### Zakres

- Mobilny widok panelu właściciela (uproszczony pulpit kontrolny: liczby
  zleceń, dywanów, statusy, dywany gotowe, aktywność kierowców, alerty).
- Powiadomienia SMS:
  - konfiguracja API SMS,
  - edycja szablonów,
  - wysyłka w 3 punktach procesu (przyjęcie zlecenia, gotowość do odbioru,
    rozpoczęcie doręczenia).
- Szablony wiadomości e-mail i SMS z polami zmiennymi (imię, numer
  zlecenia, liczba dywanów, łączna kwota, status, dane kontaktowe pralni).
- Aplikacja jako PWA — domknięcie:
  - manifest, ikony, splash,
  - service worker (App Shell + offline cache),
  - tryb standalone bez paska przeglądarki.
- Rozbudowane statystyki (dziennie / tygodniowo / miesięcznie, według
  pakietów, kierowców, partnerów; zlecenia oczekujące, gotowe, w toku).
- Optymalizacja:
  - paginacja list,
  - kompresja zdjęć,
  - cache zapytań,
  - ulepszone komunikaty błędów.
- Testy:
  - testy uprawnień (wszystkie role),
  - testy ścieżek statusów,
  - testy działania na telefonie i skanera QR,
  - testy integracji z centralą telefoniczną,
  - poprawki po testach.

### Efekt

Aplikacja jest pełnym systemem produkcyjnym do zarządzania pralnią dywanów,
gotowym do wdrożenia w sieci placówek wraz z partnerami i kierowcami.

### Cena

**15 000 zł netto**
