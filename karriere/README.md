# L&P Karriereportal – dedizierte App

**Hauptseite**: GitHub `moritzlengacher-oss/lengacher-partner-website`, Vercel `ic`, Domain `www.lengacher-partner.ch`.

**Karriereplattform**: GitHub `moritzlengacher-oss/SDR-Recruiting`, Root Directory `karriere`, eigenes Vercel-Projekt `lp-karriere` (`prj_aai674bWi0ZXbmKh2ocCCRuSSv5o`). `jobs-app.lengacher-partner.ch` liefert diese App aus; die öffentliche Domain `jobs.lengacher-partner.ch` erreicht sie über den bestehenden Host-Proxy des Hauptprojekts `ic`.

Die bestehende SDR-Landingpage im Root von `SDR-Recruiting` bleibt unangetastet. Der neue Karriereprojekt-Root enthält 21 Stellen (je eigenständige HTML-Seite), CSS/JS, `api/career-application.js`, `vercel.json` sowie diese Doku.

Alle produktiven Bewerbungsdaten werden vom eigenen Backend nur bei erfolgreicher serverseitiger Validierung an den bestehenden L&P-ATS-Endpunkt auf `www.lengacher-partner.ch` weitergeleitet. Die Nutzung des bestehenden L&P-Datenspeichers ist bewusst zentralisiert; es gibt keine separate Schatten-Datenbank. Der Relay-Endpunkt darf niemals Erfolg melden, wenn die ursprüngliche L&P-API nicht `ok: true` bestätigt. Bei `VERCEL_ENV=preview` werden gültige Bewerbungen vor jeder Weiterleitung mit HTTP 503 und einer eindeutigen QA-Meldung blockiert.

**QA**: Übersicht und 21 Detailseiten, Filter und Suche, Formularfelder, PDF 2 MiB, Checkbox ohne Vorauswahl, 400 bei fehlenden Angaben, 403 bei fremdem Origin, Upstream-Fehlerbehandlung, SEO, Mobilansicht, HSTS und Rollback. Reale Testbewerbungen, E-Mails und CRM-Schreibvorgänge nur bei entsprechender ausdrücklicher Autorisierung. Mock-Ergebnisse und historische Zustellungsnachweise sind kein neuer Live-Nachweis.

**Release Guard**: Jede Änderung an exakten Commit und Zielprojekt binden. Vor Veröffentlichung V1, V2 und N1 gegen den Änderungsumfang prüfen; nach Veröffentlichung N2 an der öffentlichen Domain durchführen. Den bestehenden Deployment-Stand für eine Rückkehr festhalten. Fehlende Prüfungen ausdrücklich offen ausweisen.


## Original L&P branding (27.10.2026)

`node karriere/build.mjs` (repository root) generates `karriere/public` from the 22 source pages. Vercel uses project root `karriere`, build command `node build.mjs`, output `public`. The application API remains in `karriere/api`.

Shared `brand/head.html`, `brand/header.html`, `brand/footer.html` and `brand/search.html` contain the verified website branding and shell. Links to the main corporate website are absolute; career links stay on the jobs host. `brand/original-assets.b64` is a gzip-compressed JSON map of base64 asset bytes captured from the live corporate website on 27.10.2026. `brand/source-manifest.json` records origin, sizes and SHA-256 hashes for 20 original assets, including the logo, favicon/platform package, social image, CSS and six fonts. The build verifies the assets before copying them; it needs no external downloads. The shared head explicitly references the main website's original 180px icon. Font families: Cormorant Garamond and DM Mono. Core palette: paper #f5f2ec, ink #0d0d0d, gold #b8975a, navy #1a2744.

`karriere/assets/styles.css` scopes career content under `.lp-career`; it does not replace the corporate navigation or footer styles. `brand-shell.js` restores corporate menu controls and an accessible search overlay. Static corporate content and all career pages are available first. The GET-only `/api/career-search` relay supplements published articles from the main website's fixed public search endpoint; a failure leaves the static search available. The career application script preserves the production relay contract and location/level filtering, reset, quick role selection and the `#quick-apply` deep link.

The build derives complete `JobPosting.description` content and employment type from each visible job advert. Existing employer wording and publication dates are preserved. Social metadata uses the verified original image and each page's title/description. `qa-preview.mjs` adds 320px/390px fixtures only for preview builds; production builds remove them. The preview API guard remains effective after navigating away from a fixture.

Run the complete regression checks from the repository root:

```sh
npm --prefix karriere test
```

The additional brand guard checks original asset hashes, the shared shell on all 22 pages, local link/asset resolution, original typography/palette and restored career discovery controls. Browser QA must also cover mobile and desktop navigation, search, filters, form validation and readable layouts. Mocked browser submissions validate client behavior without creating real candidate records or sending email; they are not proof of fresh CRM/email delivery.
