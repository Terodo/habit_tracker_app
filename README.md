# Kadenz — täglicher Almanach

Habit Tracker als **PWA**, gebaut ausschließlich für Smartphones. Abends eintragen,
rückwirkend nachtragen, am Monatsende auswerten. Läuft offline, alle Daten bleiben
lokal auf dem Gerät (localStorage) — kein Konto, kein Server, kein Tracking.

## Warum PWA statt native iOS-App

- Läuft auf iPhone **und** Android, ohne App Store und ohne 99 €/Jahr Developer-Account.
- „Zum Home-Bildschirm hinzufügen" → Vollbild, eigenes Icon, offline nutzbar.
- Ein Code-Stand für alles. Falls später native Features nötig sind (echte Push-Erinnerung,
  HealthKit, Widgets), lässt sich dasselbe Frontend mit **Capacitor** als native App verpacken.

## Starten

```bash
npm install
npm run icons     # PNG-Icons erzeugen (einmalig, keine Extra-Dependencies)
npm run dev       # Dev-Server, im LAN erreichbar
```

Der Dev-Server gibt eine `Network:`-Adresse aus (z.B. `http://192.168.x.x:5173`).
Diese am iPhone im Safari öffnen — Handy und Rechner müssen im selben WLAN sein.

Produktion:

```bash
npm run build     # -> dist/
npm run preview
```

`dist/` ist statisch. Für die Installation als App auf dem iPhone ist **HTTPS** Pflicht
(Service Worker registriert sich sonst nicht) — über die LAN-IP des Dev-Servers geht das nicht.

## Deploy auf Netlify

### Variante 1 — Drag & Drop (schnellste, kein Konto-Setup nötig)

1. `npm run build`
2. <https://app.netlify.com/drop> öffnen
3. den Ordner `dist/` ins Browserfenster ziehen
4. fertig — Netlify gibt eine HTTPS-URL wie `https://zufallsname.netlify.app` aus

Bei jedem Update: neu bauen, `dist/` erneut droppen (im Netlify-Dashboard unter *Deploys*).

### Variante 2 — an Git koppeln (deployt bei jedem Push automatisch)

Repo zu GitHub pushen, in Netlify *Add new site → Import an existing project* wählen.
Build-Befehl und Publish-Ordner stehen bereits in [`netlify.toml`](netlify.toml) —
nichts weiter einzustellen.

### Variante 3 — GitHub Actions, manuell ausgelöst

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) baut und deployt auf Knopfdruck.
Kein Deploy bei jedem Push — der Workflow läuft ausschließlich über `workflow_dispatch`.

**Einmalige Einrichtung — zwei Secrets:**

| Secret                | Woher                                                                      |
| --------------------- | -------------------------------------------------------------------------- |
| `NETLIFY_AUTH_TOKEN`  | Netlify → *User settings* → *Applications* → *Personal access tokens* → *New access token* |
| `NETLIFY_SITE_ID`     | Netlify → Site öffnen → *Site configuration* → *Site details* → *Site ID*   |

Beide eintragen unter *Repo → Settings → Secrets and variables → Actions → New repository secret*.
Fehlt eins, bricht der Workflow gleich im ersten Schritt mit klarer Meldung ab, statt erst
nach dem Build.

**Auslösen:** *Actions* → *Deploy zu Netlify* → *Run workflow*. Zwei Eingaben:

- **target** — `preview` erzeugt eine eigene Test-URL und lässt die Live-Adresse unberührt,
  `production` schaltet den Stand live.
- **message** — freie Notiz, taucht in der Netlify-Deploy-Historie auf.

Die fertige URL steht danach in der Job-Summary des Laufs.

Ablauf: Checkout → Secrets prüfen → Node 22 mit npm-Cache → `npm ci` → `npm run icons` →
`npm run build` → `netlify deploy`. Die Regeln aus `netlify.toml` (SPA-Fallback, Cache-Header)
greifen dabei ebenfalls, weil die CLI die Datei aus dem Repo-Wurzelverzeichnis liest.

## Installation auf dem Gerät

### iPhone (iOS)

Netlify-URL in **Safari** öffnen (nicht Chrome — nur Safari kann auf iOS installieren) →
Teilen-Symbol → „Zum Home-Bildschirm". Danach: eigenes Icon, Vollbild ohne Browserleiste,
eigener Speicher, offline nutzbar. Die App blendet den Hinweis beim ersten Besuch selbst ein.

**Grenzen unter iOS:** keine zuverlässigen Push-Erinnerungen, keine Widgets, kein HealthKit.
Dafür braucht es den Capacitor-Weg (macOS/Cloud-Mac zum Signieren, Apple Developer Program
99 €/Jahr).

### Android

Deutlich komfortabler als iOS. Chrome erkennt die PWA und installiert sie als **WebAPK** —
ein echtes Android-Paket, erzeugt von Googles Build-Dienst:

