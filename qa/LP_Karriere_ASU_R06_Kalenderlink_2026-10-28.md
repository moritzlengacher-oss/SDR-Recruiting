# L&P Karriere – ASU R06: Kalenderbuchungslink entfernen

## Auftrag und Änderungsvertrag

Nutzerauftrag vom 28.10.2026: **«Auf der L&P Karriereseite den Kalenderbuchungslink entfernen. ASU»**.

Die Karriereübersicht und alle 21 Stellendetailseiten dürfen den Link `https://crm.lengacher-partner.ch/book/karriere` und den zugehörigen Absatz «Du möchtest uns zuerst kennenlernen? Karrieregespräch buchen →» nicht mehr enthalten. Die zwei ausschliesslich dazugehörigen CSS-Regeln werden entfernt. Die übrigen HTML-Bytes jeder Seite bleiben identisch. Formular, API, Clientverhalten, Stellenkatalog, URLs, Filter, Quick Apply, gemeinsame Navigation, Footer und Marken-Assets bleiben erhalten.

Die bisherigen positiven Kalenderlink-Erwartungen in `quality-contract.json`, `quality-contract.test.mjs`, `brand-guard.test.mjs` und `browser-qa.mjs` werden aufgrund dieses ausdrücklichen Nutzerauftrags durch Abwesenheitsprüfungen ersetzt. Die übrigen Prüfungen und Referenzhashes werden nicht verändert. Diese Änderung an geschützten Prüferwartungen muss zusätzlich unabhängig geprüft werden.

## Ausgangsstand und Ziel

| Merkmal | Nachweis |
| --- | --- |
| Repository | `moritzlengacher-oss/SDR-Recruiting` |
| Ausgangsrevision | `df4f80e79dc173bee13ee16b69aa85b601a69998` (`origin/main`) |
| Arbeitsbranch | `fix/remove-career-booking-20261028` |
| Anwendung | Projekt-Root `karriere`, Build-Ausgabe `karriere/public` |
| Zielprojekt | Vercel `lp-karriere`, `prj_aai674bWi0ZXbmKh2ocCCRuSSv5o` |
| Team | `team_D2HfAoMX5gjDjxSQrYJYaBsu` |
| Öffentliche Seite | https://jobs.lengacher-partner.ch/karriere |
| Ursprung | https://jobs-app.lengacher-partner.ch |
| Bestehendes Deployment / Rollback | `dpl_AXQqs6JG3pmt5FpoNfL9ewvN2Fxg` |
| Live-HTML der Übersicht vor Änderung | Beide Hosts identisch, 50 105 Bytes; SHA-256 `d3685c344229e85a5aef05bcb8132879aa8916701e7284b193a9f81e8477a773` |

Die separate SDR-Landingpage im Repository-Root und der bestehende Host-Proxy des Hauptprojekts `ic` gehören nicht zum Änderungsumfang. Die Zielzuordnung und die Live-Baseline wurden vom Hauptagenten über Vercel/HTTP bestätigt. Die Browser- und Codeprüfungen beziehen sich auf den fertigen Kandidaten; eine produktive Wirkung wird erst nach N2 bestätigt.

## V1 – Original und Anforderungen

**PASS / STATIC** – Agent `/root/remove_calendar` hat `AGENTS.md`, den Repository-ASU-Standard, `karriere/ASU_RELEASE.md`, den vollständigen Qualitätsvertrag, den Generator und die betroffenen Prüfungen gelesen. Im Ausgangsstand enthält jede der 22 Quellseiten genau einen identischen Buchungsabsatz. Der Generator übernimmt diese Quellen in die Ausgabe und fügt ausschliesslich die vorhandenen gemeinsamen Markenfragmente hinzu.

**PASS / LIVE** – Unabhängiger Agent `/root/live_audit` hat die Übersicht und alle 21 Details per HTTP geprüft: jeweils HTTP 200 und genau ein Link «Karrieregespräch buchen →» im Bewerbungsbereich `#bewerben`. Die öffentlich ausgelieferten Client-/Shell-Skripte enthalten keine dynamisch ergänzten Karriere-Kalenderlinks. Die Ansprechpartner-/Bewerbungsfunktionen sind vom Absatz getrennt.

