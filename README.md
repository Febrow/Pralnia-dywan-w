# Pralnia Dywanów — System zarządzania (PWA)

Repozytorium zawiera specyfikację i architekturę aplikacji webowej (PWA) do
zarządzania pralnią dywanów: od przyjęcia zlecenia, przez logistykę,
proces prania, aż po wydanie i rozliczenie gotówki.

Aplikacja jest pojedynczym systemem wielodostępowym (multi-role), w którym
wszyscy użytkownicy pracują na **wspólnej bazie danych**, a zakres działań i
widocznych informacji zależy od ich roli.

## Mapa dokumentacji

Dokumentacja jest podzielona tematycznie tak, aby każdy obszar dało się
edytować niezależnie:

| Plik | Zakres |
| --- | --- |
| [`docs/01-specyfikacja-funkcjonalna.md`](docs/01-specyfikacja-funkcjonalna.md) | Pełna specyfikacja funkcjonalna systemu. |
| [`docs/02-architektura-techniczna.md`](docs/02-architektura-techniczna.md) | Stack, PWA, hosting, bezpieczeństwo, integracje SMTP/SMS/centrala. |
| [`docs/03-model-danych.md`](docs/03-model-danych.md) | Model bazy danych — encje, relacje, klucze. |
| [`docs/04-role-i-uprawnienia.md`](docs/04-role-i-uprawnienia.md) | Role użytkowników i macierz uprawnień. |
| [`docs/05-statusy-i-przeplywy.md`](docs/05-statusy-i-przeplywy.md) | Statusy dywanu/zlecenia i ścieżki procesu według źródła zlecenia. |
| [`docs/06-struktura-projektu.md`](docs/06-struktura-projektu.md) | Proponowana struktura plików, osobne layouty per panel, organizacja PWA. |
| [`docs/07-plan-etapow.md`](docs/07-plan-etapow.md) | Plan wdrożenia w 5 etapach wraz z wycenami. |

## Najważniejsze założenia w skrócie

- Aplikacja webowa działająca w przeglądarce, w technologii **PWA** (Progressive Web App).
- **Jedna firma**, wiele oddziałów stacjonarnych + placówki partnerskie.
- **Tylko jeden magazyn centralny** (placówka, w której fizycznie odbywa się pranie). Pozostałe placówki stacjonarne tylko przyjmują i wydają dywany.
- W systemie wyraźnie rozdzielone są pojęcia **Zlecenie** i **Dywan**. Jedno zlecenie może mieć wiele dywanów. **Status jest przypisany do dywanu**, status zlecenia jest wyliczany.
- **Kod QR** identyfikuje pojedynczy dywan. Pula kodów jest przygotowana wcześniej na naklejkach.
- Skanowanie kodów QR jest dostępne w trybie **pojedynczym** i **seryjnym** (zbiorcza zmiana statusu).
- Powiadomienia (SMS + e-mail) są wysyłane tylko w trzech punktach procesu: przyjęcie zlecenia, gotowość do odbioru, dzień doręczenia przez kierowcę.
- Język interfejsu: **polski**. Waluta: **PLN**, raporty wartościowe są **brutto**.
- Każdy panel ma **osobny plik layoutu** (desktop i mobile), żeby dało się modyfikować wygląd niezależnie.
- Panel kierowcy istnieje **wyłącznie w wersji mobilnej**.
- Lista zleceń jest **stylowana wspólnym CSS**, niezależnie od roli użytkownika.

## Stan repozytorium

W tej chwili w repozytorium znajduje się tylko dokumentacja projektowa.
Implementacja zostanie rozpoczęta zgodnie z [planem etapów](docs/07-plan-etapow.md)
po akceptacji specyfikacji.
