# Instalacja na hostingu współdzielonym SeoHost.pl — krok po kroku

> Ta wersja aplikacji jest napisana w **PHP + MySQL** specjalnie pod
> hosting współdzielony. Działa na zwykłym pakiecie hostingowym SeoHost
> (i większości polskich hostingów obsługujących PHP 8 + MySQL).

## Co dostaniesz

- Pełna aplikacja PWA (frontend) + backend w PHP (PDO/MySQL).
- Kreator instalacji w przeglądarce (6 kroków).
- Wszystkie 7 paneli ról (właściciel, pracownik placówki, pracownik
  prania, kierowca, logistyka, partner, placówka sieci).
- Skanowanie kodów QR pojedyncze i seryjne, automatyczna wycena,
  rozliczenia gotówki kierowców, powiadomienia e-mail i SMS.

## Czego potrzebujesz w SeoHost

✅ Pakiet hostingowy z **PHP 8.0+** i **MySQL** (każdy obecny pakiet
SeoHost to ma).
✅ Dostęp do **panelu hostingowego** (DirectAdmin lub podobny).
✅ Dostęp **FTP** (login + hasło dostajesz mailem od SeoHost po
zakupie).

❌ **Nie potrzebujesz** SSH ani nic instalować na serwerze.

---

# ⏱ Krótka mapa — co zrobimy

1. Pobierz paczkę aplikacji na komputer.
2. W panelu SeoHost utwórz bazę MySQL (3 minuty).
3. Wgraj pliki przez FTP do `public_html` (5–10 minut, zależy od
   internetu).
4. Otwórz domenę → kreator instalacji wypełni resztę.
5. Włącz HTTPS (1 klik w panelu SeoHost).

Razem ~30 minut.

---

# Krok 1. Pobierz paczkę aplikacji

