# 01. Specyfikacja funkcjonalna

## 1. Cel aplikacji

Celem aplikacji jest stworzenie centralnego systemu webowego do obsługi pełnego
obiegu dywanów w pralni: od przyjęcia zlecenia, przez transport, magazyn, proces
prania i usług dodatkowych, aż po wydanie dywanu klientowi oraz rozliczenie
gotówki.

Aplikacja działa jako strona internetowa dostępna przez przeglądarkę i jest
zoptymalizowana pod urządzenia mobilne (PWA). Część pracowników korzysta z
telefonu do robienia zdjęć, skanowania kodów QR i pracy w terenie.

System bazuje na **jednej wspólnej bazie danych**. Zakres widocznych
informacji oraz dostępnych działań zależy od roli użytkownika.

## 2. Główne założenia systemowe

### 2.1. Aplikacja webowa (PWA)

- Aplikacja jest dostępna w przeglądarce.
- Działa w technologii PWA (Progressive Web App):
  - manifest aplikacji,
  - service worker,
  - możliwość dodania do ekranu głównego,
  - offline shell dla wybranych widoków (lista doręczeń kierowcy, karta
    dywanu po zeskanowaniu).
- Każdy panel ma **osobny plik layoutu** w wersji desktopowej i mobilnej.
- Panel kierowcy istnieje **wyłącznie w wersji mobilnej**.
- Lista zleceń jest stylowana **wspólnym CSS** dla wszystkich ról.

### 2.2. Jedna baza danych, różne poziomy dostępu

Wszyscy użytkownicy pracują na tych samych zleceniach, dywanach, klientach,
zdjęciach, statusach i rozliczeniach. Różnica polega na tym, że każda rola
widzi tylko określone dane i może wykonywać tylko określone czynności.

### 2.3. Rozróżnienie zlecenia i dywanu

W systemie należy wyraźnie rozdzielić dwa poziomy danych:

1. **Zlecenie** — obejmuje klienta, dane kontaktowe, źródło zlecenia, adres
   odbioru/doręczenia, listę dywanów, historię i łączną wartość.
2. **Dywan** — pojedynczy fizyczny przedmiot w ramach zlecenia, posiadający
   własny kod QR, zdjęcia, wymiary, powierzchnię, pakiet, notatkę, cenę i
   indywidualny status.

Jedno zlecenie może zawierać jeden lub wiele dywanów.

### 2.4. Status dotyczy dywanu

Każdy dywan ma własny status, ponieważ w ramach jednego zlecenia kilka
dywanów może być na różnych etapach procesu. Status zlecenia jest wyliczany:

- wszystkie dywany wydane → zlecenie zakończone,
- część gotowa, część w toku → status mieszany,
- wszystkie dywany gotowe do wydania → zlecenie gotowe do odbioru/doręczenia.

### 2.5. Struktura sieci

- **Jeden magazyn centralny** — w nim odbywa się fizyczne pranie. Magazyn
  centralny jest jednocześnie placówką stacjonarną.
- **Wiele placówek stacjonarnych** — należących do właściciela sieci, tylko
  przyjmują i wydają dywany.
- **Wiele placówek partnerskich** — zewnętrzne firmy, mają własny ograniczony
  panel i własny indywidualny cennik.

## 3. Role użytkowników

System obsługuje 7 paneli (ról):

1. **Pracownik placówki stacjonarnej** (przyjmujący/wydający dywany).
2. **Pracownik prania** (procesujący dywany).
3. **Kierowca / kurier** — panel **wyłącznie mobilny**.
4. **Pracownik logistyki**.
5. **Placówka partnerska**.
6. **Właściciel / administrator główny**.
7. **Placówka stacjonarna należąca do sieci** (uprawnienia analogiczne do
   placówki partnerskiej, ale cennik centralny).

Szczegółowa macierz uprawnień znajduje się w
[`04-role-i-uprawnienia.md`](04-role-i-uprawnienia.md).

## 4. Kluczowe obiekty w systemie

### 4.1. Klient

- imię i nazwisko,
- numer telefonu,
- adres e-mail,
- opcjonalnie adres odbioru/doręczenia,
- historia wcześniejszych zleceń,
- (opcjonalnie) zgody marketingowe / komunikacyjne.

### 4.2. Zlecenie

