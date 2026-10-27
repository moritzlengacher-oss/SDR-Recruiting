# ASU: verbindliche Arbeits- und Qualitätsregeln

Vor Änderungen `docs/quality/ASU-STANDARD.md` lesen und anwenden. Für die Karriereplattform zusätzlich `karriere/quality-contract.json` und `karriere/ASU_RELEASE.md` lesen. Diese Dateien gelten für Implementierung, Prüfung und Veröffentlichung in diesem Repository.

- Bestehende Marke, Inhalte, Funktionen, Datenwege und Ziele zuerst inventarisieren. Die Originalreferenz ist das Soll; die neue Implementierung darf sich nicht selbst zum Soll erklären. Abweichungen benötigen einen dokumentierten Auftrag.
- Zwei Vorprüfungen (V1 Bestand/Referenz, V2 Auswirkungen/Abnahmekriterien), danach N1 am konkreten Kandidaten und N2 am tatsächlich ausgelieferten Ziel. Unabhängige Agentenprüfung wahrheitsgemäss als solche bezeichnen; sie ist keine menschliche Freigabe.
- Für Karriereänderungen `npm ci --include=dev --ignore-scripts` und `npm test` in `karriere/` ausführen. Der vollständige Gate umfasst statische Prüfungen und echten Browserlauf. Ein Build, HTTP 200 oder Mock-Erfolg ersetzt keine fachliche Abnahme.
- Nachweise an Revision, Artefakthash, Zielprojekt und Domain binden. Änderungen am geprüften Inhalt machen betroffene Nachweise ungültig. `PASS`, `FAIL`, `BLOCKED`, `UNVERIFIED` und begründetes `N/A` getrennt von `LIVE`, `LOCAL`, `MOCKED`, `STATIC`, `HISTORICAL` ausweisen.
- Referenzen, Sollwerte, Tests oder Sperren niemals abschwächen, um einen fehlerhaften Kandidaten grün zu machen. Bewusste Änderungen an geschützten Referenzen/Integrationen separat begründen und unabhängig prüfen lassen.
- Vorhandene Autorisierung des Nutzers gilt weiter. Routineprüfungen, reversible Korrekturen und bereits beauftragte Veröffentlichungen ohne erneute pauschale Rückfrage durchführen. Echte E-Mails, Nachrichten und Testbewerbungen nur bei ausdrücklicher Versandautorisierung; sonst sicher simulieren und die Nachweisgrenze nennen.
- Bei Zugriffslücken die übrige Arbeit fertigstellen und den konkreten fehlenden Zugriff benennen. Keine globalen oder providerseitigen Sperren behaupten, bevor deren aktive Einstellungen ausgelesen und verifiziert wurden.

Die bestehende SDR-Landingpage im Repository-Root gehört zu einem anderen Veröffentlichungsziel. Nicht im Zuge einer Karriereänderung verändern. Andere Marken behalten ihre eigenen Originalreferenzen.