1. Netlify-URL in **Chrome** öffnen
2. auf den Knopf „Jetzt installieren" im Banner tippen (die App fängt `beforeinstallprompt`
   selbst ab), alternativ Chrome-Menü → *App installieren*
3. Kadenz liegt danach im App-Drawer und in *Einstellungen → Apps* wie jede andere App

Vorteile gegenüber iOS: eigener Splash-Screen, keine Browserleiste, **App-Shortcuts** beim
langen Druck aufs Icon (Tag / Monat / Bilanz), und Web Push funktioniert hier tatsächlich —
die Abend-Erinnerung wäre auf Android ohne nativen Wrapper machbar.

Firefox Android kann nur „Zur Startseite hinzufügen" (Lesezeichen-Verhalten, kein WebAPK) —
für die echte Installation Chrome oder Edge nehmen.

#### Wenn eine echte APK-Datei nötig ist

Nur relevant für Play-Store-Veröffentlichung oder Sideload-Verteilung:

- **PWABuilder** (<https://pwabuilder.com>) — URL eingeben, signiertes APK/AAB herunterladen.
  Läuft komplett im Browser, kein Android SDK auf dem Rechner nötig. Einfachster Weg.
- **Bubblewrap** (`npm i -g @bubblewrap/cli`) — baut eine Trusted Web Activity lokal.
  Braucht JDK + Android SDK, läuft aber problemlos unter Windows.

Beide Wege verpacken dieselbe URL. Damit die Adressleiste in der APK verschwindet, muss
`.well-known/assetlinks.json` mit dem Signatur-Fingerprint auf der Domain liegen — PWABuilder
generiert die Datei mit.

### Datenübertragung zwischen Geräten

Der lokale Speicher gehört jeweils zu einem Gerät und Browser. iPhone und Android teilen
nichts. Bis eine Sync-Lösung steht: Ritual-Tab → Export auf Gerät A, Import auf Gerät B.

## Bedienung

| Tab       | Zweck                                                                     |
| --------- | ------------------------------------------------------------------------- |
| **Tag**   | Tageseintrag. Mit `‹` / `›` beliebig weit zurückblättern und nachtragen.   |
| **Monat** | Kalender-Heatmap. Tag antippen → springt direkt in den Tageseintrag.       |
| **Bilanz**| Monatsauswertung: Quote, Serien, Wochentagsmuster, Notizen, Vormonatsdelta.|
| **Ritual**| Habits anlegen/ändern/archivieren, Export & Import.                        |

## Ritual-Typen

- **Abhaken** — erledigt / nicht erledigt.
- **Menge** — Zählwert gegen ein Ziel, mit Einheit und Schrittweite (20 Min lesen, 6 Gläser Wasser).
- **Skala 1–5** — Bewertung, gilt ab einem einstellbaren Wert als erfüllt (z.B. Fokus, Schlaf).

Dazu je Tag: Stimmung (1–5) und Freitext-Notiz.

## Aufbau

```text
src/
  types.ts            Datenmodell (Habit, DayEntry, AppData)
  date.ts             ISO-Datums-Helfer, deutsche Formate, Montag-first Raster
  store.ts            localStorage-Store via useSyncExternalStore + alle Actions
  stats.ts            Serien, Tagesquote, Monatsreport
  App.tsx             Shell, Tabs, geteilter Datums-/Monatszustand
  components/Ring.tsx SVG-Fortschrittsring
  views/              DayView, MonthView, StatsView, HabitsView
  styles.css          komplettes Design-System (CSS-Variablen)
scripts/gen-icons.mjs PNG-Icon-Generator ohne Dependencies
```

**Archivieren statt Löschen:** Ein archiviertes Ritual zählt ab dem Archivdatum nicht mehr
zur Tagesquote — vergangene Monate behalten dadurch ihre korrekten Werte. Löschen entfernt
dagegen auch alle historischen Einträge.

## Datensicherung

Ritual-Tab → Export lädt eine JSON-Datei. localStorage kann von iOS bei Platzmangel oder beim
Löschen der Website-Daten verworfen werden — regelmäßig exportieren, bis eine Sync-Lösung steht.

## Nächste Schritte (Ideen)

1. **Erinnerung am Abend** — Web Push funktioniert auf iOS nur bei installierter PWA und ist
   unzuverlässig. Robuster: nativer Wrapper (Capacitor) mit lokaler Notification um 21:00.
2. **Sync / Backup in die Cloud** — z.B. Supabase, damit ein Gerätewechsel nichts kostet.
3. **Jahresansicht** — 365 Zellen pro Ritual, GitHub-Contributions-Stil.
4. **Wochenziele** — „3× pro Woche" statt täglich, inklusive angepasster Serienlogik.
5. **Korrelationen** — Stimmung gegen Ritual-Erfüllung, „an Sporttagen ⌀ +0,8 Stimmung".
6. **Monatsrückblick als Bild** — teilbare Zusammenfassungs-Karte am Monatsende.
7. **Schnell-Eintrag** — ein „alles wie geplant"-Knopf, der den Standardtag in einem Tipp füllt.
