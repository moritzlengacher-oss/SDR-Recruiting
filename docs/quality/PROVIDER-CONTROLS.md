# Provider-Sperren: Konfiguration und tatsächlicher Stand

## Prüfbefund vom 27.10.2026

GitHub `main` war ungeschützt; die Regelsatzliste war leer. Der bisherige grüne Check war freiwillig. Vercel-Builds liefen lediglich über den Generator. Diese Zustände erklären die fehlende technische Abnahmesperre; sie sind getrennt von der Qualität einzelner Prüfläufe zu behandeln.

## Vorbereitete GitHub-Regel

[github-main-ruleset.json](github-main-ruleset.json) ist die konkrete importierbare Konfiguration für `moritzlengacher-oss/SDR-Recruiting`. Sie verlangt auf `main` einen Pull Request und den aktuellen Check **ASU / lp-karriere / quality-gate** vom Anbieter GitHub Actions (App-ID 15368, aus dem tatsächlich vorhandenen Check ausgelesen). Sie verbietet Force-Push und Löschung und enthält keine Bypass-Akteure.

Die Regel verlangt **keine unabhängige menschliche Freigabe**. Ein zweiter freigabeberechtigter GitHub-Prüfer ist in diesem Auftrag nicht identifiziert; Autor und Prüfer unter derselben GitHub-Identität wären keine unabhängige Genehmigung. Die unabhängige fachliche Prüfung nach ASU wird separat dokumentiert. Für eine technisch erzwungene Trennung der Zuständigkeiten muss ein anderer berechtigter Prüfer benannt und anschliessend `required_approving_review_count` auf 1 sowie `require_last_push_approval` auf true gesetzt werden. Eine Selbstzuordnung als CODEOWNER löst diese Trennung nicht.

Aktivierung mit einem bereits autorisierten administrativen Zugang, vom Repository-Root:

```sh
gh api --method POST repos/moritzlengacher-oss/SDR-Recruiting/rulesets --input docs/quality/github-main-ruleset.json
gh api repos/moritzlengacher-oss/SDR-Recruiting/rules/branches/main
```

Vor dem POST vorhandene Regelsätze prüfen; bei bereits bestehender entsprechender Regel diese aktualisieren, keine Duplikate erzeugen. Nach dem Schreiben den aktiven Zustand, Anbieter, Checknamen und Zielbranch zurücklesen. JSON im Repository allein aktiviert nichts.

## Vercel-Konfiguration

Projekt **lp-karriere**, ID `prj_aai674bWi0ZXbmKh2ocCCRuSSv5o`, Team `team_D2HfAoMX5gjDjxSQrYJYaBsu`:

- Root Directory: `karriere`.
- Install Command: `npm ci --include=dev --ignore-scripts --no-audit --no-fund`.
- Build Command: `node verify.mjs`.
- Output Directory: `public`.
- Source files outside Root Directory einschliessen: `true` (gemeinsame Root-Tests und Regeln).
- System-Umgebungsvariablen freigeben: `true`, damit der Build seine tatsächliche Projekt- und Commitidentität prüft.
- Unter Deployment Checks den GitHub-Check **ASU / lp-karriere / quality-gate** auswählen; automatische Domainzuordnung darf erst nach erfolgreichem Check erfolgen.

Ein korrekt konfigurierter Build stoppt beim fehlgeschlagenen Gate. Vercel Deployment Checks verhindern zusätzlich eine automatische Produktionspromotion vor dem passenden GitHub-Ergebnis. Force Promote und das Ändern dieser Einstellungen müssen durch passende Rollen begrenzt werden; Vercel bietet eine manuelle Umgehung an.

## Aktivierungsnachweis

Der finale Prüfbericht dieses Auftrags muss für **Build-Gate**, **GitHub-Regelsatz**, **Vercel Deployment Check** und **getrennte Änderungsrechte** jeweils separat ausweisen: ACTIVE (ausgelesen und geprüft), PREPARED (nur Konfiguration vorhanden), BLOCKED (konkreter Zugriff fehlt) oder UNVERIFIED. Diese Zustände sind Steuerungszustände, keine Testergebnisse.

Die verfügbare GitHub-Verbindung kann Code und PRs schreiben, aber keine administrativen Regelsätze aktivieren. Der Browserzugang zur Einstellungsseite war nicht angemeldet. Der vorhandene Vercel-Connector unterstützt Projekteinstellungen, stellt jedoch keinen Schreibaufruf für die Auswahl der GitHub Deployment Checks bereit. Das sind konkrete Werkzeug-/Zugriffsgrenzen, keine Aussage über die Administratorrechte des Nutzers.

## Offizielle Referenzen

- [GitHub-Regelsätze: API und erforderliche Administration-Schreibberechtigung](https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset)
- [Vercel Deployment Checks: Commitbezug, Einrichtung und Force Promote](https://vercel.com/docs/deployment-checks)
- [Vercel-Projekteinstellungen](https://vercel.com/docs/rest-api/projects/update-an-existing-project)