- unikalny numer zlecenia,
- dane klienta,
- źródło zlecenia (placówka stacjonarna, logistyka, kierowca, placówka
  partnerska),
- placówka lub użytkownik, który przyjął zlecenie,
- data i godzina utworzenia,
- lista dywanów,
- łączna powierzchnia,
- łączna wycena (brutto, PLN),
- sposób odbioru / wydania,
- adres odbioru i doręczenia (jeśli dotyczy),
- aktualny status zbiorczy (wyliczany),
- historia zdarzeń,
- historia powiadomień SMS/e-mail,
- informacje o płatności i rozliczeniu.

### 4.3. Dywan

- unikalny kod QR (identyfikator),
- powiązanie ze zleceniem,
- wymiary (cm) i powierzchnia (m²),
- wybrany pakiet prania,
- cena za m² (z pakietu lub cennika partnerskiego),
- wyliczona cena za dywan,
- zdjęcia,
- indywidualna notatka,
- aktualny status,
- historia zmian statusu (kto, kiedy, na co),
- znacznik czy dywan przyszedł od kierowcy / z placówki partnerskiej,
- lokalizacja fizyczna (placówka, magazyn, hala prania, suszarnia, samochód
  kierowcy, u klienta itd.).

### 4.4. Kod QR

Kod QR jest podstawowym identyfikatorem fizycznego dywanu. System obsługuje
**pulę wcześniej przygotowanych, niepowtarzalnych kodów** nadrukowanych na
naklejkach. W momencie przyjęcia kod jest przypisywany do dywanu.

Wymagania:

- każdy aktywny dywan ma dokładnie jeden kod QR,
- kod QR jest globalnie unikalny,
- dywan zarchiwizowany (wydany) zwalnia kod do potencjalnego ponownego użycia
  tylko jeśli właściciel włączy taką opcję; domyślnie kody są jednorazowe,
- przy próbie przypisania kodu już używanego system blokuje operację i
  pokazuje błąd.

### 4.5. Zdjęcia

Zdjęcia są przypisane do **konkretnego dywanu**, nie do całego zlecenia.
Dzięki temu w przypadku kilku dywanów w jednym zleceniu nie ma wątpliwości,
które zdjęcie dotyczy którego przedmiotu.

Zdjęcia mogą dokumentować: wygląd, uszkodzenia, zabrudzenia, frędzle,
nietypowe cechy.

### 4.6. Historia zdarzeń (audit log)

Każde istotne działanie generuje wpis z datą, godziną, użytkownikiem i opisem,
m.in.: utworzenie zlecenia, dodanie dywanu, przypisanie kodu QR, dodanie
zdjęcia, zmiana statusu, zmiana wymiarów / pakietu, wysyłka SMS / e-mail,
wydanie dywanu, pobranie gotówki, rozliczenie kierowcy.

## 5. Pakiety prania i wycena

System obsługuje pakiety prania z ceną za m².

| Pakiet | Cena za m² (PLN, brutto) |
| --- | --- |
| Standard | 25 |
| Brązowy | 38 |
| Srebrny | 46 |
| Złoty | 55 |
| Platynowy | 65 |

Cena dywanu = `powierzchnia [m²] × cena za m² wybranego pakietu`.

Po wpisaniu wymiarów system automatycznie liczy powierzchnię i cenę.

### 5.1. Pakiet a usługi dodatkowe

- Pakiet **automatycznie narzuca listę wymaganych statusów/usług** (np. czy
  dywan musi przejść przez impregnację, ozonowanie, eliminację roztoczy itp.).
- **Nie ma** możliwości dokupienia pojedynczych usług poza pakietem (np.
  Standard + samo ozonowanie).
- Pracownik magazynu może zmienić pakiet po ocenie dywanu (zmiana zostaje
  w historii i powoduje rekalkulację ceny).

Mapowanie pakiet → wymagane statusy znajduje się w
[`05-statusy-i-przeplywy.md`](05-statusy-i-przeplywy.md).

### 5.2. Sytuacja, gdy dywan nie został jeszcze zmierzony

Dla zleceń telefonicznych (logistyka), zleceń odebranych spontanicznie przez
kierowcę i zleceń z placówek partnerskich dywan może nie mieć wymiarów w
momencie utworzenia zlecenia.

