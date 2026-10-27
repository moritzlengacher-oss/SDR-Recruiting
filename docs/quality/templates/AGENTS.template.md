# Projektbezogener Arbeits- und Freigabestandard

**Vorlage, noch keine globale Installation.** Vor der Verwendung alle
`{{PLATZHALTER}}` auflösen und die Pfade an das Zielprojekt anpassen. Eine Kopie
dieser Datei aktiviert weder Regeln in anderen Projekten noch technische
Veröffentlichungssperren.

## Projektbindung

- Projekt: `{{PROJECT_NAME_AND_ID}}`
- Zulässiger Arbeitsbereich: `{{AUTHORIZED_SCOPE}}`
- Abnahmevertrag: `{{ACCEPTANCE_CONTRACT_PATH}}`
- Massgebliche Referenzen: `{{AUTHORITATIVE_REFERENCE_LOCATIONS}}`
- Zielsysteme und Umgebungen: `{{EXACT_TARGET_IDENTIFIERS}}`
- Verbindliches Masterprotokoll: [ASU-STANDARD.md](../ASU-STANDARD.md).

Der Link zum Masterprotokoll gilt an diesem Vorlagenstandort. Wird die Vorlage
beispielsweise als `AGENTS.md` in die Projektwurzel kopiert, muss der Link auf
den dort tatsächlich erreichbaren Standard zeigen. Ausgangspunkt für den
Abnahmevertrag ist [acceptance-contract.example.json](acceptance-contract.example.json).

## 1. Sollstand und Autorisierung

Lies vor einer Änderung den Auftrag, den Abnahmevertrag und die massgeblichen
Originale. Halte Version beziehungsweise Erfassungszeitpunkt fest. Rekonstruiere
Originale nicht aus Erinnerung und ersetze fehlende Referenzen nicht durch
unbelegte Annahmen oder Standardvorlagen.

Erhalte bestehende Markenbestandteile, Inhalte, Funktionen, Datenbeziehungen und
Schnittstellen, soweit der Auftrag ihre Änderung nicht autorisiert. Dazu gehören
bei markengebundenen Ergebnissen auch Logo, Schriften, Farben, Wortlaut und
gemeinsame Komponenten. Keine stillschweigende Neugestaltung, Ersetzung,
Vereinfachung oder Entfernung.

Aktuelle Nutzeranweisungen und bereits erteilte Autorisierungen gelten weiter.
Routineentscheidungen innerhalb dieses Rahmens selbstständig treffen; nicht
erneut um dieselbe Erlaubnis bitten. Ein autorisierter Sollwechsel wird mit Grund
und Herkunft dokumentiert. Ändere erwartete Werte, Referenzen oder Prüfkriterien
nicht allein deshalb, damit ein abweichendes Ergebnis grüne Prüfungen erhält.

## 2. Vier getrennte Prüfungen

Der Aufwand ist proportional zum Auftrag. Kleine Änderungen können vier kurze
Kontrollen benötigen; folgenreiche Änderungen benötigen belastbare Prüfbelege.

| Prüfung | Verbindliche Fragestellung |
|---|---|
| **V1 – Sollstand** | Passen Auftrag, Originale, Pflichtanforderungen, Autorisierung und Ziel zusammen? Welche Annahmen sind offen? |
| **V2 – Auswirkungen** | Welche vorhandenen Funktionen, Daten und Abhängigkeiten sind betroffen? Welche Verluste oder Nebenwirkungen müssen ausgeschlossen werden? |
| **N1 – Ergebnis** | Erfüllt der fertige Stand die vorher festgelegten Anforderungen und erhält er den vereinbarten Bestand? |
| **N2 – Auslieferung** | Ist genau der freigegebene Stand am tatsächlichen Ziel angekommen und funktioniert beziehungsweise erscheint er dort wie erforderlich? |

Bei Veröffentlichungen erfolgt N1 vor der Freigabe und N2 unmittelbar danach.
Bei Dateien prüft N2 den endgültigen Export. Wähle passende Verfahren: tatsächliche
Darstellung, Nutzungsvorgänge, Berechnungen, Quellenabgleich oder gespeicherter
Datenzustand. Reine Dateiexistenz oder richtige Bezeichner belegen kein korrektes
Ergebnis.

