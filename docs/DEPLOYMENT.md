# Wdrożenie na własnym hostingu (MySQL)

Aplikacja jest jednym procesem Node.js, który serwuje API i statyczny
frontend (PWA) z tego samego portu. Baza: **MySQL 5.7+ / MariaDB 10.4+**.

> Wszystkie polecenia uruchamiasz po `cd <katalog-projektu>`.

## Wymagania

- **Node.js 20 lub nowszy** (zalecany 22).
- **MySQL 5.7+ albo MariaDB 10.4+** (uwaga: na starszych MariaDB 10.2/10.3
  mogą wystąpić problemy z `LongText` przy `SystemSetting` — zaktualizuj).
- Dostęp do shella SSH (na shared hostingu zwykle przez panel typu cPanel).
- Wolny port (np. 3000) na backend albo proxy w panelu hostingu.

## 1. Krok po kroku — VPS (Ubuntu/Debian, własny serwer)

### 1.1. Zainstaluj Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # >= 20
```

### 1.2. Zainstaluj MySQL i utwórz bazę

```bash
sudo apt-get install -y mysql-server
sudo systemctl enable --now mysql
sudo mysql_secure_installation   # ustaw hasło root, defaulty domknij

sudo mysql -uroot -p
```

W konsoli MySQL:

```sql
CREATE DATABASE pralnia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pralnia'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON pralnia.* TO 'pralnia'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 1.3. Sklonuj repo i skonfiguruj `.env`

```bash
git clone https://github.com/Febrow/Pralnia-dywan-w.git
cd Pralnia-dywan-w
git checkout feat/full-mvp     # albo main, jeśli już zmergowany
```

Utwórz `apps/api/.env`:

```env
PORT=3000
JWT_SECRET=POMIEN-NA-DLUGI-LOSOWY-CIAG-MIN-32-ZNAKI
DATABASE_URL="mysql://pralnia:STRONG_PASSWORD_HERE@localhost:3306/pralnia"
UPLOAD_DIR=./data/uploads
```

> Nigdy nie commituj `.env` z prawdziwymi hasłami.

### 1.4. Build + utworzenie schematu w bazie

```bash
npm run setup
```

To:
- instaluje zależności,
- uruchamia `prisma generate && prisma db push` (tworzy wszystkie tabele
  w MySQL),
- buduje frontend.

### 1.5. Uruchom aplikację

Najprościej, w terminalu:
```bash
npm start
```

Aplikacja słucha na porcie z `.env` (domyślnie 3000). Otwórz w
przeglądarce: `http://serwer:3000`. Pojawi się **kreator instalacji**.

### 1.6. Uruchamianie jako usługa (PM2)

Żeby aplikacja przeżyła restart serwera i sama się restartowała po awarii:

```bash
sudo npm install -g pm2
pm2 start "npm start" --name pralnia
pm2 save
pm2 startup     # zastosuj polecenie, które wypisze
```

Logi:
```bash
pm2 logs pralnia
pm2 monit
```

### 1.7. Reverse proxy + HTTPS (Nginx + Let's Encrypt)

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Plik `/etc/nginx/sites-available/pralnia`:

```nginx
server {
    server_name pralnia.twojadomena.pl;

    client_max_body_size 20m;   # uploady zdjęć

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 80;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pralnia /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d pralnia.twojadomena.pl
```

> **HTTPS jest wymagany do skanera kamerowego** (przeglądarki blokują
> dostęp do kamery na zwykłym HTTP poza `localhost`).

## 2. Shared hosting (cPanel / DirectAdmin / podobne)

Większość hostingów obsługujących Node.js (np. mydevil.net, AttHost,
home.pl premium, smarthost) działa wg wzoru:

1. **Utwórz bazę MySQL** w panelu hostingu. Zapamiętaj host (np.
   `mysql.example.com`), port (zwykle 3306, czasem 3307), nazwę bazy,
   użytkownika i hasło.
2. **Utwórz aplikację Node.js** w panelu (Node.js 20 lub 22). Wskaż folder
   z kodem.
3. **Wgraj kod** (przez Git lub FTP) do tego folderu.
4. **W panelu** ustaw zmienne środowiskowe:
   - `JWT_SECRET=…długi losowy ciąg…`
   - `DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DBNAME`
   - `UPLOAD_DIR=./data/uploads`