W takiej sytuacji:

- zlecenie powstaje **bez końcowej wyceny**,
- cena zostaje uzupełniona w magazynie centralnym po pomiarze przez
  uprawnionego pracownika,
- po pomiarze klient otrzymuje (jeśli to przyjęcie zlecenia, czyli pierwsza
  taka wiadomość) potwierdzenie z ostateczną wyceną.

### 5.3. Cenniki partnerskie

Każda placówka partnerska może mieć **indywidualny cennik** dla każdej z
usług. Wyceny pokazywane w panelu właściciela dla zleceń z partnerów liczone
są zgodnie z cennikiem tej konkretnej placówki.

Placówka stacjonarna należąca do sieci korzysta ze **wspólnego cennika
centralnego**.

## 6. Panele — szczegółowe wymagania

> Pełen rozkład funkcji per rola: zob. [`04-role-i-uprawnienia.md`](04-role-i-uprawnienia.md).
> Pełne ścieżki statusów: zob. [`05-statusy-i-przeplywy.md`](05-statusy-i-przeplywy.md).

### 6.1. Panel pracownika placówki stacjonarnej

Ekran główny: lista zleceń przyjętych w tej placówce + 3 główne akcje:

- **Dodaj zlecenie**
- **Znajdź zlecenie**
- **Lista zleceń**

#### Proces przyjęcia dywanu od klienta

1. „Dodaj zlecenie” → dane klienta (imię i nazwisko, telefon, e-mail).
2. Dodanie pierwszego dywanu do zlecenia.
3. Skan/przypisanie kodu QR z naklejki.
4. Wprowadzenie wymiarów → automatyczne wyliczenie powierzchni.
5. Wybór pakietu prania → automatyczne wyliczenie ceny.
6. Dodanie zdjęć dywanu (aparat telefonu, wiele zdjęć).
7. Dodanie indywidualnej notatki (opcjonalnie).
8. Powtórzenie kroków dla kolejnych dywanów w tym samym zleceniu.
9. Zatwierdzenie zlecenia.
10. Automatyczna wysyłka SMS i e-mail z potwierdzeniem przyjęcia.
11. Każdy dywan otrzymuje status:
    - „Przyjęto w magazynie centralnym” — gdy placówka jest magazynem
      centralnym,
    - „Przyjęto w placówce stacjonarnej” — w pozostałych placówkach sieci.

#### Numer zlecenia a numer dywanu

- Jeden dywan w zleceniu → numer zlecenia może być równy numerowi kodu QR
  dywanu.
- Wiele dywanów w zleceniu → numer zlecenia jest **odrębny** od kodów QR
  poszczególnych dywanów.

#### Wydanie dywanu w placówce

- Wyszukiwarka po: nazwisku, telefonie, e-mailu, numerze zlecenia, kodzie QR.
- Po znalezieniu zlecenia widać kolumny: numer zlecenia, klient, kontakt
  (telefon i e-mail jeden pod drugim), źródło, status, powierzchnia, kwota
  oraz **listę dywanów w tym zleceniu** (każdy z osobną powierzchnią,
  pakietem, ceną i statusem).
- Możliwa zmiana statusu wybranych dywanów na „Wydano”.
- Można wydać wszystkie dywany jednocześnie albo tylko wybrane (jeśli część
  nie jest jeszcze gotowa).

#### Przyjęcie dywanu przywiezionego przez kierowcę

- Pracownik zaczyna od **zeskanowania kodu QR** dywanu.
- System otwiera wcześniej utworzone zlecenie (od logistyki, kierowcy lub
  placówki partnerskiej).
- Pracownik uzupełnia: wymiary, pakiet (jeśli nie był wybrany), zdjęcia (jeśli
  potrzebne), notatki.
- Dywan otrzymuje status „Przyjęto w magazynie centralnym”.

### 6.2. Panel pracownika prania

Ekran główny: dwa duże przyciski:

- **Skanuj dywan** — pojedynczy skan, otwiera kartę dywanu.
- **Seryjne skanowanie** — zbiorcza zmiana statusu dla wielu dywanów.

#### Pojedynczy skan

Po zeskanowaniu kodu QR pokazuje się karta dywanu z: numerem zlecenia, kodem
QR, aktualnym statusem, pakietem, wymaganymi etapami, notatką, zdjęciami i
informacją o pozostałych dywanach z tego samego zlecenia.