## V2 – Auswirkungen, Erhalt und Prüfplan

**PASS / STATIC** – Die Entfernung betrifft einen Absatz unmittelbar vor dem vorhandenen Formular. Sämtliche Formularfelder, Endpunkt `/api/career-application`, Datenschutz-Einwilligung, Rollen-/Angebotszuordnung, Quick Apply, Filter und Stellen-URLs bleiben erhalten. Die bestehende Browserprüfung fängt Anwendungs-POSTs vor der ersten Navigation ab; alle sonstigen ausgehenden oder schreibenden Anfragen werden blockiert. Es wird keine Bewerbung oder Buchung ausgelöst.

**PASS / LIVE** – Hauptagent `/root` hat Zielprojekt, laufendes Deployment und Ausgangsrevision zugeordnet. Die öffentliche Übersicht und der Karriere-Ursprung liefern identische HTML-Bytes. Das bestehende Deployment bleibt die Rückkehrmöglichkeit.

N1 umfasst den vollständigen vorgeschriebenen `npm test`-Gate, den Vergleich der 22 Quellen mit dem Ausgangsstand, unabhängigen Diff-/Vertragsreview und eine Sichtprüfung der gerenderten Bewerbungsbereiche auf Desktop und Mobilgerät. N2 prüft nach autorisierter Veröffentlichung die richtige Revision/Deployment-ID, den öffentlichen Host und den Ursprung, die Abwesenheit des Links auf allen 22 Seiten und die erhaltenen Bewerbungs-Einstiege. Bei Abweichungen wird die Ursache behoben oder zum oben genannten Deployment zurückgekehrt. Verantwortlich für Veröffentlichung und N2 ist Hauptagent `/root`.

## Umsetzung und N1

- 22 Quellseiten: jeweils ausschliesslich den identischen Buchungsabsatz entfernt; der Rest jeder HTML-Datei wurde bytegleich gegen `origin/main` verglichen.
- CSS: nur `.lp-jobs-booking-note` und `.lp-jobs-booking-note a` entfernt.
- Bestehende Tests: Abwesenheit von Buchungs-URL und Absatz prüfen; alle sonstigen Gates, Referenz-/Integrationshashes und Ziele erhalten.
- `npm ci --include=dev --ignore-scripts --no-audit --no-fund`: erfolgreich, gesperrte Abhängigkeiten unverändert.

