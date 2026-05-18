<?php
declare(strict_types=1);

class Router
{
    public static function dispatch(string $path): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        // CORS dla developmentu (gdy frontend serwowany z Vite na innym porcie)
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        if ($method === 'OPTIONS') { http_response_code(204); return; }

        try {
            // /api/install
            if ($path === '/api/install/status' && $method === 'GET') { self::installStatus(); return; }
            if ($path === '/api/install/run' && $method === 'POST') { self::installRun(); return; }

            if ($path === '/api/health') { Json::ok(['ok' => true]); return; }

            // /api/auth
            if ($path === '/api/auth/login' && $method === 'POST') { self::login(); return; }

            // Pozostałe endpointy wymagają zalogowania
            $user = Auth::require();

            if ($path === '/api/me') { Json::ok(['user' => $user]); return; }

            // /api/packages
            if ($path === '/api/packages' && $method === 'GET') { self::listPackages(); return; }
            if ($path === '/api/packages' && $method === 'POST') { self::createPackage($user); return; }
            if (preg_match('#^/api/packages/([^/]+)$#', $path, $m) && $method === 'PUT') { self::updatePackage($user, $m[1]); return; }

            // /api/branches
            if ($path === '/api/branches' && $method === 'GET') { self::listBranches($user); return; }
            if ($path === '/api/branches' && $method === 'POST') { self::createBranch($user); return; }
            if (preg_match('#^/api/branches/([^/]+)$#', $path, $m) && $method === 'PUT') { self::updateBranch($user, $m[1]); return; }

            // /api/users
            if ($path === '/api/users' && $method === 'GET') { self::listUsers($user); return; }
            if ($path === '/api/users' && $method === 'POST') { self::createUser($user); return; }
            if (preg_match('#^/api/users/([^/]+)$#', $path, $m) && $method === 'PUT') { self::updateUser($user, $m[1]); return; }

            // /api/customers
            if ($path === '/api/customers' && $method === 'GET') { self::listCustomers($user); return; }
            if ($path === '/api/customers/find-or-create' && $method === 'POST') { self::findOrCreateCustomer(); return; }

            // /api/orders
            if ($path === '/api/orders' && $method === 'GET') { self::listOrders($user); return; }
            if ($path === '/api/orders' && $method === 'POST') { self::createOrder($user); return; }
            if (preg_match('#^/api/orders/([^/]+)$#', $path, $m) && $method === 'GET') { self::getOrder($user, $m[1]); return; }
            if (preg_match('#^/api/orders/([^/]+)$#', $path, $m) && $method === 'PUT') { self::updateOrder($user, $m[1]); return; }
            if (preg_match('#^/api/orders/([^/]+)/rugs$#', $path, $m) && $method === 'POST') { self::addRug($user, $m[1]); return; }
            if (preg_match('#^/api/orders/([^/]+)/finalize$#', $path, $m) && $method === 'POST') { self::finalizeOrder($user, $m[1]); return; }
            if (preg_match('#^/api/orders/([^/]+)/assign-driver$#', $path, $m) && $method === 'POST') { self::assignDriver($user, $m[1]); return; }

            // /api/rugs
            if ($path === '/api/rugs' && $method === 'GET') { self::listRugs($user); return; }
            if (preg_match('#^/api/rugs/by-qr/(.+)$#', $path, $m) && $method === 'GET') { self::rugByQr($user, urldecode($m[1])); return; }
            if (preg_match('#^/api/rugs/([^/]+)$#', $path, $m) && $method === 'PUT') { self::updateRug($user, $m[1]); return; }
            if (preg_match('#^/api/rugs/([^/]+)/status$#', $path, $m) && $method === 'POST') { self::rugStatus($user, $m[1]); return; }

            // /api/scan
            if ($path === '/api/scan/bulk' && $method === 'POST') { self::scanBulk($user); return; }
            if ($path === '/api/scan/next-available-code' && $method === 'GET') { self::nextAvailableCode(); return; }

            // /api/qr-pool
            if ($path === '/api/qr-pool' && $method === 'GET') { self::qrPoolStatus(); return; }
            if ($path === '/api/qr-pool/generate' && $method === 'POST') { self::qrPoolGenerate($user); return; }

            // /api/photos/:rugId  (multipart/form-data)
            if (preg_match('#^/api/photos/([^/]+)$#', $path, $m) && $method === 'POST') { self::uploadPhoto($user, $m[1]); return; }

            // /api/settings
            if ($path === '/api/settings' && $method === 'GET') { self::listSettings($user); return; }
            if ($path === '/api/settings' && $method === 'PUT') { self::saveSetting($user); return; }

            // /api/settlements
            if ($path === '/api/settlements/me' && $method === 'GET') { self::mySettlements($user); return; }
            if ($path === '/api/settlements' && $method === 'GET') { self::listSettlements($user); return; }
            if (preg_match('#^/api/settlements/([^/]+)/settle$#', $path, $m) && $method === 'POST') { self::settleSettlement($user, $m[1]); return; }

            // /api/statistics
            if ($path === '/api/statistics/dashboard' && $method === 'GET') { self::statsDashboard($user); return; }
            if ($path === '/api/statistics/drivers-today' && $method === 'GET') { self::statsDriversToday($user); return; }
            if ($path === '/api/statistics/partners-month' && $method === 'GET') { self::statsPartnersMonth($user); return; }

            Json::error('Nie znaleziono endpointu', 404);
        } catch (Throwable $e) {
            Json::error('Błąd serwera: ' . $e->getMessage(), 500);
        }
    }

    // -----------------------------------------------------------------
    // INSTALL
    // -----------------------------------------------------------------
    private static function installStatus(): void
    {
        Json::ok(['installed' => Db::isInstalled()]);
    }

    private static function installRun(): void
    {
        if (Db::isInstalled()) {
            Json::error('System jest już zainstalowany.', 409);
            return;
        }
        $b = Json::body();

        // Walidacja minimalna
        $owner = $b['owner'] ?? [];
        if (!is_array($owner) || empty($owner['email']) || empty($owner['password']) || empty($owner['firstName']) || empty($owner['lastName'])) {
            Json::error('Wszystkie pola właściciela są wymagane.', 400);
            return;
        }
        if (strlen((string) $owner['password']) < 8) {
            Json::error('Hasło musi mieć minimum 8 znaków.', 400);
            return;
        }
        $branch = $b['centralBranch'] ?? [];
        if (!is_array($branch) || empty($branch['name'])) {
            Json::error('Nazwa magazynu centralnego jest wymagana.', 400);
            return;
        }

        // 1) Zapisz config bazy
        $existingCfg = Config::load();
        $db = $b['db'] ?? $existingCfg;
        if (empty($db['db_host']) || empty($db['db_name']) || empty($db['db_user'])) {
            Json::error('Brak danych bazy danych. Uzupełnij krok „Baza MySQL".', 400);
            return;
        }
        $cfg = [
            'db_host' => $db['db_host'],
            'db_port' => (int) ($db['db_port'] ?? 3306),
            'db_name' => $db['db_name'],
            'db_user' => $db['db_user'],
            'db_pass' => $db['db_pass'] ?? '',
            'jwt_secret' => bin2hex(random_bytes(32)),
            'upload_dir' => $existingCfg['upload_dir'] ?? (__DIR__ . '/../uploads'),
            'installed_at' => date('c'),
        ];
        Config::save($cfg);

        // 2) Test połączenia + tworzenie schematu
        try {
            Db::ensureSchema();
        } catch (Throwable $e) {
            // wycofaj config, żeby instalator znów się pokazał
            @unlink(Config::path());
            Json::error('Nie udało się połączyć z bazą lub utworzyć tabel: ' . $e->getMessage(), 500);
            return;
        }

        $pdo = Db::get();

        // 3) Konto OWNER
        $ownerId = Db::cuid();
        $st = $pdo->prepare(
            'INSERT INTO users (id, email, passwordHash, firstName, lastName, role) VALUES (?, ?, ?, ?, ?, ?)'
        );
        $st->execute([
            $ownerId,
            $owner['email'],
            Auth::hashPassword((string) $owner['password']),
            $owner['firstName'],
            $owner['lastName'],
            'OWNER',
        ]);

        // 4) Magazyn centralny
        $branchId = Db::cuid();
        $st = $pdo->prepare(
            'INSERT INTO branches (id, type, name, city, address) VALUES (?, ?, ?, ?, ?)'
        );
        $st->execute([
            $branchId,
            'CENTRAL_WAREHOUSE',
            $branch['name'],
            $branch['city'] ?? null,
            $branch['address'] ?? null,
        ]);

        // 5) Przypnij OWNER do magazynu centralnego
        $st = $pdo->prepare('INSERT INTO memberships (id, userId, branchId, role) VALUES (?, ?, ?, ?)');
        $st->execute([Db::cuid(), $ownerId, $branchId, 'OWNER']);

        // 6) Pakiety + RequiredStep
        $packagesInput = $b['packages'] ?? Statuses::DEFAULT_PACKAGES;
        foreach ($packagesInput as $idx => $p) {
            $pid = Db::cuid();
            $st = $pdo->prepare('INSERT INTO packages (id, name, pricePerM2, sortOrder) VALUES (?, ?, ?, ?)');
            $st->execute([$pid, $p['name'], $p['pricePerM2'], $idx + 1]);
            $required = $p['requiredSteps'] ?? null;
            if ($required === null) {
                foreach (Statuses::DEFAULT_PACKAGES as $d) {
                    if ($d['name'] === $p['name']) { $required = $d['requiredSteps']; break; }
                }
                $required = $required ?? [];
            }
            $steps = array_merge(Statuses::ALWAYS_REQUIRED_STEPS, $required);
            $order = 1;
            foreach ($steps as $status) {
                $st = $pdo->prepare('INSERT INTO required_steps (id, packageId, status, sortOrder) VALUES (?, ?, ?, ?)');
                $st->execute([Db::cuid(), $pid, $status, $order++]);
            }
        }

        // 7) Ustawienia (SMTP, SMS, branding, szablony)
        if (!empty($b['smtp']['host'])) {
            self::saveSettingByKey('smtp', $b['smtp']);
        }
        self::saveSettingByKey('sms', $b['sms'] ?? ['provider' => 'console', 'apiKey' => '', 'sender' => 'Pralnia']);
        self::saveSettingByKey('branding', $b['branding'] ?? []);
        $defaults = self::defaultTemplates();
        foreach ($defaults as $k => $v) self::saveSettingByKey($k, $v);

        // 8) Pula kodów QR
        $qrCount = (int) ($b['qrPoolSize'] ?? 200);
        $generated = 0;
        if ($qrCount > 0) {
            $prefix = 'RUG-' . substr((string) base_convert((string) (int) (microtime(true) * 1000), 10, 36), 0, 8);
            $st = $pdo->prepare('INSERT INTO qr_codes (code) VALUES (?)');
            for ($i = 1; $i <= $qrCount; $i++) {
                $code = $prefix . '-' . str_pad((string) $i, 5, '0', STR_PAD_LEFT);
                try { $st->execute([$code]); $generated++; }
                catch (Throwable $e) { /* duplikat — pomijamy */ }
            }
        }

        Json::ok(['ok' => true, 'ownerId' => $ownerId, 'branchId' => $branchId, 'qrPoolGenerated' => $generated]);
    }

    private static function saveSettingByKey(string $key, mixed $value): void
    {
        $st = Db::get()->prepare(
            'INSERT INTO system_settings (setting_key, value) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE value = VALUES(value)'
        );
        $st->execute([$key, json_encode($value, JSON_UNESCAPED_UNICODE)]);
    }

    private static function defaultTemplates(): array
    {
        return [
            'templates.email.order_accepted' => [
                'subject' => 'Potwierdzenie przyjęcia zlecenia {{number}}',
                'body' => "Dzień dobry {{firstName}},\n\nDziękujemy za skorzystanie z naszych usług. Przyjęliśmy zlecenie nr {{number}}.\nLiczba dywanów: {{rugCount}}\nŁączna powierzchnia: {{areaM2}} m²\nŁączna kwota: {{totalPrice}} zł brutto\n\nPozdrawiamy,\nPralnia Dywanów",
            ],
            'templates.email.ready_for_pickup' => [
                'subject' => 'Twoje zlecenie {{number}} jest gotowe do odbioru',
                'body' => "Dzień dobry {{firstName}},\n\nInformujemy, że dywany ze zlecenia {{number}} są gotowe do odbioru.\n\nPozdrawiamy,\nPralnia Dywanów",
            ],
            'templates.email.in_delivery' => [
                'subject' => 'Dywany ze zlecenia {{number}} zostaną dziś doręczone',
                'body' => "Dzień dobry {{firstName}},\n\nKierowca wyrusza dziś z dywanami ze zlecenia {{number}}.\nKwota do pobrania: {{totalPrice}} zł.\n\nPozdrawiamy,\nPralnia Dywanów",
            ],
            'templates.sms.order_accepted' => [
                'body' => 'Pralnia: przyjęliśmy zlecenie {{number}}, dywany: {{rugCount}}, kwota: {{totalPrice}} zł.',
            ],
            'templates.sms.ready_for_pickup' => [
                'body' => 'Pralnia: zlecenie {{number}} gotowe do odbioru.',
            ],
            'templates.sms.in_delivery' => [
                'body' => 'Pralnia: zlecenie {{number}} w doręczeniu, kwota: {{totalPrice}} zł.',
            ],
        ];
    }

    // -----------------------------------------------------------------
    // AUTH
    // -----------------------------------------------------------------
    private static function login(): void
    {
        $b = Json::body();
        $email = trim((string) ($b['email'] ?? ''));
        $password = (string) ($b['password'] ?? '');
        if (!$email || !$password) { Json::error('Niepoprawne dane', 400); return; }
        $st = Db::get()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $st->execute([$email]);
        $user = $st->fetch();
        if (!$user || !$user['isActive'] || !Auth::verifyPassword($password, $user['passwordHash'])) {
            Json::error('Nieprawidłowe dane logowania', 401);
            return;
        }
        $token = Auth::sign($user['id']);
        Json::ok(['token' => $token, 'user' => Auth::loadUser($user['id'])]);
    }

    // -----------------------------------------------------------------
    // PACKAGES
    // -----------------------------------------------------------------
    private static function listPackages(): void
    {
        $pkgs = Db::get()->query('SELECT * FROM packages ORDER BY sortOrder')->fetchAll();
        $st = Db::get()->prepare('SELECT * FROM required_steps WHERE packageId = ? ORDER BY sortOrder');
        foreach ($pkgs as &$p) {
            $st->execute([$p['id']]);
            $p['requiredSteps'] = $st->fetchAll();
            $p['pricePerM2'] = (float) $p['pricePerM2'];
        }
        Json::ok($pkgs);
    }

    private static function createPackage(array $u): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $b = Json::body();
        if (empty($b['name']) || !isset($b['pricePerM2'])) { Json::error('Niepoprawne dane', 400); return; }
        $pdo = Db::get();
        $max = $pdo->query('SELECT COALESCE(MAX(sortOrder),0) AS m FROM packages')->fetch()['m'] ?? 0;
        $id = Db::cuid();
        $pdo->prepare('INSERT INTO packages (id, name, pricePerM2, sortOrder, isActive) VALUES (?, ?, ?, ?, ?)')
            ->execute([$id, $b['name'], (float) $b['pricePerM2'], $max + 1, !empty($b['isActive'] ?? true) ? 1 : 0]);
        $required = $b['requiredSteps'] ?? [];
        $steps = array_merge(Statuses::ALWAYS_REQUIRED_STEPS, $required);
        $order = 1;
        $stIns = $pdo->prepare('INSERT INTO required_steps (id, packageId, status, sortOrder) VALUES (?, ?, ?, ?)');
        foreach ($steps as $s) $stIns->execute([Db::cuid(), $id, $s, $order++]);
        Json::ok(['id' => $id]);
    }

    private static function updatePackage(array $u, string $id): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $b = Json::body();
        $pdo = Db::get();
        $sets = [];
        $vals = [];
        foreach (['name' => 'name', 'pricePerM2' => 'pricePerM2', 'isActive' => 'isActive'] as $field => $col) {
            if (array_key_exists($field, $b)) { $sets[] = "$col = ?"; $vals[] = $b[$field]; }
        }
        if ($sets) {
            $vals[] = $id;
            $pdo->prepare('UPDATE packages SET ' . implode(',', $sets) . ' WHERE id = ?')->execute($vals);
        }
        if (isset($b['requiredSteps']) && is_array($b['requiredSteps'])) {
            $pdo->prepare('DELETE FROM required_steps WHERE packageId = ?')->execute([$id]);
            $steps = array_merge(Statuses::ALWAYS_REQUIRED_STEPS, $b['requiredSteps']);
            $order = 1;
            $stIns = $pdo->prepare('INSERT INTO required_steps (id, packageId, status, sortOrder) VALUES (?, ?, ?, ?)');
            foreach ($steps as $s) $stIns->execute([Db::cuid(), $id, $s, $order++]);
        }
        Json::ok(['id' => $id]);
    }

    // -----------------------------------------------------------------
    // BRANCHES
    // -----------------------------------------------------------------
    private static function listBranches(array $u): void
    {
        $pdo = Db::get();
        if ($u['role'] === 'OWNER') {
            $rows = $pdo->query('SELECT * FROM branches ORDER BY createdAt')->fetchAll();
        } else {
            if (!$u['primaryBranchId']) { Json::ok([]); return; }
            $st = $pdo->prepare('SELECT * FROM branches WHERE id = ?');
            $st->execute([$u['primaryBranchId']]);
            $rows = $st->fetchAll();
        }
        Json::ok($rows);
    }

    private static function createBranch(array $u): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $b = Json::body();
        if (empty($b['type']) || empty($b['name'])) { Json::error('Niepoprawne dane', 400); return; }
        if ($b['type'] === 'CENTRAL_WAREHOUSE') {
            $exists = Db::get()->query("SELECT id FROM branches WHERE type='CENTRAL_WAREHOUSE'")->fetch();
            if ($exists) { Json::error('Magazyn centralny już istnieje.', 409); return; }
        }
        $id = Db::cuid();
        Db::get()->prepare('INSERT INTO branches (id, type, name, city, address) VALUES (?, ?, ?, ?, ?)')
            ->execute([$id, $b['type'], $b['name'], $b['city'] ?? null, $b['address'] ?? null]);
        Json::ok(['id' => $id]);
    }

    private static function updateBranch(array $u, string $id): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $b = Json::body();
        $sets = [];
        $vals = [];
        foreach (['name', 'city', 'address', 'partnerPriceListId'] as $field) {
            if (array_key_exists($field, $b)) { $sets[] = "$field = ?"; $vals[] = $b[$field]; }
        }
        if (!$sets) { Json::ok(['id' => $id]); return; }
        $vals[] = $id;
        Db::get()->prepare('UPDATE branches SET ' . implode(',', $sets) . ' WHERE id = ?')->execute($vals);
        Json::ok(['id' => $id]);
    }

    // -----------------------------------------------------------------
    // USERS
    // -----------------------------------------------------------------
    private static function listUsers(array $u): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $pdo = Db::get();
        $rows = $pdo->query('SELECT * FROM users ORDER BY createdAt DESC')->fetchAll();
        $stMem = $pdo->prepare('SELECT m.branchId AS id, b.name AS name, b.type AS type FROM memberships m JOIN branches b ON b.id = m.branchId WHERE m.userId = ?');
        $out = [];
        foreach ($rows as $r) {
            $stMem->execute([$r['id']]);
            $out[] = [
                'id' => $r['id'], 'email' => $r['email'], 'firstName' => $r['firstName'],
                'lastName' => $r['lastName'], 'role' => $r['role'], 'isActive' => (bool) $r['isActive'],
                'branches' => $stMem->fetchAll(),
            ];
        }
        Json::ok($out);
    }

    private static function createUser(array $u): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $b = Json::body();
        if (empty($b['email']) || empty($b['password']) || empty($b['firstName']) || empty($b['lastName']) || empty($b['role'])) {
            Json::error('Wymagane: email, password, firstName, lastName, role', 400); return;
        }
        if (strlen((string) $b['password']) < 8) { Json::error('Hasło min. 8 znaków', 400); return; }
        $pdo = Db::get();
        $exists = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $exists->execute([$b['email']]);
        if ($exists->fetch()) { Json::error('Użytkownik z tym e-mailem już istnieje.', 409); return; }
        $id = Db::cuid();
        $pdo->prepare('INSERT INTO users (id, email, passwordHash, firstName, lastName, role) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$id, $b['email'], Auth::hashPassword($b['password']), $b['firstName'], $b['lastName'], $b['role']]);
        if (!empty($b['branchId'])) {
            $pdo->prepare('INSERT INTO memberships (id, userId, branchId, role) VALUES (?, ?, ?, ?)')
                ->execute([Db::cuid(), $id, $b['branchId'], $b['role']]);
        }
        Json::ok(['id' => $id]);
    }

    private static function updateUser(array $u, string $id): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $b = Json::body();
        $sets = [];
        $vals = [];
        if (isset($b['password']) && $b['password']) { $sets[] = 'passwordHash = ?'; $vals[] = Auth::hashPassword($b['password']); }
        foreach (['firstName', 'lastName', 'email', 'role', 'isActive'] as $f) {
            if (array_key_exists($f, $b)) { $sets[] = "$f = ?"; $vals[] = $b[$f]; }
        }
        if (!$sets) { Json::ok(['id' => $id]); return; }
        $vals[] = $id;
        Db::get()->prepare('UPDATE users SET ' . implode(',', $sets) . ' WHERE id = ?')->execute($vals);
        Json::ok(['id' => $id]);
    }

    // -----------------------------------------------------------------
    // CUSTOMERS
    // -----------------------------------------------------------------
    private static function listCustomers(array $u): void
    {
        if (!in_array($u['role'], ['OWNER', 'LOGISTICS', 'STATIONARY_BRANCH_WORKER'], true)) { Json::error('Brak uprawnień', 403); return; }
        $q = trim((string) ($_GET['q'] ?? ''));
        if ($q !== '') {
            $st = Db::get()->prepare(
                'SELECT * FROM customers
                 WHERE firstName LIKE :q OR lastName LIKE :q OR phone LIKE :q OR email LIKE :q
                 ORDER BY createdAt DESC LIMIT 100'
            );
            $st->execute([':q' => '%' . $q . '%']);
        } else {
            $st = Db::get()->query('SELECT * FROM customers ORDER BY createdAt DESC LIMIT 100');
        }
        Json::ok($st->fetchAll());
    }

    private static function findOrCreateCustomer(): void
    {
        $b = Json::body();
        foreach (['firstName', 'lastName', 'phone', 'email'] as $f) {
            if (empty($b[$f])) { Json::error('Brak pola: ' . $f, 400); return; }
        }
        $st = Db::get()->prepare('SELECT * FROM customers WHERE phone = ? OR email = ? LIMIT 1');
        $st->execute([$b['phone'], $b['email']]);
        $row = $st->fetch();
        if ($row) { Json::ok($row); return; }
        $id = Db::cuid();
        Db::get()->prepare('INSERT INTO customers (id, firstName, lastName, phone, email) VALUES (?, ?, ?, ?, ?)')
            ->execute([$id, $b['firstName'], $b['lastName'], $b['phone'], $b['email']]);
        $st->execute([$b['phone'], $b['email']]);
        Json::ok($st->fetch());
    }

    // -----------------------------------------------------------------
    // ORDERS
    // -----------------------------------------------------------------
    private static function listOrders(array $u): void
    {
        $pdo = Db::get();
        $where = [];
        $params = [];
        switch ($u['role']) {
            case 'OWNER':
            case 'LOGISTICS':
            case 'WASHING_WORKER':
                break;
            case 'STATIONARY_BRANCH_WORKER':
            case 'STATIONARY_BRANCH':
                if ($u['primaryBranchId']) { $where[] = 'o.acceptingBranchId = ?'; $params[] = $u['primaryBranchId']; }
                break;
            case 'PARTNER_BRANCH':
                if ($u['primaryBranchId']) { $where[] = 'o.partnerBranchId = ?'; $params[] = $u['primaryBranchId']; }
                break;
            case 'DRIVER':
                $where[] = 'o.driverId = ?'; $params[] = $u['id']; break;
        }
        $q = trim((string) ($_GET['q'] ?? ''));
        if ($q !== '') {
            $where[] = '(o.number LIKE :q OR c.firstName LIKE :q OR c.lastName LIKE :q OR c.phone LIKE :q OR c.email LIKE :q OR EXISTS (SELECT 1 FROM rugs r2 WHERE r2.orderId = o.id AND r2.qrCode LIKE :q))';
            $params[':q'] = '%' . $q . '%';
        }
        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
        $sql = "SELECT o.*, c.id AS cid, c.firstName AS cFirst, c.lastName AS cLast, c.phone AS cPhone, c.email AS cEmail,
                       b.name AS bName,
                       pb.id AS pbId, pb.name AS pbName,
                       d.id AS dId, d.firstName AS dFirst, d.lastName AS dLast
                FROM orders o
                JOIN customers c ON c.id = o.customerId
                LEFT JOIN branches b ON b.id = o.acceptingBranchId
                LEFT JOIN branches pb ON pb.id = o.partnerBranchId
                LEFT JOIN users d ON d.id = o.driverId
                $whereSql
                ORDER BY o.createdAt DESC LIMIT 500";
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $orders = $st->fetchAll();

        $stRugs = $pdo->prepare(
            'SELECT r.*, p.name AS packageName FROM rugs r LEFT JOIN packages p ON p.id = r.packageId WHERE r.orderId = ?'
        );
        $out = [];
        foreach ($orders as $o) {
            $stRugs->execute([$o['id']]);
            $rugs = array_map([self::class, 'mapRug'], $stRugs->fetchAll());
            $out[] = [
                'id' => $o['id'],
                'number' => $o['number'],
                'source' => $o['source'],
                'computedStatus' => $o['computedStatus'],
                'totalAreaM2' => (float) $o['totalAreaM2'],
                'totalGrossPrice' => (float) $o['totalGrossPrice'],
                'createdAt' => $o['createdAt'],
                'pickupAddress' => $o['pickupAddress'],
                'deliveryAddress' => $o['deliveryAddress'],
                'customer' => ['id' => $o['cid'], 'firstName' => $o['cFirst'], 'lastName' => $o['cLast'], 'phone' => $o['cPhone'], 'email' => $o['cEmail']],
                'rugs' => $rugs,
                'driver' => $o['dId'] ? ['id' => $o['dId'], 'firstName' => $o['dFirst'], 'lastName' => $o['dLast']] : null,
                'acceptingBranch' => ['id' => $o['acceptingBranchId'], 'name' => $o['bName']],
                'partnerBranch' => $o['pbId'] ? ['id' => $o['pbId'], 'name' => $o['pbName']] : null,
            ];
        }
        Json::ok($out);
    }

    private static function mapRug(array $r): array
    {
        return [
            'id' => $r['id'],
            'qrCode' => $r['qrCode'],
            'orderId' => $r['orderId'],
            'widthCm' => $r['widthCm'] !== null ? (int) $r['widthCm'] : null,
            'heightCm' => $r['heightCm'] !== null ? (int) $r['heightCm'] : null,
            'areaM2' => $r['areaM2'] !== null ? (float) $r['areaM2'] : null,
            'packageId' => $r['packageId'],
            'pricePerM2' => $r['pricePerM2'] !== null ? (float) $r['pricePerM2'] : null,
            'totalPrice' => $r['totalPrice'] !== null ? (float) $r['totalPrice'] : null,
            'notes' => $r['notes'],
            'currentStatus' => $r['currentStatus'],
            'physicalLocation' => $r['physicalLocation'],
            'package' => isset($r['packageName']) && $r['packageName'] ? ['name' => $r['packageName']] : null,
        ];
    }

    private static function getOrder(array $u, string $id): void
    {
        $pdo = Db::get();
        $st = $pdo->prepare(
            'SELECT o.*, c.id AS cid, c.firstName AS cFirst, c.lastName AS cLast, c.phone AS cPhone, c.email AS cEmail,
                    b.name AS bName, b.type AS bType
             FROM orders o JOIN customers c ON c.id = o.customerId
             LEFT JOIN branches b ON b.id = o.acceptingBranchId
             WHERE o.id = ?'
        );
        $st->execute([$id]);
        $o = $st->fetch();
        if (!$o) { Json::error('Nie znaleziono.', 404); return; }
        $stRugs = $pdo->prepare(
            'SELECT r.*, p.name AS packageName, p.id AS pkgId FROM rugs r LEFT JOIN packages p ON p.id = r.packageId WHERE r.orderId = ?'
        );
        $stRugs->execute([$id]);
        $rugs = $stRugs->fetchAll();
        $stPhotos = $pdo->prepare('SELECT * FROM rug_photos WHERE rugId = ? ORDER BY takenAt');
        $stEvents = $pdo->prepare('SELECT * FROM rug_status_events WHERE rugId = ? ORDER BY changedAt DESC');
        $rugsOut = [];
        foreach ($rugs as $r) {
            $stPhotos->execute([$r['id']]);
            $photos = array_map(fn($p) => array_merge($p, ['url' => Config::uploadsUrl() . '/' . $p['storageKey']]), $stPhotos->fetchAll());
            $stEvents->execute([$r['id']]);
            $rugsOut[] = array_merge(self::mapRug($r), [
                'package' => $r['pkgId'] ? ['id' => $r['pkgId'], 'name' => $r['packageName']] : null,
                'photos' => $photos,
                'statusEvents' => $stEvents->fetchAll(),
            ]);
        }
        $stNotif = $pdo->prepare('SELECT * FROM notification_logs WHERE orderId = ? ORDER BY createdAt DESC');
        $stNotif->execute([$id]);
        Json::ok([
            'id' => $o['id'], 'number' => $o['number'], 'source' => $o['source'],
            'pickupAddress' => $o['pickupAddress'], 'deliveryAddress' => $o['deliveryAddress'],
            'totalAreaM2' => (float) $o['totalAreaM2'], 'totalGrossPrice' => (float) $o['totalGrossPrice'],
            'computedStatus' => $o['computedStatus'], 'createdAt' => $o['createdAt'],
            'customer' => ['id' => $o['cid'], 'firstName' => $o['cFirst'], 'lastName' => $o['cLast'], 'phone' => $o['cPhone'], 'email' => $o['cEmail']],
            'acceptingBranch' => ['id' => $o['acceptingBranchId'], 'name' => $o['bName'], 'type' => $o['bType']],
            'rugs' => $rugsOut,
            'notifications' => $stNotif->fetchAll(),
        ]);
    }

    private static function createOrder(array $u): void
    {
        $b = Json::body();
        $allowedSources = [
            'OWNER' => ['STATIONARY','CENTRAL_WAREHOUSE','LOGISTICS_PHONE','DRIVER_FIELD','PARTNER'],
            'STATIONARY_BRANCH_WORKER' => ['STATIONARY','CENTRAL_WAREHOUSE'],
            'LOGISTICS' => ['LOGISTICS_PHONE'],
            'DRIVER' => ['DRIVER_FIELD'],
            'PARTNER_BRANCH' => ['PARTNER'],
            'STATIONARY_BRANCH' => ['STATIONARY'],
        ];
        $source = $b['source'] ?? '';
        if (empty($allowedSources[$u['role']]) || !in_array($source, $allowedSources[$u['role']], true)) {
            Json::error('Twoja rola nie może utworzyć zlecenia tego typu.', 403); return;
        }
        $cust = $b['customer'] ?? [];
        foreach (['firstName', 'lastName', 'phone', 'email'] as $f) {
            if (empty($cust[$f])) { Json::error('Brak danych klienta: ' . $f, 400); return; }
        }
        $pdo = Db::get();
        // Klient (find-or-create)
        $st = $pdo->prepare('SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1');
        $st->execute([$cust['phone'], $cust['email']]);
        $cid = $st->fetchColumn();
        if (!$cid) {
            $cid = Db::cuid();
            $pdo->prepare('INSERT INTO customers (id, firstName, lastName, phone, email) VALUES (?, ?, ?, ?, ?)')
                ->execute([$cid, $cust['firstName'], $cust['lastName'], $cust['phone'], $cust['email']]);
        }
        // Placówka przyjmująca
        $branchId = $b['acceptingBranchId'] ?? $u['primaryBranchId'];
        if (!$branchId) {
            $row = $pdo->query("SELECT id FROM branches WHERE type='CENTRAL_WAREHOUSE' LIMIT 1")->fetch();
            if (!$row) { Json::error('Brak magazynu centralnego.', 500); return; }
            $branchId = $row['id'];
        }
        $partnerBranchId = $b['partnerBranchId'] ?? ($u['role'] === 'PARTNER_BRANCH' ? $u['primaryBranchId'] : null);
        $driverId = $b['driverId'] ?? ($u['role'] === 'DRIVER' ? $u['id'] : null);

        $id = Db::cuid();
        $number = OrderHelpers::generateOrderNumber();
        $pdo->prepare(
            'INSERT INTO orders (id, number, source, acceptingBranchId, acceptingUserId, customerId, pickupAddress, deliveryAddress, notesForDriver, internalNotes, declaredRugCount, partnerBranchId, driverId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $id, $number, $source, $branchId, $u['id'], $cid,
            isset($b['pickupAddress']) && $b['pickupAddress'] ? json_encode($b['pickupAddress'], JSON_UNESCAPED_UNICODE) : null,
            isset($b['deliveryAddress']) && $b['deliveryAddress'] ? json_encode($b['deliveryAddress'], JSON_UNESCAPED_UNICODE) : null,
            $b['notesForDriver'] ?? null,
            $b['internalNotes'] ?? null,
            isset($b['declaredRugCount']) ? (int) $b['declaredRugCount'] : null,
            $partnerBranchId, $driverId,
        ]);
        Json::ok(['id' => $id, 'number' => $number]);
    }

    private static function updateOrder(array $u, string $id): void
    {
        $b = Json::body();
        $sets = [];
        $vals = [];
        if (array_key_exists('pickupAddress', $b)) {
            $sets[] = 'pickupAddress = ?';
            $vals[] = $b['pickupAddress'] ? json_encode($b['pickupAddress'], JSON_UNESCAPED_UNICODE) : null;
        }
        if (array_key_exists('deliveryAddress', $b)) {
            $sets[] = 'deliveryAddress = ?';
            $vals[] = $b['deliveryAddress'] ? json_encode($b['deliveryAddress'], JSON_UNESCAPED_UNICODE) : null;
        }
        foreach (['notesForDriver', 'internalNotes', 'driverId'] as $f) {
            if (array_key_exists($f, $b)) { $sets[] = "$f = ?"; $vals[] = $b[$f]; }
        }
        if (!$sets) { Json::ok(['id' => $id]); return; }
        $vals[] = $id;
        Db::get()->prepare('UPDATE orders SET ' . implode(',', $sets) . ' WHERE id = ?')->execute($vals);
        Json::ok(['id' => $id]);
    }

    private static function addRug(array $u, string $orderId): void
    {
        $b = Json::body();
        if (empty($b['qrCode'])) { Json::error('Brak qrCode', 400); return; }
        $pdo = Db::get();
        $stO = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
        $stO->execute([$orderId]);
        $order = $stO->fetch();
        if (!$order) { Json::error('Brak zlecenia.', 404); return; }
        $stQ = $pdo->prepare('SELECT * FROM qr_codes WHERE code = ?');
        $stQ->execute([$b['qrCode']]);
        $qr = $stQ->fetch();
        if (!$qr) { Json::error('Ten kod QR nie istnieje w puli.', 400); return; }
        if ($qr['status'] === 'ASSIGNED') { Json::error('Ten kod QR jest już przypisany do innego dywanu.', 409); return; }

        $pricePerM2 = null;
        if (!empty($b['packageId'])) {
            $stP = $pdo->prepare('SELECT * FROM packages WHERE id = ?');
            $stP->execute([$b['packageId']]);
            $pkg = $stP->fetch();
            if (!$pkg) { Json::error('Nieznany pakiet.', 400); return; }
            $pricePerM2 = (float) $pkg['pricePerM2'];
            // Cennik partnerski
            if ($order['source'] === 'PARTNER' && !empty($order['partnerBranchId'])) {
                $stB = $pdo->prepare('SELECT partnerPriceListId FROM branches WHERE id = ?');
                $stB->execute([$order['partnerBranchId']]);
                $pliId = $stB->fetchColumn();
                if ($pliId) {
                    $stItem = $pdo->prepare('SELECT pricePerM2 FROM price_list_items WHERE priceListId = ? AND packageId = ?');
                    $stItem->execute([$pliId, $b['packageId']]);
                    $pp = $stItem->fetchColumn();
                    if ($pp !== false) $pricePerM2 = (float) $pp;
                }
            }
        }

        $areaM2 = null; $totalPrice = null;
        if (!empty($b['widthCm']) && !empty($b['heightCm'])) {
            $areaM2 = round(((int) $b['widthCm']) * ((int) $b['heightCm']) / 10000, 2);
            if ($pricePerM2 !== null) $totalPrice = round($areaM2 * $pricePerM2, 2);
        }

        $startStatus = match ($order['source']) {
            'STATIONARY', 'CENTRAL_WAREHOUSE' => 'ACCEPTED_AT_CENTRAL',
            'LOGISTICS_PHONE' => 'ORDER_PICKUP_ACCEPTED',
            'DRIVER_FIELD' => 'PICKED_UP_FROM_CUSTOMER',
            'PARTNER' => 'ACCEPTED_AT_PARTNER',
            default => 'ACCEPTED_AT_CENTRAL',
        };

        $rugId = Db::cuid();
        $pdo->prepare(
            'INSERT INTO rugs (id, orderId, qrCode, widthCm, heightCm, areaM2, packageId, pricePerM2, totalPrice, notes, currentStatus, physicalLocation, isFromPartner, isFromDriverPickup)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $rugId, $orderId, $b['qrCode'],
            isset($b['widthCm']) ? (int) $b['widthCm'] : null,
            isset($b['heightCm']) ? (int) $b['heightCm'] : null,
            $areaM2, $b['packageId'] ?? null, $pricePerM2, $totalPrice, $b['notes'] ?? null,
            $startStatus, Statuses::STATUS_TO_LOCATION[$startStatus] ?? null,
            $order['source'] === 'PARTNER' ? 1 : 0,
            in_array($order['source'], ['DRIVER_FIELD', 'LOGISTICS_PHONE'], true) ? 1 : 0,
        ]);

        $pdo->prepare("UPDATE qr_codes SET status='ASSIGNED', rugId = ? WHERE code = ?")->execute([$rugId, $b['qrCode']]);
        $pdo->prepare(
            'INSERT INTO rug_status_events (id, rugId, fromStatus, toStatus, changedByUserId, source, comment) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )->execute([Db::cuid(), $rugId, null, $startStatus, $u['id'], 'system', 'Utworzenie dywanu']);
        OrderHelpers::recomputeOrderTotals($orderId);
        Json::ok(['id' => $rugId]);
    }

    private static function finalizeOrder(array $u, string $orderId): void
    {
        $pdo = Db::get();
        $st = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
        $st->execute([$orderId]);
        $order = $st->fetch();
        if (!$order) { Json::error('Brak zlecenia.', 404); return; }
        $stN = $pdo->prepare("SELECT id FROM notification_logs WHERE orderId = ? AND trigger_event='ORDER_ACCEPTED' LIMIT 1");
        $stN->execute([$orderId]);
        if ($stN->fetch()) { Json::ok(['ok' => true, 'alreadyNotified' => true]); return; }
        if (!in_array($order['source'], ['STATIONARY', 'CENTRAL_WAREHOUSE'], true)) {
            Json::ok(['ok' => true, 'deferred' => true]);
            return;
        }
        $orderFull = OrderHelpers::loadOrderForVars($orderId);
        if (!$orderFull) { Json::error('Brak zlecenia.', 404); return; }
        $vars = OrderHelpers::orderVars($orderFull);
        $tplE = Notifications::template('templates.email.order_accepted');
        $tplS = Notifications::template('templates.sms.order_accepted');
        Notifications::sendEmail([
            'orderId' => $orderId,
            'to' => $orderFull['customer_email'],
            'subject' => Notifications::render($tplE['subject'] ?? '', $vars),
            'body' => Notifications::render($tplE['body'] ?? '', $vars),
            'trigger' => 'ORDER_ACCEPTED',
        ]);
        Notifications::sendSms([
            'orderId' => $orderId,
            'to' => $orderFull['customer_phone'],
            'body' => Notifications::render($tplS['body'] ?? '', $vars),
            'trigger' => 'ORDER_ACCEPTED',
        ]);
        Json::ok(['ok' => true]);
    }

    private static function assignDriver(array $u, string $id): void
    {
        if (!in_array($u['role'], ['OWNER', 'LOGISTICS'], true)) { Json::error('Brak uprawnień', 403); return; }
        $b = Json::body();
        if (empty($b['driverId'])) { Json::error('Brak driverId', 400); return; }
        Db::get()->prepare('UPDATE orders SET driverId = ? WHERE id = ?')->execute([$b['driverId'], $id]);
        Json::ok(['id' => $id]);
    }

    // -----------------------------------------------------------------
    // RUGS
    // -----------------------------------------------------------------
    private static function listRugs(array $u): void
    {
        $status = $_GET['status'] ?? null;
        $sql = 'SELECT r.*, p.name AS packageName, o.number AS orderNumber, c.firstName, c.lastName
                FROM rugs r
                LEFT JOIN packages p ON p.id = r.packageId
                JOIN orders o ON o.id = r.orderId
                JOIN customers c ON c.id = o.customerId';
        $params = [];
        if ($status) { $sql .= ' WHERE r.currentStatus = ?'; $params[] = $status; }
        $sql .= ' ORDER BY r.createdAt DESC LIMIT 500';
        $st = Db::get()->prepare($sql);
        $st->execute($params);
        $rows = $st->fetchAll();
        $out = [];
        foreach ($rows as $r) {
            $out[] = array_merge(self::mapRug($r), [
                'order' => ['number' => $r['orderNumber'], 'customer' => ['firstName' => $r['firstName'], 'lastName' => $r['lastName']]],
                'package' => $r['packageName'] ? ['name' => $r['packageName']] : null,
            ]);
        }
        Json::ok($out);
    }

    private static function rugByQr(array $u, string $code): void
    {
        $pdo = Db::get();
        $st = $pdo->prepare(
            'SELECT r.*, p.name AS packageName, p.id AS pkgId, o.number AS orderNumber, o.id AS oId,
                    c.firstName, c.lastName, c.phone, c.email
             FROM rugs r
             LEFT JOIN packages p ON p.id = r.packageId
             JOIN orders o ON o.id = r.orderId
             JOIN customers c ON c.id = o.customerId
             WHERE r.qrCode = ?'
        );
        $st->execute([$code]);
        $r = $st->fetch();
        if (!$r) { Json::error('Nie znaleziono dywanu po kodzie QR.', 404); return; }

        $stReq = $pdo->prepare('SELECT * FROM required_steps WHERE packageId = ? ORDER BY sortOrder');
        $requiredSteps = [];
        if ($r['pkgId']) { $stReq->execute([$r['pkgId']]); $requiredSteps = $stReq->fetchAll(); }

        $stRest = $pdo->prepare('SELECT id, qrCode, currentStatus, packageId FROM rugs WHERE orderId = ?');
        $stRest->execute([$r['oId']]);

        $stPhotos = $pdo->prepare('SELECT * FROM rug_photos WHERE rugId = ?');
        $stPhotos->execute([$r['id']]);
        $photos = array_map(fn($p) => array_merge($p, ['url' => Config::uploadsUrl() . '/' . $p['storageKey']]), $stPhotos->fetchAll());

        $stEv = $pdo->prepare('SELECT * FROM rug_status_events WHERE rugId = ? ORDER BY changedAt DESC LIMIT 30');
        $stEv->execute([$r['id']]);

        Json::ok(array_merge(self::mapRug($r), [
            'order' => [
                'id' => $r['oId'], 'number' => $r['orderNumber'],
                'customer' => ['firstName' => $r['firstName'], 'lastName' => $r['lastName'], 'phone' => $r['phone'], 'email' => $r['email']],
                'rugs' => $stRest->fetchAll(),
            ],
            'orderId' => $r['oId'],
            'package' => $r['pkgId'] ? ['id' => $r['pkgId'], 'name' => $r['packageName'], 'requiredSteps' => $requiredSteps] : null,
            'photos' => $photos,
            'statusEvents' => $stEv->fetchAll(),
        ]));
    }

    private static function updateRug(array $u, string $id): void
    {
        $b = Json::body();
        $pdo = Db::get();
        $st = $pdo->prepare('SELECT r.*, o.source AS oSource, o.partnerBranchId AS oPartnerBranchId FROM rugs r JOIN orders o ON o.id = r.orderId WHERE r.id = ?');
        $st->execute([$id]);
        $rug = $st->fetch();
        if (!$rug) { Json::error('Brak dywanu.', 404); return; }

        $widthCm = $b['widthCm'] ?? $rug['widthCm'] ?? null;
        $heightCm = $b['heightCm'] ?? $rug['heightCm'] ?? null;
        $packageId = $b['packageId'] ?? $rug['packageId'] ?? null;
        $pricePerM2 = $rug['pricePerM2'] !== null ? (float) $rug['pricePerM2'] : null;
        if ($packageId) {
            $stP = $pdo->prepare('SELECT * FROM packages WHERE id = ?');
            $stP->execute([$packageId]);
            $pkg = $stP->fetch();
            if ($pkg) {
                $pricePerM2 = (float) $pkg['pricePerM2'];
                if ($rug['oSource'] === 'PARTNER' && !empty($rug['oPartnerBranchId'])) {
                    $stB = $pdo->prepare('SELECT partnerPriceListId FROM branches WHERE id = ?');
                    $stB->execute([$rug['oPartnerBranchId']]);
                    $plId = $stB->fetchColumn();
                    if ($plId) {
                        $stIt = $pdo->prepare('SELECT pricePerM2 FROM price_list_items WHERE priceListId = ? AND packageId = ?');
                        $stIt->execute([$plId, $packageId]);
                        $pp = $stIt->fetchColumn();
                        if ($pp !== false) $pricePerM2 = (float) $pp;
                    }
                }
            }
        }
        $areaM2 = null; $totalPrice = null;
        if ($widthCm && $heightCm) {
            $areaM2 = round(((int) $widthCm) * ((int) $heightCm) / 10000, 2);
            if ($pricePerM2 !== null) $totalPrice = round($areaM2 * $pricePerM2, 2);
        }
        $pdo->prepare('UPDATE rugs SET widthCm=?, heightCm=?, packageId=?, pricePerM2=?, areaM2=?, totalPrice=?, notes=? WHERE id=?')
            ->execute([
                $widthCm, $heightCm, $packageId, $pricePerM2, $areaM2, $totalPrice,
                $b['notes'] ?? $rug['notes'], $id,
            ]);
        OrderHelpers::recomputeOrderTotals($rug['orderId']);
        Json::ok(['id' => $id]);
    }

    private static function rugStatus(array $u, string $id): void
    {
        $b = Json::body();
        if (empty($b['toStatus'])) { Json::error('Brak toStatus', 400); return; }
        [$rug, $err] = OrderHelpers::changeRugStatus($id, $b['toStatus'], $u['id'], $u['role'], 'manual', $b['comment'] ?? null);
        if ($err) { Json::error($err, 400); return; }
        Json::ok(['id' => $rug['id']]);
    }

    // -----------------------------------------------------------------
    // SCAN
    // -----------------------------------------------------------------
    private static function scanBulk(array $u): void
    {
        $b = Json::body();
        $toStatus = $b['toStatus'] ?? '';
        $codes = $b['qrCodes'] ?? [];
        if (!$toStatus || !is_array($codes) || !$codes) { Json::error('Niepoprawne dane', 400); return; }
        $results = [];
        $stRug = Db::get()->prepare('SELECT id FROM rugs WHERE qrCode = ?');
        foreach ($codes as $c) {
            try {
                $stRug->execute([$c]);
                $rugId = $stRug->fetchColumn();
                if (!$rugId) { $results[] = ['qrCode' => $c, 'ok' => false, 'error' => 'Nie znaleziono dywanu w bazie.']; continue; }
                [$rug, $err] = OrderHelpers::changeRugStatus($rugId, $toStatus, $u['id'], $u['role'], 'serial_scan');
                if ($err) $results[] = ['qrCode' => $c, 'ok' => false, 'error' => $err];
                else $results[] = ['qrCode' => $c, 'ok' => true, 'rugId' => $rug['id']];
            } catch (Throwable $e) {
                $results[] = ['qrCode' => $c, 'ok' => false, 'error' => $e->getMessage()];
            }
        }
        Json::ok(['results' => $results]);
    }

    private static function nextAvailableCode(): void
    {
        $st = Db::get()->prepare("SELECT code FROM qr_codes WHERE status='AVAILABLE' ORDER BY createdAt ASC LIMIT 1");
        $st->execute();
        $code = $st->fetchColumn();
        if (!$code) { Json::error('Brak wolnych kodów w puli.', 404); return; }
        Json::ok(['code' => $code]);
    }

    // -----------------------------------------------------------------
    // QR POOL
    // -----------------------------------------------------------------
    private static function qrPoolStatus(): void
    {
        $pdo = Db::get();
        $total = (int) $pdo->query('SELECT COUNT(*) FROM qr_codes')->fetchColumn();
        $available = (int) $pdo->query("SELECT COUNT(*) FROM qr_codes WHERE status='AVAILABLE'")->fetchColumn();
        $assigned = (int) $pdo->query("SELECT COUNT(*) FROM qr_codes WHERE status='ASSIGNED'")->fetchColumn();
        $archived = (int) $pdo->query("SELECT COUNT(*) FROM qr_codes WHERE status='ARCHIVED'")->fetchColumn();
        $sample = $pdo->query("SELECT * FROM qr_codes WHERE status='AVAILABLE' ORDER BY createdAt ASC LIMIT 30")->fetchAll();
        Json::ok(compact('total', 'available', 'assigned', 'archived', 'sample'));
    }

    private static function qrPoolGenerate(array $u): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $b = Json::body();
        $count = (int) ($b['count'] ?? 0);
        if ($count <= 0 || $count > 50000) { Json::error('count: 1..50000', 400); return; }
        $prefix = 'RUG-' . substr((string) base_convert((string) (int) (microtime(true) * 1000), 10, 36), 0, 8);
        $st = Db::get()->prepare('INSERT INTO qr_codes (code) VALUES (?)');
        $generated = 0;
        for ($i = 1; $i <= $count; $i++) {
            $code = $prefix . '-' . str_pad((string) $i, 5, '0', STR_PAD_LEFT);
            try { $st->execute([$code]); $generated++; }
            catch (Throwable $e) { /* ignore duplicates */ }
        }
        Json::ok(['generated' => $generated]);
    }

    // -----------------------------------------------------------------
    // PHOTOS
    // -----------------------------------------------------------------
    private static function uploadPhoto(array $u, string $rugId): void
    {
        if (empty($_FILES['photo'])) { Json::error('Brak pliku.', 400); return; }
        $file = $_FILES['photo'];
        if ($file['error'] !== UPLOAD_ERR_OK) { Json::error('Błąd uploadu: ' . $file['error'], 400); return; }
        $stRug = Db::get()->prepare('SELECT id FROM rugs WHERE id = ?');
        $stRug->execute([$rugId]);
        if (!$stRug->fetchColumn()) { Json::error('Brak dywanu.', 404); return; }
        $dir = Config::uploadsDir();
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
        $key = sprintf('%d-%s.%s', time(), bin2hex(random_bytes(4)), strtolower($ext));
        if (!move_uploaded_file($file['tmp_name'], $dir . DIRECTORY_SEPARATOR . $key)) {
            Json::error('Nie udało się zapisać pliku.', 500); return;
        }
        $id = Db::cuid();
        Db::get()->prepare('INSERT INTO rug_photos (id, rugId, storageKey, uploadedByUserId) VALUES (?, ?, ?, ?)')
            ->execute([$id, $rugId, $key, $u['id']]);
        Json::ok(['id' => $id, 'url' => Config::uploadsUrl() . '/' . $key]);
    }

    // -----------------------------------------------------------------
    // SETTINGS
    // -----------------------------------------------------------------
    private static function listSettings(array $u): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $rows = Db::get()->query('SELECT * FROM system_settings')->fetchAll();
        $out = [];
        foreach ($rows as $r) {
            $out[$r['setting_key']] = json_decode($r['value'], true);
        }
        Json::ok($out);
    }

    private static function saveSetting(array $u): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $b = Json::body();
        if (empty($b['key'])) { Json::error('Brak key', 400); return; }
        self::saveSettingByKey($b['key'], $b['value']);
        Json::ok(['ok' => true]);
    }

    // -----------------------------------------------------------------
    // SETTLEMENTS
    // -----------------------------------------------------------------
    private static function mySettlements(array $u): void
    {
        if ($u['role'] !== 'DRIVER') { Json::error('Tylko dla kierowcy.', 403); return; }
        $pdo = Db::get();
        $st = $pdo->prepare('SELECT * FROM driver_daily_settlements WHERE driverUserId = ? ORDER BY day DESC LIMIT 30');
        $st->execute([$u['id']]);
        $list = $st->fetchAll();
        $stIt = $pdo->prepare(
            'SELECT i.*, o.number AS orderNumber, r.qrCode AS rugQr
             FROM driver_settlement_items i
             JOIN orders o ON o.id = i.orderId
             JOIN rugs r ON r.id = i.rugId
             WHERE i.settlementId = ?'
        );
        foreach ($list as &$s) {
            $stIt->execute([$s['id']]);
            $s['totalCashCollected'] = (float) $s['totalCashCollected'];
            $s['items'] = array_map(function ($i) {
                return [
                    'id' => $i['id'],
                    'amountCollected' => (float) $i['amountCollected'],
                    'order' => ['number' => $i['orderNumber']],
                    'rug' => ['qrCode' => $i['rugQr']],
                ];
            }, $stIt->fetchAll());
        }
        Json::ok($list);
    }

    private static function listSettlements(array $u): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $driverId = $_GET['driverId'] ?? null;
        $sql = 'SELECT s.*, u.firstName, u.lastName FROM driver_daily_settlements s LEFT JOIN users u ON u.id = s.driverUserId';
        $params = [];
        if ($driverId) { $sql .= ' WHERE s.driverUserId = ?'; $params[] = $driverId; }
        $sql .= ' ORDER BY s.day DESC LIMIT 60';
        $st = Db::get()->prepare($sql);
        $st->execute($params);
        $rows = $st->fetchAll();
        $stIt = Db::get()->prepare(
            'SELECT i.*, o.number AS orderNumber, r.qrCode AS rugQr
             FROM driver_settlement_items i
             JOIN orders o ON o.id = i.orderId
             JOIN rugs r ON r.id = i.rugId
             WHERE i.settlementId = ?'
        );
        foreach ($rows as &$r) {
            $stIt->execute([$r['id']]);
            $r['totalCashCollected'] = (float) $r['totalCashCollected'];
            $r['driver'] = ['id' => $r['driverUserId'], 'firstName' => $r['firstName'], 'lastName' => $r['lastName']];
            $r['items'] = array_map(function ($i) {
                return ['id' => $i['id'], 'amountCollected' => (float) $i['amountCollected'], 'order' => ['number' => $i['orderNumber']], 'rug' => ['qrCode' => $i['rugQr']]];
            }, $stIt->fetchAll());
        }
        Json::ok($rows);
    }

    private static function settleSettlement(array $u, string $id): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $b = Json::body();
        Db::get()->prepare('UPDATE driver_daily_settlements SET status=?, settledAt=NOW(), settledByUserId=?, notes=? WHERE id=?')
            ->execute(['SETTLED', $u['id'], $b['notes'] ?? null, $id]);
        Json::ok(['id' => $id]);
    }

    // -----------------------------------------------------------------
    // STATISTICS
    // -----------------------------------------------------------------
    private static function statsDashboard(array $u): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $pdo = Db::get();
        $today = date('Y-m-d 00:00:00');
        $weekStart = date('Y-m-d 00:00:00', strtotime('monday this week'));
        $monthStart = date('Y-m-01 00:00:00');

        $rangeStats = function (string $from) use ($pdo) {
            $st = $pdo->prepare('SELECT id FROM orders WHERE createdAt >= ?');
            $st->execute([$from]);
            $ids = array_column($st->fetchAll(), 'id');
            $orders = count($ids);
            $rugs = 0; $area = 0; $value = 0;
            if ($orders) {
                $in = implode(',', array_fill(0, count($ids), '?'));
                $stR = $pdo->prepare("SELECT COUNT(*) c, COALESCE(SUM(areaM2),0) a FROM rugs WHERE orderId IN ($in)");
                $stR->execute($ids);
                $row = $stR->fetch();
                $rugs = (int) $row['c']; $area = (float) $row['a'];
                $stO = $pdo->prepare("SELECT COALESCE(SUM(totalGrossPrice),0) v FROM orders WHERE id IN ($in)");
                $stO->execute($ids); $value = (float) $stO->fetchColumn();
            }
            return ['orders' => $orders, 'rugs' => $rugs, 'area' => round($area, 2), 'value' => round($value, 2)];
        };

        $byStatus = $pdo->query('SELECT currentStatus, COUNT(*) AS c FROM rugs GROUP BY currentStatus')->fetchAll();
        $byStatus = array_map(fn($r) => ['currentStatus' => $r['currentStatus'], '_count' => ['_all' => (int) $r['c']]], $byStatus);
        $find = function ($status) use ($byStatus) {
            foreach ($byStatus as $b) if ($b['currentStatus'] === $status) return $b['_count']['_all'];
            return 0;
        };

        Json::ok([
            'today' => $rangeStats($today),
            'week' => $rangeStats($weekStart),
            'month' => $rangeStats($monthStart),
            'byStatus' => $byStatus,
            'readyForPickup' => $find('READY_FOR_PICKUP'),
            'readyForDelivery' => $find('READY_FOR_DELIVERY'),
            'inDelivery' => $find('IN_DELIVERY'),
        ]);
    }

    private static function statsDriversToday(array $u): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $day = date('Y-m-d');
        $pdo = Db::get();
        $drivers = $pdo->query("SELECT * FROM users WHERE role='DRIVER' AND isActive=1")->fetchAll();
        $stS = $pdo->prepare('SELECT * FROM driver_daily_settlements WHERE driverUserId = ? AND day = ?');
        $stI = $pdo->prepare('SELECT COUNT(*) FROM driver_settlement_items WHERE settlementId = ?');
        $out = [];
        foreach ($drivers as $d) {
            $stS->execute([$d['id'], $day]);
            $s = $stS->fetch();
            $rugCount = 0;
            if ($s) { $stI->execute([$s['id']]); $rugCount = (int) $stI->fetchColumn(); }
            $out[] = [
                'id' => $d['id'], 'firstName' => $d['firstName'], 'lastName' => $d['lastName'],
                'rugsDelivered' => $rugCount,
                'cash' => $s ? (float) $s['totalCashCollected'] : 0,
                'settlementId' => $s['id'] ?? null,
                'status' => $s['status'] ?? 'PENDING',
            ];
        }
        Json::ok($out);
    }

    private static function statsPartnersMonth(array $u): void
    {
        if ($u['role'] !== 'OWNER') { Json::error('Brak uprawnień', 403); return; }
        $monthStart = date('Y-m-01 00:00:00');
        $pdo = Db::get();
        $partners = $pdo->query("SELECT * FROM branches WHERE type='PARTNER'")->fetchAll();
        $stO = $pdo->prepare('SELECT id, totalAreaM2, totalGrossPrice FROM orders WHERE partnerBranchId = ? AND createdAt >= ?');
        $stR = $pdo->prepare('SELECT COUNT(*) FROM rugs WHERE orderId = ?');
        $out = [];
        foreach ($partners as $p) {
            $stO->execute([$p['id'], $monthStart]);
            $orders = $stO->fetchAll();
            $rugs = 0; $area = 0; $value = 0;
            foreach ($orders as $o) {
                $stR->execute([$o['id']]);
                $rugs += (int) $stR->fetchColumn();
                $area += (float) $o['totalAreaM2'];
                $value += (float) $o['totalGrossPrice'];
            }
            $out[] = ['id' => $p['id'], 'name' => $p['name'], 'orders' => count($orders), 'rugs' => $rugs, 'area' => round($area, 2), 'value' => round($value, 2)];
        }
        Json::ok($out);
    }
}
