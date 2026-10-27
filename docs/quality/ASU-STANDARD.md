# ASU-Standard für Änderungen und Auslieferungen

**Geltung:** Arbeiten in diesem Repository und als übertragbare Arbeitsweise für andere Projekte. Jede Anwendung verwendet ihre eigenen autorisierten Quellen, Marken, Anforderungen und Zielsysteme. Eine Datei in diesem Repository installiert keine globale Regel in anderen Repositories, Konten oder Werkzeugen.

## Grundsatz

Der Auftrag wird anhand seiner nachgewiesenen Anforderungen erfüllt. Bestehende Inhalte, Funktionen, Identitäten und Datenbeziehungen werden vor der Änderung erfasst. Eine ähnliche Neugestaltung, ein grüner Toolstatus oder ein bestandener Teiltest genügt nicht als Beleg für eine vollständige Übernahme.

Die konkrete Ausführung bleibt verhältnismässig: Eine Textkorrektur benötigt andere Prüfmittel als eine Migration oder eine Änderung produktiver Daten. Die vier Prüffragen gelten in beiden Fällen. Sie verlangen keine vier grossen Testläufe und keine zusätzlichen Freigabeanfragen für bereits autorisierte Arbeit.

## A/S/U und vier unterschiedliche QA-Prüfungen

### A – Audit

Zuerst Auftrag, geltende Vorgaben, Ausgangsstand und Referenzen lesen. Für jede relevante Anforderung festhalten, woher sie stammt und was im Ergebnis gelten muss. Die Referenz kann beispielsweise eine Originalwebsite, eine freigegebene Vorlage, ein Datensatz, ein Vertrag, eine Berechnungsgrundlage oder ein vorhandener Arbeitsablauf sein.

| Prüfung | Frage | Erforderliches Ergebnis |
|---|---|---|
| **V1 – Referenz und Auftrag, vor der Änderung** | Was ist verbindlich, und ist die richtige Originalquelle tatsächlich gelesen oder geprüft worden? | Nachvollziehbare Anforderungen, Quellen, bestehende Autorisierung und identifizierter Ausgangsstand. Unklarheiten sind gekennzeichnet, keine stillen Ersatzannahmen. |
| **V2 – Auswirkungen und Bestand, vor der Änderung** | Was könnte durch diese Änderung verloren gehen, abweichen oder ein anderes System betreffen? | Relevante Funktionen, Inhalte, Abhängigkeiten und Ziele erfasst; Änderung und Erhalt abgegrenzt; passende Nachweise und Rückkehrmöglichkeit bestimmt. |

Vor globalen Änderungen zuerst Bestand, Reichweite, Zielkonten und Wechselwirkungen prüfen. Der Begriff „global“ ersetzt keine Prüfung, welche Systeme tatsächlich zum Auftrag gehören und erreichbar sind.

### S – Strategie

Aus den Anforderungen entsteht ein kurzer Projekt- beziehungsweise Änderungsvertrag: erwartetes Ergebnis, zulässige Änderungen, zu erhaltende Eigenschaften, tatsächliches Ziel und Prüfmittel. Nicht jeder Punkt muss für jedes Projekt gelten. Ausgelassene relevante Prüffelder brauchen eine konkrete Begründung.

Die Umsetzung darf eine Referenz oder einen erwarteten Testwert nicht ändern, nur damit ein abweichendes Ergebnis erfolgreich erscheint. Eine tatsächlich vom Nutzer autorisierte neue Anforderung darf umgesetzt werden; Quelle, Umfang und betroffene Nachweise werden dabei ausdrücklich aktualisiert. Eine Genehmigung darf nicht erfunden, verallgemeinert oder durch eine technische Ausnahmeliste ersetzt werden.

### U – Umsetzung

Die autorisierten Änderungen ausführen und am fertigen Kandidaten prüfen. Nach der tatsächlichen Auslieferung das reale Ziel erneut überprüfen. Ein Code-Review ersetzt keine erforderliche Darstellungskontrolle, ein lokaler Lauf keine erforderliche Prüfung des ausgelieferten Systems und eine Simulation keinen erforderlichen realen Zustellungsnachweis.