| Prüfung | Ergebnis / Ausführungsart | Beobachtung |
| --- | --- | --- |
| Enger HTML-Diff | PASS / STATIC | Alle 22 Quellen entsprechen exakt der Ausgangsrevision abzüglich des einzelnen Buchungsabsatzes. |
| Erster Gate-Versuch | BLOCKED / LOCAL | Prozess-Sandbox verhindert Node-Unterprozesse (`spawnSync EPERM`); keine statischen Tests ausgeführt. Rohreport bleibt erhalten: Lauf `2026-10-28T19-34-50-272Z-e11de03a-b18b-4ee7-8eb8-77c5e869fcfc`. |
| Zweiter Gate-Versuch | BLOCKED / LOCAL | 27/27 statische Tests bestanden. Browser konnte nicht starten, weil eine bereits vorhandene leere Datei `/tmp/chromium` wiederverwendet wurde; 0 Browserchecks. Rohreport bleibt erhalten: Lauf `2026-10-28T19-35-06-429Z-177c0e18-5faf-4ce1-892d-e4c8ec73cfe0`. |
| Dritter Gate-Versuch mit isolierter Laufzeit | BLOCKED / LOCAL | 27/27 statische und 11 Browserchecks bestanden; Chromium stürzt bei Schrift-Fallback ab (`SIGTRAP`, `SkFontMgr_FontConfigInterface`). Die mitgelieferte Fontconfig zeigt auf das leere globale `/tmp/fonts`. Dadurch 6 Folgefehler, 0 geprüfte Detailseiten. Lauf `2026-10-28T19-35-34-003Z-6cc0bd83-285a-426a-b2eb-5cc859e642ea` bleibt erhalten. |
| Vollständiger Gate mit korrigierten temporären Fontconfig-Pfaden | PASS / STATIC + LOCAL + MOCKED | Lauf `2026-10-28T19-36-50-691Z-95200a60-e9a2-4c03-b50b-4775a28038e3`: 27/27 statische Prüfungen und 49/49 Browserchecks, alle 21 Details; 0 Fehler, übersprungene Tests oder externe Writes. 4 Formular-POSTs abgefangen und simuliert. Ausschliesslich die extrahierte Laufzeitkonfiguration zeigt auf ihr eigenes Schriftenverzeichnis; keine Repository-/Runneränderung für die Werkzeugfehler. |
| Unabhängiger Review der Implementierung und geänderten Erwartungen | PASS / STATIC | Agent `/root/live_audit`: alle 22 HTML-Entfernungen, die zwei CSS-Regeln, drei Prüfdateien und der Vertrag korrekt; keine anderweitige Sollwertabschwächung. Review-Diff SHA-256 `5852dc9e41e9a5f3853f0948e0a6501fc8f0b6664b6af7ffebe79d158dafd39f` (vor Ergänzung dieses Berichts). |
| Sichtprüfung der lokalen Bewerbungs-Screenshots | PASS / LOCAL | Agent `/root/remove_calendar` hat `application-1440.png` und `application-390.png` geöffnet: entfernte Buchungszeile im Desktop-Bereich, erhaltenes zweispaltiges Desktop-Formular und lesbare einspaltige mobile Formularfelder. Die öffentliche Darstellung ist Bestandteil von N2. |

### Kandidatenbindung des erfolgreichen lokalen Laufs

Die Prüfung lief vor dem Commit auf dem Arbeitsstand über `df4f80e79dc173bee13ee16b69aa85b601a69998`; die konkreten geänderten Dateien und Hashes sind im Evidence-Report erfasst. Der Bericht allein ist kein Beleg eines sauberen Commit-Checkouts. Nach Versionierung muss die Revision mit diesem Dateistand beziehungsweise erneutem CI-Gate verbunden werden.

- Source-Snapshot SHA-256: `b368677e9e57599b5493b4e6c46e61a62b0208b4ef5e81ae17cebf11e7da5f1c`.
- Vertrag SHA-256: `b913d66a4df9673366c948265ef6d0e4db76904f62d358c918d4c0a329165edc`.
- Build-Inventar SHA-256: `5b6934c7f938699497f3d685ad571e32957ea3c928efb6306445d40ec59897a4`.
- Browserbericht SHA-256 (kanonisch serialisiert durch den Gate): `aa42f08df558f076dce071501cced67f815fb4cd3d16de6824c75659158839c7`.
- Rohbelege und neun Screenshots: `karriere/qa-output/runs/2026-10-28T19-36-50-691Z-95200a60-e9a2-4c03-b50b-4775a28038e3/`.

## N2 – Tatsächliche Auslieferung

**UNVERIFIED / LIVE** – Noch keine Veröffentlichung dieses Kandidaten durch den Implementierungsagenten. Exakter Kandidaten-Commit, Deployment-ID und Nachweise werden nach tatsächlicher Auslieferung ergänzt. Ein lokaler Build oder simulierter Formularerfolg wird nicht als produktiver Nachweis gewertet.

## Nachweisgrenzen

Die aktuellen Formularerfolge sind `MOCKED`; sie bestätigen keine neue CRM-Speicherung oder E-Mail-Zustellung. Der entsprechende Client-/Relay-Code bleibt unverändert und ist über die bestehenden Referenzhashes geschützt. Eine echte Terminbuchung ist für die Entfernung eines Links nicht erforderlich. Agentenprüfungen werden als solche bezeichnet und sind keine menschlichen Freigaben.