Pracownik może zmienić status na właściwy etap procesu.

#### Skanowanie seryjne

1. Wybór statusu, który ma zostać nadany (np. „W praniu”, „W suszeniu”,
   „Gotowy do wydania”).
2. Skanowanie kolejnych kodów QR.
3. Każdy poprawny skan dodaje dywan do listy. System pokazuje licznik i
   ewentualne błędy.
4. Zatwierdzenie operacji → wszystkie dywany dostają nowy status, każda
   zmiana jest zapisywana w historii.

#### Kontrola logiczna statusów

System ostrzega/blokuje nielogiczne zmiany statusu, np.:

- „Gotowy do wydania” bez przejścia wymaganych etapów pakietu,
- status nieprzewidziany dla pakietu (z wyjątkiem ręcznych odstępstw przez
  właściciela),
- cofanie statusu wcześniej niż obecny wymaga uprawnień administracyjnych.

### 6.3. Panel kierowcy (tylko mobilny)

Główne akcje:

- **Moje odbiory**
- **Moje doręczenia**
- **Skanuj dywan**
- **Seryjne skanowanie**
- **Dodaj nowe zlecenie**
- **Rozliczenie gotówki**

#### Obsługa zlecenia od logistyki

1. Kierowca widzi zlecenie na liście odbiorów.
2. Pod adresem klienta przykleja na każdy dywan kod QR (jeśli nie jest jeszcze
   przypisany).
3. Skanuje kod QR (pojedynczo lub seryjnie) → status „Odebrano z adresu klienta”.
4. W magazynie centralnym pracownik skanuje kod QR i dopełnia pomiar.

#### Pobranie z magazynu do doręczenia

1. Skanowanie dywanów gotowych do doręczenia (pojedynczo lub seryjnie) →
   status zmienia się z „Gotowy do wydania do doręczenia” na „W doręczeniu”.
2. Po dostarczeniu klientowi → status „Wydano pod adres klienta”.

#### Samodzielne dodanie zlecenia

Kierowca może utworzyć zlecenie spontanicznie (klient zaczepi go na trasie):

- imię i nazwisko, telefon, e-mail,
- adres odbioru/doręczenia,
- pakiet (opcjonalnie, jeśli klient wybrał od razu),
- zdjęcia (opcjonalnie),
- notatka,
- przypisanie kodu QR z naklejki.

**Kierowca nie wprowadza wymiarów.** Pomiar zostanie wykonany w magazynie.

#### Odbiór z placówki partnerskiej

1. Kod QR jest już naklejony przez partnera.
2. Kierowca skanuje (pojedynczo lub seryjnie) → status „Odebrano z placówki
   partnerskiej”.

#### Gotówka i rozliczenie dzienne

- Płatności od klientów indywidualnych: **wyłącznie gotówka**.
- W momencie zmiany statusu na „Wydano pod adres klienta” system:
  - dodaje zlecenie do dziennego rozliczenia kierowcy,
  - zapisuje pobraną kwotę,
  - aktualizuje sumę gotówki do przekazania w panelu właściciela.
- **Każdy dzień to osobny rekord rozliczeniowy** dla danego kierowcy.
- Status rozliczenia: nierozliczone / rozliczone, z datą i osobą, która
  przyjęła gotówkę.

### 6.4. Panel pracownika logistyki

Ekran główny: chronologiczna lista wszystkich zleceń ze szczegółami w
kolumnach. Nad listą duży przycisk **Dodaj zlecenie** i wyszukiwarka.

Filtry: data utworzenia, status, źródło, kierowca, placówka, placówka
partnerska, nazwisko klienta, miejscowość, termin odbioru, termin doręczenia.

#### Dodanie zlecenia przez logistykę

Pola:

- imię i nazwisko, telefon, e-mail,
- ulica, numer domu, numer mieszkania, kod pocztowy, miejscowość,
- planowana data odbioru,
- preferowany termin doręczenia (opcjonalnie),
- notatka dla kierowcy, notatka wewnętrzna,
- liczba dywanów deklarowana przez klienta (opcjonalnie),
- orientacyjny pakiet (opcjonalnie).

**Logistyka nie dodaje zdjęć**, bo dywanu jeszcze fizycznie nie ma.

