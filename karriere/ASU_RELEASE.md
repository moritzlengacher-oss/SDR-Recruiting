# L&P Karriere – ASU-Releasevertrag R05

Stand: 27.10.2026. Auftrag: gesamte Karriereseite auf falsche und veraltete Inhalte/Funktionen prüfen und bestätigte Fehler beheben; zwei Vorprüfungen und zwei Nachprüfungen. Der Nutzer hat die normale Hauptwebsite ausdrücklich als korrektes Original bestätigt.

## Ziel und Ausgangsstand

- Repository: `moritzlengacher-oss/SDR-Recruiting`, Root Directory `karriere`.
- Vercel-Projekt: `lp-karriere`, ID `prj_aai674bWi0ZXbmKh2ocCCRuSSv5o`.
- App-Domain: `jobs-app.lengacher-partner.ch`; öffentliche Domain: `jobs.lengacher-partner.ch` über den bestehenden Host-Proxy im Hauptprojekt `ic`.
- Produktionscode vor R05: `9b1e2da60ebdafdca9ddcf3a57f6ab90b1f1f858`; Git-main vor R05: `695bd03fb107bab1bb90b4d70de898ccc4aff804` (zusätzliche Dokumentation).
- Ausgangsdeployment und Rückkehrziel: `dpl_D1AoMZUVmuGJLXy1Lhe6qLaXN1J3`.
- Hauptwebsite: `moritzlengacher-oss/lengacher-partner-website`, Vercel `ic`, `https://www.lengacher-partner.ch/`.
- Arbeitsbranch: `fix/lp-karriere-audit-r05-20261027`; Änderungsantrag: https://github.com/moritzlengacher-oss/SDR-Recruiting/pull/4.

## Änderungsvertrag

Die Übersicht und alle 21 Stellen, Canonicals, Rollen-/source_offer-Zuordnung, Originaltexte und Datumswerte, Logo/Schriften/Farben/Header/Footer, Filter, FAQ, Buchungsziel und bestehender Produktions-CRM-Relay bleiben erhalten. Die Hauptwebsite und die separate SDR-Root-Seite werden nicht verändert.

Bestätigte Korrekturen: eindeutige hochauflösende Original-Favicon-Auswahl und korrekte ICO-Grössenangabe; vollständige Plattformicons/Manifest und Social-Metadaten; vollständige strukturierte Jobbeschreibungen und passendes Pensum; konsistente LinkedIn-/Host-Validierung, Duplikatsperre und stabile Wiederholungskennung; Tastatur-Sprunglink; serverseitige Sperre von Preview-Bewerbungen. Die globale Suche muss zusätzlich aktuelle veröffentlichte Artikel aus derselben öffentlichen Quelle wie die Hauptwebsite einbeziehen und bei deren Ausfall weiter nutzbar bleiben.

## Prüfungen und Integrität

| Phase | Umfang | Status vor dem noch ausstehenden Browserabschluss |
|---|---|---|
| V1 | Verbindliche Hauptwebsite, Nutzer-Screenshots, Originaldateien/Prüfsummen und alle 22 Markenimplementierungen | PASS, LIVE/STATIC; ergänzter Befund zu 12 fehlenden neueren Suchartikeln dokumentiert |
| V2 | Seiten, Links, Assets, Rollen, Datenflüsse, Formularfehler, Proxy und korrektes Ziel | PASS, LIVE/STATIC/MOCKED; Fehler reproduziert und Erhaltungsumfang festgelegt |
| N1 | Exakter fertiger Kandidat: Build, Regressionen, unabhängige Agentenprüfung sowie gerenderte Desktop-/Mobilansichten | Code-Teilnachweise bestanden; nach jeder weiteren Korrektur betroffene Tests/CI erneut ausführen. Sichtprüfung aktuell BLOCKED: autorisierter Browserzugang zur geschützten Vorschau ausstehend |
| N2 | Produktionscommit, Deployment und öffentliche Domain zuordnen; alle 22 Seiten und Originalassets abgleichen; Live-Bedienung und read-only API/Weiterleitungen prüfen | UNVERIFIED, noch keine R05-Produktion veröffentlicht |

Der aktuelle Commit und seine tatsächlich ausgeführten CI-Ergebnisse stehen im Änderungsantrag. Ein grüner früherer Lauf bestätigt keine spätere Änderung. Frühere Fehlversuche bleiben als Historie erhalten. Agentenprüfungen sind keine menschliche Freigabe. Eine Workflow-Datei ist kein Nachweis einer verbindlichen Provider-Sperre.

## Browserzugang und Grenzen

Vercel Authentication schützt die Vorschau. Für die Desktop-/Mobilprüfung ist ein autorisierter Vorschauzugang erforderlich. Solange dieser fehlt, ist die Sichtprüfung BLOCKED. Der Schutz bleibt bestehen. Diese Zugriffslücke ist kein nachgewiesener Produktfehler und kein bestandener Test.

Keine reale Testbewerbung, neue CRM-Schreibung, Buchung oder E-Mail wurde für R05 ausgelöst. Validierungs-/Fehlerszenarien werden mit vollständig abgefangenem Netzwerk geprüft. Google bestimmt Favicon-Auswahl und erneuten Crawl selbst; korrigierte Metadaten sind keine Zusage einer sofortigen Änderung im Suchergebnis. Stellenverfügbarkeit und ursprüngliche Veröffentlichungsdaten werden als bestehender Arbeitgeberinhalt erhalten.

## Auslieferung nach abgeschlossenem N1

Den geprüften Commit für genau `lp-karriere` mit Root `karriere`, Build `node build.mjs` und Output `public` veröffentlichen. Danach N2 an der öffentlichen Domain durchführen. Bei Abweichung zielgerichtet korrigieren oder zum dokumentierten Ausgangsdeployment zurückkehren. N2 erst nach tatsächlicher Veröffentlichung als bestanden bewerten.