| Prüfung | Zeitpunkt und Frage | Erforderliches Ergebnis |
|---|---|---|
| **N1 – Fertiger Kandidat** | Nach der Umsetzung, vor einer Veröffentlichung oder endgültigen Auslieferung: Erfüllt genau dieser Kandidat den Vertrag? | Passende Inhalts-, Funktions-, Darstellungs- und Integritätsnachweise für die konkrete Revision. Relevante Abweichungen sind behoben oder entsprechend einer tatsächlich autorisierten Anforderungsänderung neu bewertet. |
| **N2 – Tatsächliches Ergebnis** | Nach der Auslieferung: Ist genau der geprüfte Stand am richtigen Ort angekommen, und funktioniert der betroffene Ablauf dort? | Ziel und Version geprüft; öffentliche Seite, ausgelieferte Datei oder tatsächlicher Datensatz gelesen beziehungsweise überprüft; wesentliche Unterschiede zum Kandidaten ausgeschlossen oder behoben. |

V1, V2, N1 und N2 sind unterschiedliche Prüfungen. Derselbe Testlauf zweimal ausgeführt erfüllt nicht automatisch zwei QA-Anforderungen. Bei erheblicher Auswirkung ist eine zweite fachliche Perspektive einzubeziehen, soweit verfügbar. Wer geprüft hat, wird korrekt als Mensch oder Agent angegeben. Mehrere Prüfungen desselben Bearbeiters dürfen nicht als unabhängige menschliche Freigaben bezeichnet werden.

## Nachweisformat

Jeder relevante Nachweis verbindet **Anforderung, Erwartung, Beobachtung, Quelle, Prüfer, Zeit, Revision und Ziel**. Ergebnis und Ausführungsart werden getrennt angegeben:

| Ergebnis | Bedeutung |
|---|---|
| `PASS` | Die konkrete Erwartung wurde mit dem angegebenen Prüfmittel erfüllt. |
| `FAIL` | Eine geprüfte Erwartung wurde nicht erfüllt. |
| `BLOCKED` | Ein konkretes Zugriffs-, Werkzeug- oder anderes Hindernis verhindert die Prüfung. Das Hindernis wird benannt. |
| `UNVERIFIED` | Die Aussage wurde noch nicht ausreichend geprüft, einschliesslich noch nicht ausgeführter Prüfungen. |
| `N/A` | Die Prüfung ist für diese Änderung nicht anwendbar; eine konkrete Begründung ist Pflicht. |

| Ausführungsart | Aussageumfang |
|---|---|
| `LIVE` | Tatsächliches Zielsystem oder tatsächlich ausgeliefertes Ergebnis geprüft. |
| `LOCAL` | Lokaler beziehungsweise isolierter Kandidat geprüft. |
| `MOCKED` | Antworten, Schnittstellen oder Wirkungen wurden simuliert. |
| `STATIC` | Quelltext, Konfiguration oder Dokumentation gelesen beziehungsweise statisch geprüft. |
| `HISTORICAL` | Ein früherer Nachweis wurde herangezogen; er bestätigt keinen neuen erfolgreichen Durchlauf. |

`PASS / MOCKED` ist ein gültiger Nachweis für einen getesteten simulierten Ablauf. Er ist kein `PASS / LIVE` für dessen externe Wirkung. Bei einer Prüfung mit mehreren Arten werden die Teilnachweise getrennt festgehalten. Ein nicht ausgeführter Test erhält kein vorsorgliches `PASS`.

Für Software gehören zum Zielnachweis mindestens Repository, exakter Commit, Projekt und Auslieferungsziel; je nach Plattform zusätzlich Root Directory, Deployment-ID und Domain. Für Dateien beziehungsweise Datenänderungen werden die entsprechende Revision, Datei-/Datensatzkennung und das Zielkonto festgehalten. Ein allgemeines „Ready“ oder ein fremdes grünes Projekt-Badge reicht nicht.

Ändert sich der Kandidat nach einer Prüfung, sind die betroffenen Nachweise ungültig, bis die geänderten Bereiche erneut geprüft wurden. Unberührte Nachweise dürfen nur mit nachvollziehbarer Begründung weitergelten. Fehlversuche bleiben dokumentiert; eine erfolgreiche Nachprüfung erhält einen eigenen Bezug auf den korrigierten Stand.

## Freigabe, Autorisierung und Abschluss

Vor einer autorisierten Veröffentlichung müssen V1, V2 und N1 die dafür relevanten Anforderungen nachweisen. Für N2 muss bereits ein konkreter Plan mit Ziel, Prüfung, Verantwortlichkeit und Fehlerreaktion vorliegen. Anforderungen vor der Veröffentlichung und Nachweise für den anschliessenden Abschluss werden getrennt geführt; ein bereits bestandenes N2 wird vor der erstmaligen Auslieferung nicht vorausgesetzt. Eine erforderliche fehlende Prüfung wird nicht durch Zeitdruck, allgemeine Testzahlen oder ein Tool-Erfolgssignal ersetzt. Den fehlenden Nachweis selbst beschaffen, soweit möglich; andernfalls das konkrete Hindernis und die verbleibende Grenze offen benennen.