#### Widok operacyjny

Logistyka widzi m.in.:

- nowe zlecenia odbioru,
- zlecenia czekające na przypisanie kierowcy,
- zlecenia odebrane, ale nieprzyjęte w magazynie,
- dywany gotowe do doręczenia,
- dywany w doręczeniu,
- zlecenia z placówek partnerskich oczekujące na odbiór.

### 6.5. Panel placówki partnerskiej

Placówka partnerska:

- przyjmuje zlecenie i wprowadza dane klienta,
- dodaje dywan(y), nakleja i skanuje kod QR,
- robi zdjęcia każdego dywanu,
- dodaje notatkę,
- **nie mierzy dywanu i nie wykonuje końcowej wyceny**,
- widzi tylko własne zlecenia,
- po zwrocie dywanów z pralni wydaje dywan klientowi i pobiera od niego
  płatność (po swojej stawce — to jej decyzja).

Placówka partnerska **nie ma dostępu** do: zleceń innych placówek, statystyk
globalnych, rozliczeń kierowców, ustawień SMS/SMTP, panelu użytkowników,
konfiguracji systemu.

Statusy dodatkowe dla zleceń partnerskich:

- „Przyjęto w placówce partnerskiej”,
- „Odebrano z placówki partnerskiej”.

Po dotarciu do magazynu centralnego status przechodzi w „Przyjęto w magazynie
centralnym”, a dalsza ścieżka jest taka sama jak dla pozostałych dywanów.
**Po praniu dywany wracają do tej samej placówki partnerskiej**, nie do
klienta bezpośrednio.

### 6.6. Panel placówki stacjonarnej należącej do sieci

Uprawnienia analogiczne do placówki partnerskiej (przyjmuje, oddaje, widzi
swoje zlecenia), z dwiema różnicami:

- cennik = **cennik centralny**,
- jest to placówka „wewnętrzna” (właściciel widzi ją w innej zakładce niż
  partnerów).

### 6.7. Panel właściciela / administratora głównego

#### Pulpit

Po zalogowaniu główne statystyki dla:

- dnia dzisiejszego,
- bieżącego tygodnia,
- bieżącego miesiąca.

#### Zakładka „Zlecenia”

Lista wszystkich zleceń (ze wszystkich placówek stacjonarnych i
partnerskich), chronologicznie. Pełne filtry po wszystkich kluczowych
kryteriach.

#### Zakładka „Kierowcy”

- Lista kierowców z dzisiejszymi statystykami: ilość pobranych dywanów, ilość
  wydanych dywanów, ilość gotówki pobranej od klientów.
- Po wejściu w kierowcę → lista dni z aktywnością.
- Po wejściu w dany dzień → lista zleceń tego dnia z kolumnami:
  1. numer zlecenia,
  2. lista dywanów (jeden pod drugim w wierszu zlecenia),
  3. status zlecenia,
  4. kwota za każdy dywan + zbiorcza kwota za zlecenie pobrana od klienta.

#### Zakładka „Placówki partnerskie”

- Lista placówek z zestawieniem **z bieżącego miesiąca**.
- Po wejściu w placówkę → wszystkie zlecenia z tego miesiąca, analogicznie
  jak u kierowcy. Ceny liczone wg **indywidualnego cennika tej placówki**.

#### Zarządzanie

- Dodawanie/edycja **placówek partnerskich** (e-mail, hasło, indywidualny
  cennik per usługa). Założenie konta = przydzielenie dostępu do panelu
  partnera.
- Dodawanie/edycja **placówek stacjonarnych** sieci (dowolna liczba).
- Dodawanie **użytkowników** z przypisaniem roli (1–5 z listy ról) oraz
  konkretnej placówki stacjonarnej.

#### Konfiguracja techniczna

- API SMS,
- serwer SMTP (e-mail),
- szablony wiadomości SMS i e-mail (z polami zmiennymi: imię, numer zlecenia,
  liczba dywanów, łączna kwota, status, dane kontaktowe pralni),
- dane nadawcy wiadomości,
- ceny pakietów,
- ceny pakietów dla każdej placówki partnerskiej,
- lista statusów.

## 7. Powiadomienia SMS i e-mail

System wysyła powiadomienia tylko w **trzech** punktach procesu:

