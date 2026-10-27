# L&P ASU R05 — Ursachenklärung und dauerhafte Qualitätssicherung

Stand: 27.10.2026. Die Tabellen trennen nachgewiesene Ergebnisse von vorbereiteten Kontoeinstellungen.

## Ergebnis

- Persönlicher **ASU Qualitätsstandard** dauerhaft installiert, automatische relevante Auswahl aktiviert und mit einer anderen Marke in einer frischen Agenten-Szenarioprüfung kontrolliert: https://chatgpt.com/skills?skill_id=6ae0ef713b3c8191a2156dc12825e4bc .
- Präventionscode und minimaler Formularfix über [PR3](https://github.com/moritzlengacher-oss/SDR-Recruiting/pull/3) übernommen.
- Geprüfter Kandidat: `4e6637c7023abf71e6a7c4c53203f8e668f1398d`.
- Produktiver Merge: `df4f80e79dc173bee13ee16b69aa85b601a69998`.
- Beide Stände enthalten exakt denselben Git-Baum `7425c0f9e296342f599b11476966dff8cec245ca`.
- Produktives Ziel: `lp-karriere` / `prj_aai674bWi0ZXbmKh2ocCCRuSSv5o`.
- Produktives Deployment: `dpl_AXQqs6JG3pmt5FpoNfL9ewvN2Fxg`, READY.
- Öffentliche Seite: https://jobs.lengacher-partner.ch/karriere .

## Belegte Ursache

Der ursprüngliche [Migrations-PR1](https://github.com/moritzlengacher-oss/SDR-Recruiting/pull/1) versprach „L&P-Design“, ohne die Original-Identität als prüfbare Abnahme zu definieren. Das Ergebnis verwendete eine andere Palette, andere Schriftannahmen und eine Ersatzmarkierung. Die damalige CI führte keine Browserprüfung durch und band nur 10 der 13 behaupteten automatisierten Tests ein. Die drei separaten Release-Tests waren nicht Teil des Workflows.

PR1 wurde nach 29 Sekunden zusammengeführt. Die Review-Liste war leer. Das belegt fehlende dokumentierte unabhängige Review, nicht die inneren Beweggründe des damaligen Bearbeiters. Der generische grüne Vercel-Status gehörte zum separaten Projekt `sdr-recruiting`. Zusätzlich war `main` ungeschützt und die Zielangabe in `ASU_RELEASE.md` veraltet.

Die belegte Fehlerkette lautet: Anforderungen nicht als Sollvertrag erfasst → Ersatzimplementierung → zu schmale technische Tests → grüne Teilnachweise als Gesamtfreigabe behandelt → fehlende verbindliche Merge-/Deploy-Kontrolle. Die Nutzeranforderung war kein nachgewiesenes Problem. Ausführliche Primärquellen: [Vorfallsanalyse](../docs/quality/INCIDENT-2026-10-27.md).

## Umgesetzte Regeln und ausführbare Prüfungen

`AGENTS.md` verankert den [ASU-Standard](../docs/quality/ASU-STANDARD.md). Der [Projektvertrag](../karriere/quality-contract.json) hält Originalquelle, Logo, Fonts, Palette, Header/Footer, 14 Assets, 21 Stellen, 15 Funktionsbereiche, Zielprojekt, Domain und Integrationsgrenzen fest. Unabhängig verankerte Hashes im Prüfer verhindern, dass eine Änderung nur am Kandidatenmanifest sich selbst als korrekt erklärt.

`npm test`, `npm run build`, GitHub Actions und Vercel verwenden `node verify.mjs`. Der Gate baut die Seiten, führt alle vier statischen Testsuiten aus und startet einen echten Browser. Der Browser prüft tatsächliche Originalfonts, sichtbares Logo, wirksame Farben, Kontrast, Geometrie, Navigation, Suche, Filter, Reset, Quick Apply, Consent, PDF, Fehler, Retry-ID und Erfolg. Der Workflow läuft ohne Pfad- oder Branchfilter.

Jeder Lauf erhält ein eigenes Verzeichnis mit Zeitstempel und UUID. Frühere Fehlversuche bleiben bestehen. Vor Abschluss wird das gesamte gebaute Dateiinventar erneut verglichen. Ein falsches Vercel-Projekt, ein abweichender Commit, ein fehlender Test oder ein FAIL/Skip/TODO verhindert den erfolgreichen Gate.

Der Standard gilt künftig für die jeweils eigene Marke und den konkreten Auftrag. Die Installation eines Skills ist eine dauerhafte Arbeitsanweisung; sie konfiguriert nicht automatisch alle anderen Repositories oder Provider.

## Zwei Vorprüfungen und zwei Nachprüfungen

| Phase | Tatsächliche Prüfung | Ergebnis und Belegart |
| --- | --- | --- |
| V1 | Originalanforderungen, frühere Migration, Quellstände, R04 und PR-/CI-Historie; unabhängige Agentenperspektive | PASS / STATIC, HISTORICAL |
| V2 | Freigabewege, Zielprojekt, Schutzkonfiguration, Funktions-/Integrationsumfang und Grenzen; unabhängige Agentenperspektive | PASS / STATIC, LIVE für ausgelesene Einstellungen |
| N1 | Fertiger Kandidat: 27 statische Fälle, 49 Browserfälle, alle 21 Detailseiten, Desktop/390/320px; unabhängiger Review nach Korrekturen | PASS / STATIC, LOCAL, MOCKED |
| N2 | Richtiger produktiver Commit/Projekt/Deployment, vollständiger öffentlicher Byteabgleich und sichere GET-API-Prüfung | PASS / LIVE für diesen Auslieferungsumfang |

Die Agentenreviews sind ausdrücklich keine menschlichen Freigaben. N2 bestätigt keine erfolgreiche externe Bewerbung oder E-Mail-Zustellung.

### Ausführungsbelege

- [GitHub Push-Lauf](https://github.com/moritzlengacher-oss/SDR-Recruiting/actions/runs/40564741827): erfolgreich.
- [GitHub PR-Lauf](https://github.com/moritzlengacher-oss/SDR-Recruiting/actions/runs/40564748797): erfolgreich.
- [GitHub Main-Lauf](https://github.com/moritzlengacher-oss/SDR-Recruiting/actions/runs/40565202620): erfolgreich.
- CI-Artefakt `lp-karriere-qa-4e6637c7023abf71e6a7c4c53203f8e668f1398d-40564741827-1` enthält vollständige Logs, JSON und neun Original-Screenshots.
- [Kandidaten-Nachweis](LP_ASU_R05_Candidate_Evidence_2026-10-27.json): 27/27 statisch, 49/49 Browser, 21/21 Detailseiten, kein Skip/TODO, korrekte Revision, keine externen Schreibvorgänge.
- [Live-Nachweis](LP_ASU_R05_Live_Evidence_2026-10-27.json): 42/42 Dateien einschliesslich 22 HTML-Seiten stimmen im SHA-256 überein; API-GET 405, Cache-Control no-store.
- [Negativprobe](LP_ASU_R05_Negative_Gate_2026-10-27.json): absichtlich falsches Projekt führt zu Exit 1 vor dem Build; vorheriger PASS-Lauf bleibt erhalten.
- Gesamtdigest des geprüften Builds: `dc181d70409d8c2bd9352f5f68f15e1e32528430204b0e64154bd61b0a261f89`.

## Gefundene und korrigierte Lücken — Historie bleibt sichtbar

1. Erster Browserlauf: 46/49 bestanden. Ein Sollwert war fehlerhaft: Die unveränderte Original-CSS überschreibt Basisgold `#b8975a` im dokumentierten WCAG-Block mit effektivem `#76591f`. Die Erwartung wurde anhand der unveränderten Originalbytes korrigiert.
2. Derselbe Lauf fand zwei zusammenhängende echte Fehler: Nach bestätigter Bewerbung blieb die versteckte Übermittlungs-ID erhalten und wurde für eine zweite neue Bewerbung wiederverwendet. Der minimale Fix leert sie nach bestätigtem Erfolg. Fehlerwiederholungen behalten ihre ID. Der Vertrag prüft den begrenzten Diff gegen den historischen Client.
3. Zweiter Browserlauf: 48/49 bestanden. Playwright wartete nach einem tatsächlich ausgeführten, per JavaScript abgefangenen Formular-Submit auf Navigation. Der Runner verwendet nur für diesen Submit `noWaitAfter`; alle spezifischen Ergebnis-, Request- und Payload-Prüfungen bleiben erhalten. Kein Force-Klick, keine automatische Wiederholung.
4. Unabhängiger N1-Review meldete FAIL/STATIC wegen überschriebener früherer Nachweise und unvollständigem Abschlussinventar. Nach Umsetzung eigener Laufverzeichnisse und vollständigem Inventarvergleich wurde der gezielte Review PASS/STATIC.
5. Finaler vollständiger Lauf auf dem gespeicherten Kandidaten: 27/27 statisch und 49/49 Browser. Danach erfolgreiche CI-/Preview-/Produktionsauslieferung und N2.

## Tatsächlicher Durchsetzungsstand

| Ebene | Stand dieses Nachweises |
| --- | --- |
| Persönlicher ASU-Skill | Installiert und aktiv verfügbar; keine absolute Garantie automatischer Befolgung |
| Repositoryregeln und Projektvertrag | Auf main übernommen |
| Vollständiger GitHub-Workflow | Ausgeführt und erfolgreich; noch kein serverseitiger Pflichtcheck |
| Kanonischer Vercel-Buildweg | Konfiguriert; Preview und Produktion READY mit korrektem Code/Projekt |
| GitHub-Regelsatz auf main | PREPARED / Aktivierung BLOCKED: administrative Schreibfunktion fehlt in der Verbindung; zuletzt ausgelesene Regelsatzliste leer |
| Vercel GitHub Deployment Check | PREPARED / Aktivierung UNVERIFIED: entsprechender Schreibaufruf fehlt; administrative Browseranmeldung erforderlich |
| Getrennte Freigaberechte / Force-Promote-Beschränkung | UNVERIFIED; keine zweite GitHub-Prüferidentität behauptet |
| Andere Projekte | Dauerhafte allgemeine Arbeitsanweisung verfügbar; keine ungeprüfte technische Massenumstellung behauptet |

Die konkrete [Provider-Konfiguration](../docs/quality/PROVIDER-CONTROLS.md) und der [importierbare GitHub-Regelsatz](../docs/quality/github-main-ruleset.json) sind vorbereitet. Der Regelsatz erzwingt CI/PR und verhindert Force-Push/Löschung; er behauptet keine menschliche Zweitfreigabe. Für die getrennte menschliche Genehmigung muss eine tatsächlich andere berechtigte Identität eingerichtet werden.

## Scope und Grenzen

Das API-Relay, Ziel und Empfänger wurden nicht geändert. Es wurden keine neuen echten Bewerbungen, CRM-Datensätze, E-Mails oder Kalenderbuchungen ausgelöst. Browser-Erfolg ist MOCKED; reale Zustellung bleibt UNVERIFIED. Die vorhandene SDR-Root-Seite und die Original-Markenbytes sind unverändert.

Der Vercel-Build-Log-Endpunkt antwortete in dieser Sitzung auf gültige Deployment-IDs mit 404. Erfolgreiche Deploymentzustände und ihre Projekt-/Commitidentität wurden über den Deployment-Endpunkt ausgelesen; die detaillierten Testzahlen stammen aus dem vollständigen isolierten Lauf und der identischen CI-Konfiguration. Ein nicht verfügbarer Build-Log wurde nicht als gelesen ausgegeben.

## Sichtprüfung

Die fertigen Ansichten wurden anhand der erzeugten Screenshots erneut angesehen. Die folgenden JPEG-Dateien sind platzsparende Ansichtskopien; die vollständigen PNG-Originale und ihre Hashes liegen im CI-Artefakt.

- [Desktop](lp-asu-r05-desktop.jpg)
- [Mobiles Formular](lp-asu-r05-mobile-form.jpg)
- [Footer](lp-asu-r05-footer.jpg)

## Ergänzung zum verbleibenden Kontozugriff

Die automatische Freigabeprüfung hat den Versuch einer sicheren GitHub-Browseranmeldung abgelehnt. Genannter Grund: Für den konkreten Anmelde-/Kontoauswahlschritt liegt noch keine ausdrückliche Freigabe vor. Es wurde keine Anmeldung durchgeführt und keine andere Route zur Umgehung verwendet. Code, Skill, Prüfnachweise und produktiver Fix sind davon unberührt. Die administrativen GitHub-/Vercel-Kontosperren bleiben offen, bis dieser gezielte Zugriff freigegeben und die Einstellungen anschliessend tatsächlich aktiviert und ausgelesen sind.