5. W terminalu hostingu (lub przez „Run NPM Install" w panelu):
   ```bash
   npm install
   npm run -w apps/api db:setup
   npm run -w apps/web build
   ```
6. **Wskaż w panelu** plik startowy: `apps/api/dist/server.js`. Niektóre
   panele używają zamiast tego pola „Application startup command":
   `node apps/api/dist/server.js`.
7. Uruchom aplikację. Otwórz w przeglądarce — pojawi się kreator
   instalacji.

### Domena/subdomena

Większość hostingów pozwala podpiąć domenę/subdomenę pod aplikację Node
przez „Application URL". Po podpięciu — pamiętaj o włączeniu HTTPS
(zazwyczaj jednym kliknięciem, Let's Encrypt).

### Pamięć i CPU

System działa swobodnie na 512 MB RAM i 1 vCPU dla małej i średniej
pralni. Dla większego ruchu (kilka tysięcy zleceń miesięcznie) zalecam
1 GB RAM.

## 3. Wariant Docker (najprostszy)

W repo masz `docker-compose.yml`. Wystarczy:

```bash
cp .env.example .env       # edytuj hasła do MySQL i JWT_SECRET
docker compose up -d --build
```

Aplikacja będzie działać na `http://serwer:3000`. Baza MySQL jest w
osobnym kontenerze, dane przechowywane w wolumenie `mysql_data`.

## 4. Backup

### Baza danych

```bash
mysqldump -u pralnia -p pralnia > backup-$(date +%F).sql
```

Automatycznie codziennie (cron, jako użytkownik z dostępem):

```cron
0 3 * * * mysqldump -u pralnia -p'PASSWORD' pralnia | gzip > /home/user/backups/pralnia-$(date +\%F).sql.gz
0 4 * * * find /home/user/backups -name 'pralnia-*.sql.gz' -mtime +30 -delete
```

### Zdjęcia (uploady)

Folder `apps/api/data/uploads`. Backupuj jako paczkę (np. raz na dobę):

```bash
tar czf uploads-$(date +%F).tar.gz apps/api/data/uploads
```

## 5. Aktualizacje

```bash
git pull
npm install
npm run -w apps/api db:setup     # zaktualizuje schemę (idempotentne)
npm run -w apps/web build
pm2 restart pralnia              # albo restart usługi/aplikacji w panelu
```

`prisma db push` jest idempotentne — przy braku zmian schemy nie robi
nic. Przy zmianach dopisuje brakujące kolumny. **Nie** kasuje danych.

## 6. Najczęstsze problemy

### „Environment variable not found: DATABASE_URL"

Aplikacja nie znalazła pliku `.env`. Upewnij się, że masz `apps/api/.env`
z poprawnym `DATABASE_URL` lub że zmienna jest ustawiona w panelu
hostingu.

### „Access denied for user 'pralnia'@…"

Złe hasło lub host. Sprawdź, czy:
- użytkownik istnieje na danym hoście (`'pralnia'@'localhost'` vs
  `'pralnia'@'%'`),
- nadałeś `GRANT ALL ON pralnia.* TO 'pralnia'@'…'`.

### „ER_NOT_SUPPORTED_AUTH_MODE" (MySQL 8)

```sql
ALTER USER 'pralnia'@'localhost' IDENTIFIED WITH mysql_native_password BY 'PASSWORD';
FLUSH PRIVILEGES;
```

### Skaner QR nie działa

- Strona musi być na **HTTPS** (lub `localhost`).
- Użytkownik musi zezwolić na dostęp do kamery.

### Powiadomienia e-mail/SMS nie wychodzą

- Sprawdź `Ustawienia → SMTP` i `Ustawienia → SMS` w panelu właściciela.
- Sprawdź w panelu właściciela `Zlecenia → szczegóły → Historia
  powiadomień` (status `FAILED` z opisem błędu).
- Domyślny dostawca SMS to `console` — SMS-y są zapisywane w logach
  serwera, nie wysyłane realnie. Wybierz prawdziwego dostawcę po
  podłączeniu konta.

## 7. Dane kontaktowe i wsparcie

Plan etapów, model danych i pełna specyfikacja: [`docs/`](.).
