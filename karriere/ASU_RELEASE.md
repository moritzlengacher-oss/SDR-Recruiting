# L&P Karriere — aktueller ASU-Freigabevertrag

Stand: 27.10.2026. Massgeblich sind `quality-contract.json`, der universelle [ASU-Standard](../docs/quality/ASU-STANDARD.md) und die tatsächlichen Einstellungen der Provider. Der frühere Text „Feature-Branch, kein Livegang“ und die Zuordnung zum Projekt `sdr-recruiting` waren veraltet; sie gelten nicht.

## Identität und Referenz

| Ebene | Verbindliches Ziel |
| --- | --- |
| Quelle | `moritzlengacher-oss/SDR-Recruiting`, Projekt-Root `karriere` |
| Karriereprojekt | `lp-karriere` / `prj_aai674bWi0ZXbmKh2ocCCRuSSv5o` |
| Öffentliche Domain | https://jobs.lengacher-partner.ch/karriere |
| Ursprung hinter bestehendem Proxy | https://jobs-app.lengacher-partner.ch |
| Bestehender Proxy | Hauptprojekt `ic`; nicht in diesem Repository verändern |
| Originalmarke | https://www.lengacher-partner.ch/ |
| Geprüfter Branding-Bestand | Code-Stand `9b1e2da60ebdafdca9ddcf3a57f6ab90b1f1f858`, Prüfbericht R04 unter `qa/` |

Ein grüner Status des separaten Projekts `sdr-recruiting` ist keine Freigabe der Karriereplattform.

## Ein gemeinsamer ausführbarer Gate

Im Verzeichnis `karriere/`:

```sh
npm ci --include=dev --ignore-scripts --no-audit --no-fund
npm test
```

`npm test`, `npm run build`, GitHub Actions und der Vercel-Build verwenden `node verify.mjs`. Der Gate baut die 22 Seiten, prüft alle statischen Suiten und den unveränderten API-Vertrag, startet einen echten Browser und speichert `qa-output/release-evidence.json` sowie Browserbericht und Screenshots. Fehler, übersprungene Tests, ein anderes Vercel-Projekt oder ein abweichender Code-Stand blockieren diesen Build. `node build.mjs` allein ist lediglich der Generator und keine Freigabe.

Erforderlicher stabiler GitHub-Checkname: **ASU / lp-karriere / quality-gate**. Keine Pfadfilter; sonst könnten Änderungen an Prüfungen oder Regeln unbemerkt bleiben oder ein Pflichtcheck ausbleiben.

## Zwei Vorprüfungen und zwei Nachprüfungen

V1 erfasst Originalreferenz und Bestand; V2 prüft Auswirkungen, Erhalt, Ziel und Abnahmekriterien vor Umsetzung. N1 prüft den fertigen Kandidaten einschliesslich unabhängiger Prüfung und Browserdarstellung vor Veröffentlichung. N2 kontrolliert nach Auslieferung die öffentliche Domain, tatsächlich ausgelieferte Artefakte und wesentliche Abläufe. N2 wird vorher geplant und ist bis zur Auslieferung UNVERIFIED. Erst danach ist eine abschliessende Abnahme möglich.

Jeder Nachweis enthält Revision, Ziel, Quelle, Zeitpunkt, tatsächlichen Prüfer und Ergebnis getrennt vom Testmodus. Änderungen invalidieren betroffene Nachweise. Ein automatischer Browserlauf ersetzt die fachliche Sichtprüfung und unabhängige Review nicht.

## Integration und Nachweisgrenzen

Die Erstumstellung verlangte eine echte kontrollierte Bewerbung mit CRM-/E-Mail-Quittung. PR1 behauptet diese Durchführung; diese historische Aussage ist ohne erneute Einsicht in die konkreten Quittungen kein frischer Nachweis. R04 hat den unveränderten Relay isoliert geprüft und echte Sendungen nicht wiederholt. Diese Einschränkung bleibt sichtbar.

Der aktuelle Auftrag fügt Qualitätsregeln hinzu und korrigiert einen dabei nachgewiesenen Clientfehler: Nach bestätigtem Erfolg wird die Übermittlungs-ID geleert, damit eine neue Bewerbung eine neue ID erhält; Wiederholungen nach Fehlern behalten ihre ID. Relay, Ziel, Validierung und Empfänger bleiben unverändert. Der Vertrag dokumentiert Ausgangsstand und diese begrenzte Korrektur. Browser-POSTs werden vor jeder Navigation abgefangen; `MOCKED` bestätigt ausschließlich Clientverhalten und Fehlerbehandlung. Live-Zustellung von Bewerbung, E-Mail und Kalender bleibt in diesem Auftrag **UNVERIFIED**.

Bei einer Änderung an API, Routing, Validierung, Datenspeicher, Empfänger oder Zustellung reichen diese Nachweise nicht. Der bestehende Integrationshash blockiert unbemerkte Änderungen. Eine bewusste Änderung erfordert einen angepassten Vertrag, unabhängige Prüfung und passende echte Integrationsbelege. Ohne ausdrückliche Versandautorisierung den Versandteil BLOCKED nennen; übrige sichere Arbeiten fortsetzen.

## Technische Durchsetzung

Der Build-Gate ist ein technischer Schutz innerhalb des konfigurierten Buildwegs. Er ist nicht gegen einen Akteur geschützt, der denselben Code, die Tests oder Provider-Einstellungen ändern darf.

Für die vollständige Freigabesicherung zusätzlich aktivieren und auslesen:

1. GitHub-Regelsatz auf `main`: Pull Request, aktueller Pflichtcheck vom GitHub-Actions-Anbieter, keine Löschung und kein Force-Push, keine pauschalen Bypass-Akteure.
2. Vercel Deployment Check im Projekt `lp-karriere` auf genau denselben Checknamen und Commit.
3. Änderungs- und Force-Promote-Rechte begrenzen; Änderungen an Referenzen und Sperren separat prüfen.

Die vorbereitete Konfiguration und der dokumentierte Aktivierungsstand stehen unter [Provider-Sperren](../docs/quality/PROVIDER-CONTROLS.md). Eine vorbereitete JSON-Datei ist kein aktivierter Regelsatz.
