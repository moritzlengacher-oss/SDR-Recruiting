# L&P Karriereportal – dedizierte App

**Hauptseite**: GitHub `moritzlengacher-oss/lengacher-partner-website`, Vercel `ic`, Domain `www.lengacher-partner.ch`.

**Karriereplattform**: GitHub `moritzlengacher-oss/SDR-Recruiting`, Root Directory `karriere`, eigenes Vercel-Projekt `lp-karriere`, Domain `jobs.lengacher-partner.ch`.

Die bestehende SDR-Landingpage im Root von `SDR-Recruiting` bleibt unangetastet. Der neue Karriereprojekt-Root enthält 21 Stellen (je eigenständige HTML-Seite), CSS/JS, `api/career-application.js`, `vercel.json` sowie diese Doku.

Alle Bewerbungsdaten werden vom eigenen Backend nur bei erfolgreicher serverseitiger Validierung an den bestehenden L&P-ATS-Endpunkt auf `www.lengacher-partner.ch` weitergeleitet. Die Nutzung des bestehenden L&P-Datenspeichers ist bewusst zentralisiert; es gibt keine separate Schatten-Datenbank. Der Relay-Endpunkt darf niemals Erfolg melden, wenn die ursprüngliche L&P-API nicht `ok: true` bestätigt.

**QA**: 21 Seiten, Filter und Suche, Formularfelder, PDF 2 MB, Checkbox ohne Vorauswahl, 400 bei fehlenden Angaben, 403 bei fremdem Origin, Upstream-Fehlerbehandlung, echte kontrollierte Testbewerbung, E-Mail-/CRM-Quittung, SEO, Mobilansicht, HSTS und Rollback.

**Release Guard**: Vor der produktiven Umstellung müssen Domain-Zuordnung, 21 Detailseiten, Formular-End-to-End und Verfügbarkeit nachweislich grün sein.


## Original L&P branding (27.10.2026)

`node karriere/build.mjs` (repository root) generates `karriere/public` from the 22 source pages. Vercel uses project root `karriere`, build command `node build.mjs`, output `public`. The application API remains in `karriere/api`.

Shared `brand/header.html`, `brand/footer.html` and `brand/search.html` contain the original website shell. Links to the main corporate website are absolute; career links stay on the jobs host. `brand/original-assets.b64` is a gzip-compressed JSON map of base64 asset bytes captured from the live corporate website on 27.10.2026. `brand/source-manifest.json` records origin, sizes and SHA-256 hashes. The build verifies all original logo, favicon, CSS and six font files before copying them. No external downloads are needed at build or runtime. Font families: Cormorant Garamond and DM Mono. Core palette: paper #f5f2ec, ink #0d0d0d, gold #b8975a, navy #1a2744.

`karriere/assets/styles.css` scopes career content under `.lp-career`; it does not replace the corporate navigation or footer styles. `brand-shell.js` restores corporate menu controls and an accessible local search overlay. The career application script preserves the existing relay endpoint and adds legacy location/level filtering, reset, quick role selection and the `#quick-apply` deep link.

Run the complete regression checks from the repository root:

```sh
node karriere/build.mjs
node --test karriere/qa.test.mjs karriere/brand-guard.test.mjs tests/lp-karriere-release-guard.test.mjs
```

The additional brand guard checks original asset hashes, the shared shell on all 22 pages, local link/asset resolution, original typography/palette and restored career discovery controls. Browser QA must also cover mobile and desktop navigation, search, filters, form validation and readable layouts. Mocked browser submissions validate client behavior without creating real candidate records or sending email; they are not proof of fresh CRM/email delivery.