Wejdź na repozytorium na GitHubie:
[Febrow/Pralnia-dywan-w](https://github.com/Febrow/Pralnia-dywan-w),
przełącz się na gałąź `feat/php-shared-hosting` i kliknij zielony przycisk
**Code → Download ZIP**.

Rozpakuj ZIP-a na komputerze. Zobaczysz strukturę:

```
Pralnia-dywan-w-feat-php-shared-hosting/
├── apps/web/dist/        ← skompilowany frontend (pliki HTML/JS/CSS)
├── php/                  ← backend PHP
└── ...
```

> **Uwaga:** w paczce ZIP może nie być folderu `apps/web/dist/`.
> Wtedy potrzebujemy go jednorazowo zbudować — patrz „[Co jeśli nie
> mam dist/](#co-jeśli-nie-mam-appswebdist)" na końcu instrukcji.

W docelowej strukturze, którą będziesz wgrywać na serwer, połączymy
te dwa katalogi (krok 3).

---

# Krok 2. Utwórz bazę MySQL w panelu SeoHost

1. Zaloguj się do **panelu hostingowego SeoHost** (DirectAdmin) —
   adres dostałeś w mailu od SeoHost.
2. Znajdź sekcję **„Bazy danych" / „MySQL"** (zwykle w głównym menu).
3. Kliknij **„Utwórz nową bazę"**.
4. Wpisz:
   - **Nazwa bazy:** np. `pralnia` (panel automatycznie doda Twój
     prefiks użytkownika, np. `xxxxx_pralnia`)
   - **Użytkownik bazy:** np. `pralnia` (tu też prefiks: `xxxxx_pralnia`)
   - **Hasło:** wymyśl silne, **zapisz je sobie** (będzie potrzebne za
     chwilę).
5. **Zapisz pełne dane:**
   - **Host MySQL:** zwykle `localhost` (czasem `mysql.serwer123.seohost.pl`
     — sprawdź w panelu).
   - **Port:** `3306` (domyślny, zwykle nie trzeba wpisywać).
   - **Nazwa bazy** (z prefiksem!).
   - **Użytkownik** (z prefiksem!).
   - **Hasło**.

> 💾 Zapisz to wszystko w notatniku — będziesz tym wypełniać kreator
> w kroku 4.

---

# Krok 3. Wgraj pliki przez FTP

Potrzebujesz programu FTP. Najpopularniejsze i darmowe:
- **[FileZilla](https://filezilla-project.org/)** (Windows / Mac /
  Linux) — najczęstszy wybór.
- **WinSCP** (Windows).

## 3.1. Połącz się z serwerem

Otwórz FileZillę:
- **Host (serwer):** dostałeś w mailu od SeoHost (np. `ftp.serwer123.seohost.pl`).
- **Nazwa użytkownika:** też w mailu.
- **Hasło:** też w mailu.
- **Port:** `21` (lub zostaw puste).

Kliknij **„Szybkie połączenie"**.

## 3.2. Co i gdzie wgrać

Po lewej stronie FileZilli widzisz pliki na **swoim komputerze**, po
prawej pliki **na serwerze**. Po prawej stronie wejdź do katalogu
**`public_html`** (lub `domains/twojadomena.pl/public_html` jeśli masz
wiele domen).

Z paczki, którą rozpakowałeś (krok 1), wgraj **zawartość** poniższych
katalogów do `public_html`:

| Z paczki na komputerze | Gdzie wgrywasz na serwerze |
| --- | --- |
| `apps/web/dist/` (cała zawartość) | `public_html/` |
| `php/` (cały folder) | `public_html/php/` |

## 3.3. Wzorcowa struktura na serwerze

Po wgrywaniu w `public_html` powinieneś mieć:

```
public_html/
├── index.html              ← z apps/web/dist/
├── manifest.webmanifest    ← z apps/web/dist/
├── sw.js                   ← z apps/web/dist/
├── favicon.svg             ← z apps/web/dist/
├── assets/                 ← z apps/web/dist/ (cały folder z JS/CSS)
├── php/                    ← cały folder z paczki
│   ├── index.php
│   ├── .htaccess
│   ├── lib/
│   └── sql/
└── (po instalacji) config/, uploads/
```

## 3.4. Stwórz dodatkowy `.htaccess` w `public_html/`

W programie FileZilla (po prawej stronie, w `public_html`) kliknij
prawym → **„Utwórz nowy plik"** i nazwij go `.htaccess` (z kropką
na początku!). Edytuj go (prawym → Wyświetl/Edytuj) i wklej:

```apache
RewriteEngine On

# Pliki statyczne (assets/, sw.js, manifest.webmanifest itd.) — serwuj wprost
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# /api/* i /uploads/* obsługuje PHP
RewriteRule ^api(/.*)?$ php/index.php [L,QSA]
RewriteRule ^uploads/(.+)$ php/uploads/$1 [L]

# Wszystko inne to SPA — pokaż index.html
RewriteRule ^ index.html [L]
```

Zapisz i wgraj na serwer (FileZilla pyta automatycznie po edycji).

---

# Krok 4. Otwórz domenę i przejdź kreator instalacji

Wejdź w przeglądarce na `http://twojadomena.pl`.

Powinien się pokazać **kreator instalacji** (6 kroków):

1. **Konto właściciela:** Twoje imię, nazwisko, e-mail, hasło (min. 8
   znaków).
2. **Magazyn centralny:** nazwa, miasto, adres pralni.
3. **Baza MySQL** ← tu wpisujesz dane z kroku 2:
   - Host (zwykle `localhost`)
   - Port `3306`
   - Nazwa bazy (np. `xxxxx_pralnia`)
   - Użytkownik (np. `xxxxx_pralnia`)
   - Hasło bazy
4. **SMTP** (opcjonalnie — możesz pominąć, ustawisz później).
5. **SMS** (zostaw „Console" — ustawisz dostawcę później).
6. **Pula QR** (zostaw 200 albo wpisz ile chcesz wygenerować na
   start).

Kliknij **„Zainstaluj"**. System sam stworzy wszystkie tabele w bazie i
przekieruje Cię do logowania.

✅ **Gotowe!** Logujesz się danymi z kroku 1 → trafiasz do panelu
właściciela.

---

# Krok 5. Włącz HTTPS (zalecane przed używaniem)

⚠️ **Bez HTTPS skaner kodów QR z aparatu telefonu nie zadziała** —
przeglądarki blokują dostęp do kamery na zwykłym HTTP.

W panelu SeoHost znajdź sekcję **„SSL"** lub **„Let's Encrypt"** i włącz
darmowy certyfikat dla swojej domeny (jeden klik, certyfikat się sam
wygeneruje w 1–2 minuty).

Po tym otwierasz `https://twojadomena.pl` i widzisz zieloną kłódkę.

---

# 📲 Co potem (codzienne używanie)

## Dodawanie użytkowników (kierowca, pracownik prania itp.)

Zalogowany jako właściciel:
1. Menu → **„Użytkownicy"**.
2. Wypełnij imię, nazwisko, e-mail, hasło.
3. Wybierz rolę (np. `DRIVER` = kierowca, `WASHING_WORKER` = pracownik
   prania).
4. Kliknij **„Dodaj użytkownika"**.

Pracownik dostaje login (e-mail) + hasło, którego mu wymyśliłeś.
Wchodzi na ten sam adres `https://twojadomena.pl` i loguje się — sam
trafia do swojego panelu zgodnie z rolą.

## Generowanie naklejek z kodami QR

Menu → **„Pula QR"** → widzisz wygenerowane kody. Możesz dogenerować
więcej. Z listy kodów stwórz naklejki QR — najprościej zlecić to
drukarni (oddajesz im plik z listą kodów, oni drukują kod QR na
samoprzylepnym papierze).

## Powiadomienia e-mail (SMTP)

Menu → **„Ustawienia"** → sekcja **SMTP**. Wpisz dane SMTP otrzymane
od dostawcy poczty:

- Z SeoHost (jeśli używasz konta pocztowego ze swojej domeny):
  - Host: zwykle `mail.twojadomena.pl` lub `serwer123.seohost.pl`
  - Port: `587` (STARTTLS) albo `465` (SSL)
  - Użytkownik: pełny adres e-mail
  - Hasło: hasło tego konta
- Z Gmaila (Google Workspace) lub własnego serwera — analogicznie.

## Powiadomienia SMS

Menu → **„Ustawienia"** → sekcja **SMS**:
- Wybierz dostawcę (najprostszy w PL: **SMSAPI.pl**).
- Wpisz **API Key** (dostajesz po założeniu konta u dostawcy).
- Pole **„Nazwa nadawcy"** — tak będzie wyglądał nadawca SMS-a (np.
  `Pralnia`).

## Backup bazy

W panelu SeoHost → sekcja **„Bazy danych"** → znajdź swoją bazę →
przycisk **„Eksportuj"** lub **„Backup"**. Zapisz plik `.sql` na
swoim komputerze (raz w tygodniu wystarczy).

## Aktualizacje aplikacji

Gdy w repozytorium pojawi się nowa wersja:
1. Pobierz nowy ZIP.
2. Wgraj nowe pliki przez FTP (zastąp istniejące w `public_html/`).
3. **Nie ruszaj** plików `config/` — tam są Twoje dane.
4. Otwórz aplikację → na 99% zadziała od razu. Jeśli pojawi się
   informacja o aktualizacji bazy — zaloguj się jako właściciel,
   aplikacja sama dorobi nowe tabele.

---

# 🆘 Najczęstsze problemy

## „Nie udało się połączyć z bazą"

- Sprawdź dane bazy w panelu SeoHost (host, nazwa, użytkownik, hasło).
- Pamiętaj o **prefiksach** w nazwie bazy i użytkownika (np.
  `xxxxx_pralnia`, nie samo `pralnia`).
- Jeśli SeoHost wymaga konkretnego hosta MySQL (np. `mysql.serwer123.seohost.pl`),
  wpisz go zamiast `localhost`.

## „Strona pokazuje 500 Internal Server Error"

- Sprawdź wersję PHP w panelu SeoHost — wymagamy **PHP 8.0+**. W
  panelu można wybrać wersję PHP per katalog.
- Sprawdź uprawnienia: katalogi `php/config/` i `php/uploads/`
  powinny mieć prawa zapisu (zwykle `755` lub `775`). FileZilla →
  prawym na folderze → „Uprawnienia plików".

## „Skaner QR nie działa na telefonie"

- Zainstaluj certyfikat SSL (krok 5). Bez HTTPS przeglądarki blokują
  kamerę poza `localhost`.

## „Wpisałem złe dane bazy w kreatorze"

Jeżeli kreator się zatrzymał na kroku 3 z błędem:
1. Wejdź na FTP do `public_html/php/config/`.
2. Skasuj plik `config.php` (jeśli istnieje).
3. Otwórz domenę ponownie — kreator startuje od początku.

## „Otrzymałem od SeoHost jakieś inne dane do bazy"

Każdy hosting ma drobne różnice. Najważniejsze: w panelu SeoHost po
utworzeniu bazy zobaczysz dokładnie jakie dane wpisać. Skopiuj je 1:1
do kreatora.

---

# 🔧 Co jeśli nie ma `apps/web/dist/`?

Jeśli pobrałeś repo i nie ma w nim katalogu `apps/web/dist/`, trzeba
go raz zbudować. Najprościej:

1. Zainstaluj **Node.js 20+** na komputerze:
   [nodejs.org/download](https://nodejs.org/download).
2. Otwórz folder z repo w Terminalu / CMD.
3. Wpisz po kolei:
   ```bash
   npm install
   npm run build
   ```
4. Po chwili pojawi się katalog `apps/web/dist/` — to są pliki, które
   wgrywasz na FTP (krok 3).

Jeśli to dla Ciebie za techniczne — daj znać, dorzucę do repozytorium
gotową paczkę ZIP z już zbudowanymi plikami statycznymi do wgrania
1:1.