1. **Przyjęcie zlecenia** — potwierdzenie ze szczegółami (lista dywanów,
   wymiary, powierzchnia, pakiet, cena każdego dywanu, łączna kwota,
   aktualny status, dane kontaktowe pralni).
2. **Gotowość do odbioru** — gdy **wszystkie dywany ze zlecenia** są gotowe,
   a klient samodzielnie dostarczył dywany.
3. **Dzień doręczenia** — gdy kierowca wyrusza z dywanem (status
   „W doręczeniu”) — dotyczy zleceń z odbiorem przez kierowcę.

Wszystkie szablony są edytowalne przez właściciela.

Każde wysłane powiadomienie zapisuje się w historii zlecenia: kiedy, do kogo,
jakim kanałem, jaki temat / treść, czy wysyłka się powiodła.

## 8. Wyszukiwarka zleceń (wspólna)

Dostępna co najmniej w panelu pracownika placówki, logistyki i właściciela.
Wyszukiwanie po: numerze zlecenia, kodzie QR dywanu, imieniu i nazwisku,
telefonie, e-mailu, placówce, statusie, dacie przyjęcia, dacie wydania,
kierowcy, placówce partnerskiej.

## 9. Lokalizacja fizyczna dywanu

Oprócz statusu procesowego dywan ma znacznik lokalizacji fizycznej, np.:

- placówka stacjonarna,
- magazyn centralny,
- hala prania,
- suszarnia,
- strefa pakowania,
- samochód kierowcy,
- placówka partnerska,
- u klienta.

## 10. Listy operacyjne

### 10.1. Lista zleceń (wspólny CSS dla wszystkich ról)

Kolumny: numer zlecenia, data utworzenia, klient, telefon, e-mail, źródło,
placówka, liczba dywanów, łączna powierzchnia, łączna kwota, status zbiorczy,
najbliższa wymagana akcja, przypisany kierowca, data ostatniej zmiany statusu.

### 10.2. Lista dywanów

Kolumny: kod QR, numer zlecenia, klient, wymiary, powierzchnia, pakiet, cena,
status, lokalizacja fizyczna, ostatnia zmiana statusu, osoba odpowiedzialna.

### 10.3. Lista „gotowe do wydania”

Osobne podlisty dla:

- odbioru w placówce,
- doręczenia do klienta,
- przekazania kierowcy,
- zwrotu do placówki partnerskiej.

## 11. Obsługa błędów i sytuacji wyjątkowych

System przewiduje m.in.:

- skan kodu QR, którego nie ma w systemie,
- skan kodu już przypisanego do innego aktywnego dywanu (blokada),
- próba zmiany statusu niezgodna z procesem,
- brak internetu u kierowcy (offline cache krytycznych widoków),
- klient odbiera tylko część dywanów,
- niekompletne dane (brak pomiaru, brak wyceny),
- nieudana wysyłka SMS / e-mail (re-try + log błędu),
- różnica gotówki kierowcy względem systemowej (wymagany komentarz),
- (przyszłość) reklamacje / uszkodzenia — poza zakresem MVP.

## 12. Założenia poza-funkcjonalne (skrót)

- Język UI: **polski**.
- Obsługa: **jednej firmy** z wieloma placówkami i partnerami.
- Tylko **brutto**.
- Brak generowania PDF dokumentu przyjęcia.
- Brak modułu reklamacji w MVP.
- Płatność u kierowcy: **tylko gotówka**.

## 13. Niuanse projektowe (kluczowe ustalenia)

1. System rozróżnia zlecenie od dywanu.
2. Kod QR identyfikuje dywan, nie zlecenie.
3. Status jest przypisany do dywanu; status zlecenia jest wyliczany.
4. Nie każdy dywan ma od razu pełne dane (logistyka, kierowca, partner).
5. Skanowanie seryjne jest kluczowe operacyjnie.
6. Placówki partnerskie mają silnie ograniczony dostęp (tylko swoje
   zlecenia).
7. Kierowca jest jednocześnie użytkownikiem terenowym i kasjerem gotówkowym.
8. Właściciel ma pełny audit log.
9. Powiadomienia są konfigurowalne, ale wysyłane tylko w 3 punktach procesu.
10. Aplikacja musi być szybka na telefonie (PWA, offline shell).
