# L&P Karriereportal – dedizierte App

**Hauptseite**: GitHub `moritzlengacher-oss/lengacher-partner-website`, Vercel `ic`, Domain `www.lengacher-partner.ch`.

**Karriereplattform**: GitHub `moritzlengacher-oss/SDR-Recruiting`, Root Directory `karriere`, eigenes Vercel-Projekt `lp-karriere`, Domain `jobs.lengacher-partner.ch`.

Die bestehende SDR-Landingpage im Root von `SDR-Recruiting` bleibt unangetastet. Der neue Karriereprojekt-Root enthält 21 Stellen (je eigenständige HTML-Seite), CSS/JS, `api/career-application.js`, `vercel.json` sowie diese Doku.

Alle Bewerbungsdaten werden vom eigenen Backend nur bei erfolgreicher serverseitiger Validierung an den bestehenden L&P-ATS-Endpunkt auf `www.lengacher-partner.ch` weitergeleitet. Die Nutzung des bestehenden L&P-Datenspeichers ist bewusst zentralisiert; es gibt keine separate Schatten-Datenbank. Der Relay-Endpunkt darf niemals Erfolg melden, wenn die ursprüngliche L&P-API nicht `ok: true` bestätigt.

**QA**: 21 Seiten, Filter und Suche, Formularfelder, PDF 2 MB, Checkbox ohne Vorauswahl, 400 bei fehlenden Angaben, 403 bei fremdem Origin, Upstream-Fehlerbehandlung, echte kontrollierte Testbewerbung, E-Mail-/CRM-Quittung, SEO, Mobilansicht, HSTS und Rollback.

**Release Guard**: Vor der produktiven Umstellung müssen Domain-Zuordnung, 21 Detailseiten, Formular-End-to-End und Verfügbarkeit nachweislich grün sein.