Nutze für eine zweite Prüfung einen getrennten Prüfer oder ein ergänzendes
Verfahren, soweit verfügbar. Zähle einen identischen Test nicht doppelt als
unabhängige Prüfung. Behaupte Unabhängigkeit nur, wenn sie tatsächlich vorliegt.

## 3. Nachweise und Ergebnisse

Jede verpflichtende Prüfung erhält Ergebnis, Belegart, Zeitpunkt, geprüfte
Revision beziehungsweise Artefaktversion, Ziel und einen nachvollziehbaren Beleg.

- **Ergebnis:** `PASS`, `FAIL`, `BLOCKED`, `UNVERIFIED` oder `N/A` mit Begründung.
- **Belegart:** `LIVE`, `LOCAL`, `MOCKED`, `STATIC` oder `HISTORICAL`.

Ein simuliertes Ergebnis bestätigt nur den simulierten Vorgang. Ein früherer
Nachweis bestätigt keinen neuen Live-Vorgang. Eine statische Prüfung bestätigt
keine tatsächlich geprüfte Darstellung. Ob eine Belegart für eine Anforderung
genügt, legt der Abnahmevertrag fest. Keine echte Nachricht, Bewerbung, Buchung
oder andere externe Wirkung allein für einen Test auslösen, wenn diese Wirkung
nicht autorisiert ist.

Ein `PASS` gilt nur für den belegten Prüfumfang. Nicht ausgeführte Prüfungen
bleiben `UNVERIFIED`; fehlende Fähigkeiten oder Zugriffe werden `BLOCKED` mit
konkretem Grund. Frühere Fehlschläge und erfolgreiche Wiederholungsprüfungen
bleiben nachvollziehbar. Keine Prüfergebnisse erfinden oder rückwirkend glätten.

## 4. Freigabe und Umgang mit Blockaden

Keine Veröffentlichungsfreigabe bei fehlgeschlagenen, blockierten oder ungeprüften
Pflichtkriterien der Vorabnahme: V1, V2 und N1. Für N2 muss vor der Veröffentlichung
ein konkreter Prüf- und Fehlerbehandlungsplan vorliegen; N2 bleibt bis zur Prüfung
am tatsächlichen Ziel `UNVERIFIED`. Die abschliessende Abnahme verlangt auch den
N2-Nachweis. Eine gleichwertige alternative Prüfung ist möglich,
wenn ihre Aussage und Grenzen dokumentiert sind und sie das Kriterium tatsächlich
abdeckt. Pflichtkriterien nicht nachträglich zu optionalen Kriterien erklären.

Führe bei einer Blockade alle anderen sinnvollen und autorisierten Arbeiten
weiter. Benenne den tatsächlich fehlenden Zugriff, Nachweis oder Entscheid und
bereite den betroffenen Schritt vollständig vor. Keine pauschale neue
Bestätigungsschleife einführen.

Änderungen am geprüften Ergebnis oder an relevanten Referenzen, Abhängigkeiten
und Konfigurationen entwerten die betroffenen Freigaben. Prüfe gezielt den dadurch
betroffenen Bereich erneut. Binde Veröffentlichungen an die geprüfte Revision,
das geprüfte Artefakt und das korrekte Ziel. Umgehe keine vorhandene Freigabesicherung.

Bei einem Fehler nach Auslieferung das betroffene Ergebnis korrigieren oder einen
sicheren, bereits autorisierten Rückweg nutzen. Den tatsächlichen Zustand melden.

## 5. Abschluss

Berichte klar, was umgesetzt und ausgeliefert wurde, was tatsächlich mit welcher
Belegart geprüft wurde und welche Grenzen oder Blockaden verbleiben. Verlinke
die Belege. Verwende „vollständig“, „identisch“, „live getestet“ und „erledigt“ nur
in dem Umfang, den die Nachweise tragen.

Diese Anweisungen ersetzen keine technischen Zugriffskontrollen. Behaupte eine
verbindliche Veröffentlichungssperre erst, wenn sie am tatsächlichen
Veröffentlichungsweg eingerichtet und geprüft wurde.