Bereits erteilte Autorisierung und bekannte Präferenzen gelten weiter. Reversible, notwendige oder bereits beauftragte Schritte werden ohne wiederholte Erlaubnisfrage ausgeführt. Bei einem neuen, nicht autorisierten Schritt mit erheblicher Aussenwirkung zuerst den konkreten prüfbaren Stand vorbereiten und nur die tatsächlich fehlende Entscheidung klären. Dieses Regelwerk erzeugt keinen zusätzlichen pauschalen Freigabevorbehalt.

Echte E-Mails oder andere Nachrichten an Dritte werden nur bei ausdrücklicher entsprechender Autorisierung versendet. Eine Formularsimulation oder eine ungültige API-Testanfrage darf nicht versehentlich produktive Nachrichten oder Datensätze erzeugen. Ist ein erforderlicher realer Versand nicht autorisiert, bleibt dieser Nachweis offen; ein simulierter Erfolg darf ihn nicht ersetzen.

Der Abschluss erfolgt nach N2 mit belegtem Ergebnis und klar benannten verbleibenden Prüfgrenzen. Schlägt N2 fehl, wird die autorisierte Fehlerbehebung beziehungsweise die geeignete Rückkehr zum geprüften Stand weitergeführt. „Fertig“ darf sich nicht allein auf den lokalen Kandidaten beziehen, wenn eine tatsächliche Auslieferung beauftragt war.

## Beispiele für unterschiedliche Arbeitsarten

| Arbeitsart | V1/V2: Bestand und Auswirkungen | N1/N2: Kandidat und Ergebnis |
|---|---|---|
| Website oder Anwendung | Eigene Originalmarke, Komponenten, Funktionen, URLs, Datenflüsse und Zielprojekt erfassen. | Relevante Browser-/Darstellungs- und Funktionstests; richtige Version auf der tatsächlichen Domain prüfen. |
| Dokument oder Präsentation | Autorisierte Inhalte, Quellen, Vorlage, Schriftarten und Ausgabeformat erfassen. | Inhalt und gerenderte Seiten prüfen; tatsächlich ausgelieferte Datei auf Vollständigkeit und Darstellung kontrollieren. |
| CRM oder andere Datensätze | Richtige Identitäten, Ausgangswerte, Feldzuordnung, Beziehungen und Änderungsumfang prüfen. | Gezielte Änderung validieren; betroffene Datensätze und Beziehungen nach dem Schreiben im richtigen Konto zurücklesen. |
| Berechnung oder Analyse | Datenquelle, Datum, Einheiten, Definitionen und Annahmen festhalten. | Wesentliche Ergebnisse unabhängig nachrechnen oder mit geeigneten Grenzfällen prüfen; Formeln und Werte im tatsächlich gelieferten Ergebnis kontrollieren. |

## Regeltext und technische Durchsetzung

Versionierte Anweisungen und Projektverträge machen Anforderungen sichtbar. Automatisierte Prüfungen können konkrete Abweichungen erkennen. Eine durchsetzbare Merge- oder Deploy-Sperre entsteht erst, wenn der jeweilige Provider die richtigen Prüfungen für die richtige Revision verbindlich verlangt und die tatsächlichen Berechtigungen dazu passen.

Diese Ebenen werden separat dokumentiert. Eine vorhandene Workflow-Datei beweist nicht, dass sie lief; ein erfolgreicher Lauf beweist nicht, dass er erforderlich war; ein erforderlicher Check beweist nicht, dass ein anderer Veröffentlichungsweg gesperrt ist. Solange die Providerkonfiguration nicht überprüft ist, lautet ihr Durchsetzungsstatus `UNVERIFIED`. Dieses Dokument selbst konfiguriert keine Providerregel.

Der Standard soll unbemerkte Anforderungsverluste verhindern und verbleibende Lücken sichtbar machen. Er gibt keine absolute Garantie über alle zukünftigen Projekte, Menschen, Agenten und Werkzeuge. Seine Anwendung und technische Durchsetzung werden für den jeweiligen Arbeitsbereich konkret nachgewiesen.
