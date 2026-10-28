import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

// This runner never contacts a production service. The browser is allowed to
// read only the generated local site. Every application POST is intercepted.
const appRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.dirname(appRoot);
const publicRoot = path.join(appRoot, 'public');
const outputRoot = path.resolve(process.env.QA_OUTPUT_DIR || path.join(appRoot, 'qa-output', 'browser'));
const require = createRequire(import.meta.url);
const startedAt = new Date().toISOString();
const checks = [];
const screenshots = [];
const browserErrors = [];
const resourceErrors = [];
const blockedRequests = [];
const applicationRequests = [];
const checkedDetails = [];
let browser;
let context;
let page;
let server;
let origin;
let buildDigest;
let fatalError;
let browserVersion;
let dependencyVersions;
let mockResponse = { status: 503, body: { ok: false, message: 'QA: simulated upstream failure' } };

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function observedCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function packageRoot(name) {
  let directory = path.dirname(require.resolve(name));
  for (;;) {
    const candidate = path.join(directory, 'package.json');
    if (fsSync.existsSync(candidate)) {
      const metadata = JSON.parse(fsSync.readFileSync(candidate, 'utf8'));
      if (metadata.name === name) return { directory, metadata };
    }
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error('Cannot locate package metadata: ' + name);
    directory = parent;
  }
}

async function listFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(target));
    else if (entry.isFile()) files.push(target);
  }
  return files.sort();
}

async function digestBuild() {
  const files = await listFiles(publicRoot);
  const records = [];
  for (const file of files) {
    records.push({
      path: path.relative(publicRoot, file).split(path.sep).join('/'),
      sha256: sha256(await fs.readFile(file)),
    });
  }
  return { sha256: sha256(JSON.stringify(records)), files: records };
}

async function loadCatalog() {
  const details = [];
  const sourceRoot = path.join(appRoot, 'karriere');
  for (const entry of await fs.readdir(sourceRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'assets') continue;
    const file = path.join(sourceRoot, entry.name, 'index.html');
    if (!fsSync.existsSync(file)) continue;
    const html = await fs.readFile(file, 'utf8');
    const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)];
    const schema = scripts.map(match => JSON.parse(match[1])).find(item => item['@type'] === 'JobPosting');
    assert.ok(schema, 'Missing JobPosting in ' + file);
    assert.ok(schema.title && schema.description, 'Incomplete JobPosting in ' + file);
    details.push({ slug: entry.name, title: schema.title, schema, pathname: '/karriere/' + entry.name });
  }
  details.sort((a, b) => a.pathname.localeCompare(b.pathname));
  assert.ok(details.length > 0, 'No career detail pages found');
  assert.equal(new Set(details.map(item => item.title)).size, details.length, 'Duplicate job title');
  return details;
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

async function startServer() {
  const configuration = JSON.parse(await fs.readFile(path.join(appRoot, 'vercel.json'), 'utf8'));
  const commonHeaders = (configuration.headers || [])
    .filter(rule => rule.source === '/(.*)')
    .flatMap(rule => rule.headers || []);
  server = http.createServer(async (request, response) => {
    try {
      for (const header of commonHeaders) response.setHeader(header.key, header.value);
      response.setHeader('Cache-Control', 'no-store');
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405).end('QA server is read-only');
        return;
      }
      const requested = new URL(request.url, 'http://localhost').pathname;
      let target = path.resolve(publicRoot, '.' + decodeURIComponent(requested));
      if (target !== publicRoot && !target.startsWith(publicRoot + path.sep)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      let stat;
      try { stat = await fs.stat(target); } catch { /* handled below */ }
      if (stat?.isDirectory()) target = path.join(target, 'index.html');
      else if (!stat && !path.extname(target)) target += '.html';
      let bytes;
      try { bytes = await fs.readFile(target); } catch {
        response.writeHead(404).end('Not found');
        return;
      }
      response.setHeader('Content-Type', contentTypes[path.extname(target)] || 'application/octet-stream');
      response.writeHead(200);
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      response.writeHead(500).end('QA fixture server error');
      resourceErrors.push({ kind: 'fixture-server', message: error.message });
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '0.0.0.0', resolve);
  });
  origin = 'http://localhost:' + server.address().port;
}

async function startBrowser() {
  const playwright = await import('playwright-core');
  const chromium = (await import('@sparticuz/chromium')).default;
  const chromiumPackage = packageRoot('@sparticuz/chromium');
  const playwrightPackage = packageRoot('playwright-core');
  dependencyVersions = {
    playwrightCore: playwrightPackage.metadata.version,
    chromiumPackage: chromiumPackage.metadata.version,
  };
  const override = process.env.CHROMIUM_EXECUTABLE_PATH;
  if (!override && process.platform !== 'linux') {
    throw new Error('Set CHROMIUM_EXECUTABLE_PATH when running browser QA outside Linux.');
  }
  if (!override && process.platform === 'linux') {
    // The package ships the NSS/NSPR libraries needed in minimal Linux runners.
    // Load its own pinned extraction helper, without changing HOME.
    const archive = path.join(chromiumPackage.directory, 'bin', 'al2023.tar.br');
    if (fsSync.existsSync(archive)) {
      const { inflate } = await import(pathToFileURL(path.join(chromiumPackage.directory, 'build', 'lambdafs.js')).href);
      await inflate(archive);
      const libraryPath = path.join(os.tmpdir(), 'al2023', 'lib');
      process.env.LD_LIBRARY_PATH = [libraryPath, process.env.LD_LIBRARY_PATH].filter(Boolean).join(path.delimiter);
    }
    process.env.FONTCONFIG_PATH ??= path.join(os.tmpdir(), 'fonts');
  }
  browser = await playwright.chromium.launch({
    executablePath: override || await chromium.executablePath(),
    args: override ? [] : chromium.args,
    headless: true,
    timeout: 30000,
  });
  browserVersion = browser.version();
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });

  // Install interception before any page is opened. No state-changing request
  // can leave this browser, even if the application code changes later.
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === 'POST' && url.origin === origin && url.pathname === '/api/career-application') {
      try {
        applicationRequests.push(request.postDataJSON());
        const answer = mockResponse;
        await route.fulfill({ status: answer.status, contentType: 'application/json', body: JSON.stringify(answer.body) });
      } catch (error) {
        browserErrors.push({ kind: 'mock-handler', message: error.message });
        await route.abort('blockedbyclient');
      }
      return;
    }
    if (url.origin !== origin || !['GET', 'HEAD'].includes(method)) {
      blockedRequests.push({ method, url: request.url() });
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  if (context.routeWebSocket) {
    await context.routeWebSocket('**/*', socket => {
      blockedRequests.push({ method: 'WEBSOCKET', url: socket.url() });
      socket.close();
    });
  }

  // One page/context throughout: serverless Chromium uses single-process mode.
  page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => browserErrors.push({ url: page.url(), message: error.message }));
  page.on('response', response => {
    if (response.status() >= 400 && new URL(response.url()).pathname !== '/api/career-application') {
      resourceErrors.push({ url: response.url(), status: response.status() });
    }
  });
  page.on('requestfailed', request => {
    if (new URL(request.url()).pathname !== '/api/career-application') {
      resourceErrors.push({ url: request.url(), failure: request.failure()?.errorText || 'failed' });
    }
  });
  context.on('page', popup => {
    if (popup !== page) {
      blockedRequests.push({ method: 'POPUP', url: popup.url() });
      void popup.close();
    }
  });
}

async function screenshot(name) {
  const relative = 'screenshots/' + name.replace(/[^a-z0-9_-]/gi, '-').toLowerCase() + '.png';
  const file = path.join(outputRoot, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, animations: 'disabled', fullPage: false, timeout: 10000 });
  screenshots.push({ file: relative, sha256: sha256(await fs.readFile(file)), url: page.url(), viewport: page.viewportSize() });
}

async function check(name, run) {
  const began = Date.now();
  let entry;
  try {
    await run();
    entry = { name, passed: true, durationMs: Date.now() - began };
  } catch (error) {
    entry = { name, passed: false, durationMs: Date.now() - began, error: error.stack || String(error) };
    try { await screenshot('failure-' + (checks.length + 1) + '-' + name); } catch { /* original failure is retained */ }
  }
  checks.push(entry);
  console.log((entry.passed ? 'PASS ' : 'FAIL ') + name);
  return entry.passed;
}

async function navigate(pathname = '/karriere') {
  const response = await page.goto(origin + pathname, { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200, 'Navigation failed: ' + pathname);
  assert.equal(new URL(page.url()).pathname, pathname.split('?')[0], 'Unexpected navigation target');
  await page.locator('#application').waitFor({ state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1436, 996).catch(() => {});
}

async function click(locator, options = {}) {
  await locator.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await locator.click(options);
}

async function submitApplication() {
  // The submit handler prevents navigation and returns an in-page result.
  // Keep Playwright's actionability checks, but await the specific form status
  // and request assertions below instead of its incidental navigation barrier.
  await click(page.locator('#application .submit'), { noWaitAfter: true });
}

async function statusIs(state, includes) {
  await page.waitForFunction(({ state, includes }) => {
    const element = document.querySelector('.form-status');
    return element?.dataset.state === state && element.textContent.includes(includes);
  }, { state, includes });
}

function contrastRatio(foreground, background) {
  const luminance = value => {
    const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    assert.equal(channels?.length, 3, 'Unexpected computed color: ' + value);
    const [r, g, b] = channels.map(channel => {
      const s = channel / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function actualFonts(selector) {
  const session = await context.newCDPSession(page);
  try {
    await session.send('DOM.enable');
    await session.send('CSS.enable');
    const { root } = await session.send('DOM.getDocument');
    const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    assert.ok(nodeId, 'Font target missing: ' + selector);
    const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
    return fonts.filter(font => font.glyphCount > 0).map(font => font.familyName);
  } finally {
    await session.detach();
  }
}

async function runSuite(catalog) {
  await navigate();
  const cards = await page.locator('.job-card').evaluateAll(elements => elements.map(element => ({
    title: element.querySelector('h3').textContent.trim(),
    href: element.querySelector('h3 a').getAttribute('href'),
    category: element.dataset.category,
    location: element.dataset.location,
    level: element.dataset.level,
    quickRole: element.querySelector('[data-quick-role]')?.dataset.quickRole,
  })));
  const visibleTitles = async () => (await page.locator('.job-card:visible h3').allTextContents()).map(s => s.trim()).sort();
  const expectedTitles = filtered => filtered.map(item => item.title).sort();

  await check('Browser form exposes complete autofill metadata', async () => {
    assert.equal(await page.locator('#application').getAttribute('autocomplete'),'on');
    const expected={name:'name',email:'email',phone:'tel',residence:'address-level2',career_role:'on',workload:'on',earliest_start:'on',linkedin:'on',message:'on'};
    for(const [name,token] of Object.entries(expected))assert.equal(await page.locator('[name="'+name+'"]').getAttribute('autocomplete'),token,name);
  });
  await check('Autofill preserves manual privacy consent and file upload', async () => {
    assert.equal(await page.locator('[name=website]').getAttribute('autocomplete'),'off');
    assert.equal(await page.locator('[name=privacy_consent]').isChecked(),false);
    assert.equal(await page.locator('[name=privacy_consent]').getAttribute('autocomplete'),null);
    assert.equal(await page.locator('[name=resumePdfFile]').getAttribute('autocomplete'),null);
    assert.equal(await page.locator('[name=resumePdfFile]').getAttribute('type'),'file');
  });

  await check('Catalog, role options and generated search preserve every job', async () => {
    assert.equal(cards.length, catalog.length);
    assert.deepEqual(cards.map(item => item.href).sort(), catalog.map(item => item.pathname).sort());
    assert.equal(new Set(cards.map(item => item.href)).size, catalog.length);
    for (const card of cards) assert.equal(card.quickRole, card.title, card.title);
    const options = await page.locator('[name=career_role] option').evaluateAll(elements => elements.map(element => element.value));
    assert.ok(options.includes('Initiativbewerbung'));
    for (const job of catalog) assert.ok(options.includes(job.title), job.title);
    const index = await page.evaluate(async () => {
      const response = await fetch('/karriere/assets/jobs-search.json');
      if (!response.ok) throw new Error('Career search index is unavailable');
      return response.json();
    });
    assert.equal(index.length, catalog.length + 1);
    assert.deepEqual(index.filter(item => item.type === 'Stelle').map(item => item.url).sort(), catalog.map(item => item.pathname).sort());
  });

  await check('Visible original logo, actual original fonts and palette', async () => {
    const logo = page.locator('.site-nav img[src="/assets/lengacher-partner-logo.webp"]');
    assert.equal(await logo.isVisible(), true);
    const state = await page.evaluate(() => {
      const image = document.querySelector('.site-nav img[src="/assets/lengacher-partner-logo.webp"]');
      const box = image.getBoundingClientRect();
      const root = getComputedStyle(document.documentElement);
      return {
        loaded: image.complete && image.naturalWidth > 0,
        opacity: Number(getComputedStyle(image).opacity),
        logoInViewport: box.width > 20 && box.height > 20 && box.top >= 0 && box.right <= innerWidth,
        h1: getComputedStyle(document.querySelector('h1')).fontFamily,
        mono: getComputedStyle(document.querySelector('.filter')).fontFamily,
        hero: getComputedStyle(document.querySelector('.lp-jobs-hero')).backgroundColor,
        apply: getComputedStyle(document.querySelector('.lp-jobs-apply-section')).backgroundColor,
        gold: root.getPropertyValue('--gold').trim().toLowerCase(),
      };
    });
    assert.ok(state.loaded && state.opacity > 0.9 && state.logoInViewport);
    assert.match(state.h1, /Cormorant Garamond/);
    assert.match(state.mono, /DM Mono/);
    assert.equal(state.hero, 'rgb(245, 242, 236)');
    assert.equal(state.apply, 'rgb(26, 39, 68)');
    // Approved original CSS cc1695e26d8bf1d6e330ff196be263a8616a45470c804ad71d2558d4cb5de71e
    // overrides its earlier #b8975a token with #76591f in the sitewide WCAG AA
    // text-token block. Assert the effective original cascade, not its first declaration.
    assert.equal(state.gold, '#76591f');
    assert.ok((await actualFonts('h1')).some(name => /Cormorant.*Garamond/i.test(name)), 'Heading used a fallback font');
    assert.ok((await actualFonts('.filter')).some(name => /DM\s*Mono/i.test(name)), 'Controls used a fallback font');
  });

  await check('Primary action contrast and full-width content geometry', async () => {
    const metrics = await page.evaluate(() => ({
      viewport: innerWidth,
      heroWidth: document.querySelector('.lp-jobs-hero-layout').getBoundingClientRect().width,
      applyWidth: document.querySelector('.lp-jobs-apply-wrap').getBoundingClientRect().width,
      actions: [...document.querySelectorAll('.lp-career .btn-primary')].map(element => {
        const s = getComputedStyle(element);
        return { label: element.textContent.trim(), color: s.color, background: s.backgroundColor, width: element.getBoundingClientRect().width };
      }),
    }));
    assert.ok(metrics.heroWidth >= metrics.viewport * 0.75, 'Hero collapsed into a legacy grid column');
    assert.ok(metrics.applyWidth >= metrics.viewport * 0.75, 'Application collapsed into a legacy grid column');
    assert.ok(metrics.actions.length > 0);
    for (const action of metrics.actions) {
      assert.ok(action.width > 0 && action.label.length > 0);
      assert.ok(contrastRatio(action.color, action.background) >= 4.5, 'Unreadable primary action: ' + action.label);
    }
  });

  await check('Complete header and footer retain navigation and contact destinations', async () => {
    for (const text of ['Leistungen', 'Branchen', 'Pilotlösungen', 'Wissen', 'Über uns', 'Kontakt']) {
      assert.ok((await page.locator('.site-nav').textContent()).includes(text), text);
    }
    for (const href of ['/impressum', '/datenschutz', '/agb']) {
      assert.ok(await page.locator('footer a[href$="' + href + '"]').count(), href);
    }
    assert.ok(await page.locator('footer a[href="tel:+41772658807"]').count());
    assert.ok(await page.locator('footer a[href="mailto:info@lengacher-partner.ch"]').count());
    for (const selector of ['.footer-social-linkedin', '.footer-social-instagram', '.footer-social-x']) {
      assert.equal(await page.locator(selector).isVisible(), true, selector);
    }
    const text = await page.locator('footer').textContent();
    for (const required of ['CHE-113.192.820', 'CH-100-4786870-6', 'Ritterstrasse 16']) assert.ok(text.includes(required));
  });

  await check('Desktop dropdown opens and closes with Escape', async () => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const item = page.locator('.site-nav .has-dropdown').first();
    await item.hover();
    await page.waitForFunction(() => document.querySelector('.site-nav .has-dropdown').classList.contains('nav-dropdown-open'));
    assert.equal(await item.locator('.nav-dropdown-toggle').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    await page.mouse.move(1436, 996);
    assert.equal(await item.locator('.nav-dropdown-toggle').getAttribute('aria-expanded'), 'false');
  });

  for (const category of [...new Set(cards.map(item => item.category))]) {
    await check('Category filter: ' + category, async () => {
      await click(page.locator('#job-reset'));
      const filter = page.locator('.filter').filter({ hasText: category }).first();
      await click(filter);
      assert.deepEqual(await visibleTitles(), expectedTitles(cards.filter(item => item.category === category)));
      assert.equal(await filter.getAttribute('aria-pressed'), 'true');
    });
  }

  await check('Keyword search, empty state and reset', async () => {
    await click(page.locator('#job-reset'));
    await page.locator('#job-search').fill('SDR');
    assert.deepEqual(await visibleTitles(), expectedTitles(cards.filter(item => item.title.includes('SDR'))));
    await page.locator('#job-search').fill('qa-no-job-with-this-name-719304');
    assert.equal(await page.locator('.job-card:visible').count(), 0);
    assert.equal(await page.locator('#no-results').isVisible(), true);
    await click(page.locator('#job-reset'));
    assert.deepEqual(await visibleTitles(), expectedTitles(cards));
    assert.equal(await page.locator('#job-search').inputValue(), '');
    assert.equal(await page.locator('#job-location').inputValue(), '');
    assert.equal(await page.locator('#job-level').inputValue(), '');
  });

  await check('Location and experience filters combine and reset', async () => {
    await page.locator('#job-location').selectOption('remote');
    assert.deepEqual(await visibleTitles(), expectedTitles(cards.filter(item => /remote/i.test(item.location))));
    const level = cards.find(item => !/remote/i.test(item.location))?.level || cards[0].level;
    await page.locator('#job-level').selectOption(level);
    assert.deepEqual(await visibleTitles(), expectedTitles(cards.filter(item => /remote/i.test(item.location) && item.level === level)));
    await click(page.locator('#job-reset'));
    assert.deepEqual(await visibleTitles(), expectedTitles(cards));
  });

  await check('Website search includes jobs and retains original website content', async () => {
    await page.locator('.nav-search-btn').click();
    await page.locator('#search-input').fill('SDR');
    await page.waitForFunction(() => document.querySelectorAll('.search-result').length > 0);
    assert.ok((await page.locator('.search-result').allTextContents()).some(text => text.includes('Sales Development')));
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.search-result:last-child')), true);
    await page.locator('#search-input').fill('VoxFlow');
    await page.waitForFunction(() => [...document.querySelectorAll('.search-result')].some(element => element.textContent.includes('VoxFlow')));
    const urls = await page.locator('.search-result').evaluateAll(elements => elements.map(element => element.href));
    assert.ok(urls.some(url => url.startsWith('https://www.lengacher-partner.ch/')));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#search-overlay').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('nav-search-btn')), true);
  });

  await check('FAQ works and the removed calendar-booking link is absent', async () => {
    const details = page.locator('.lp-jobs-faq details').first();
    await click(details.locator('summary'));
    assert.equal(await details.getAttribute('open'), '');
    await click(details.locator('summary'));
    assert.equal(await page.locator('a[href="https://crm.lengacher-partner.ch/book/karriere"]').count(), 0);
    assert.equal(await page.locator('.lp-jobs-booking-note').count(), 0);
  });

  for (const width of [1440, 390, 320]) {
    await check('Responsive layout and screenshots at ' + width + 'px', async () => {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await screenshot('overview-' + width);
      await page.locator('#application').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await screenshot('application-' + width);
      await page.locator('footer').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await screenshot('footer-' + width);
    });
  }

  await check('Mobile navigation, submenu and Escape focus restoration', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const toggle = page.locator('.nav-toggle');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await toggle.getAttribute('aria-controls'), await page.locator('.nav-links').getAttribute('id'));
    await page.locator('.nav-dropdown-toggle').first().click();
    assert.equal(await page.locator('.has-dropdown').first().evaluate(element => element.classList.contains('mobile-dropdown-open')), true);
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('nav-toggle')), true);
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await navigate('/karriere?utm_source=quality-gate');
  const targetRole = catalog.find(job => job.title === 'Sales Development Representative (SDR)') || catalog[0];
  await check('Quick Apply selects the intended role and its source offer', async () => {
    const quick = page.locator('[data-quick-role]').filter({ hasText: 'Bewerben' });
    const index = cards.findIndex(item => item.title === targetRole.title);
    assert.ok(index >= 0);
    await click(quick.nth(index));
    assert.equal(await page.locator('[name=career_role]').inputValue(), targetRole.title);
    const offer = await page.locator('[name=source_offer]').inputValue();
    assert.ok(offer.startsWith('career-') && offer !== 'career-initiative');
    if (targetRole.title.includes('(SDR)')) assert.equal(offer, 'career-sdr');
  });

  await page.locator('[name=name]').fill('QA Browser Fixture');
  await page.locator('[name=email]').fill('qa-browser@example.invalid');
  await check('Explicit consent is initially empty and blocks transmission', async () => {
    assert.equal(await page.locator('[name=privacy_consent]').isChecked(), false);
    await submitApplication();
    assert.equal(applicationRequests.length, 0);
    assert.equal(await page.locator('[name=privacy_consent]').evaluate(element => element.validity.valueMissing), true);
  });
  await page.locator('[name=privacy_consent]').check();
  await check('LinkedIn or PDF is required', async () => {
    await submitApplication();
    await statusIs('error', 'LinkedIn-Profil an oder');
    assert.equal(applicationRequests.length, 0);
  });
  await check('Invalid LinkedIn address is rejected before transmission', async () => {
    await page.locator('[name=linkedin]').fill('https://example.invalid/in/qa');
    await submitApplication();
    await statusIs('error', 'gültige LinkedIn');
    assert.equal(applicationRequests.length, 0);
  });
  await page.locator('[name=linkedin]').fill('https://www.linkedin.com/in/qa-browser-fixture');

  await check('Mocked upstream failure preserves inputs and enables retry', async () => {
    await submitApplication();
    await statusIs('error', 'QA: simulated upstream failure');
    assert.equal(applicationRequests.length, 1);
    assert.equal(await page.locator('[name=name]').inputValue(), 'QA Browser Fixture');
    assert.equal(await page.locator('[name=privacy_consent]').isChecked(), true);
    assert.equal(await page.locator('.submit').isDisabled(), false);
    assert.equal(applicationRequests[0].career_role, targetRole.title);
    assert.equal(applicationRequests[0].privacy_consent, true);
    assert.equal(applicationRequests[0].utm_source, 'quality-gate');
    assert.ok(applicationRequests[0].source_url.startsWith(origin + '/karriere?'));
    assert.ok(applicationRequests[0].submission_id);
  });

  await check('HTTP 200 with ok:false is not success and keeps the retry ID', async () => {
    mockResponse = { status: 200, body: { ok: false, message: 'QA: unconfirmed application' } };
    await submitApplication();
    await statusIs('error', 'QA: unconfirmed application');
    assert.equal(applicationRequests.length, 2);
    assert.equal(applicationRequests[1].submission_id, applicationRequests[0].submission_id);
    assert.equal(await page.locator('[name=email]').inputValue(), 'qa-browser@example.invalid');
  });

  await check('Confirmed mocked response resets fields and consent', async () => {
    mockResponse = { status: 200, body: { ok: true, reference: 'QA-MOCK-LINKEDIN' } };
    await submitApplication();
    await statusIs('success', 'QA-MOCK-LINKEDIN');
    assert.equal(applicationRequests.length, 3);
    assert.equal(applicationRequests[2].submission_id, applicationRequests[0].submission_id);
    assert.equal(await page.locator('[name=email]').inputValue(), '');
    assert.equal(await page.locator('[name=privacy_consent]').isChecked(), false);
    assert.equal(await page.locator('[name=submission_id]').inputValue(), '');
  });

  await page.locator('[name=name]').fill('QA PDF Fixture');
  await page.locator('[name=email]').fill('qa-pdf@example.invalid');
  await page.locator('[name=privacy_consent]').check();
  await check('Invalid PDF signature is rejected asynchronously', async () => {
    await page.locator('[name=resumePdfFile]').setInputFiles({ name: 'invalid.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a PDF') });
    await submitApplication();
    await statusIs('error', 'PDF-Signatur');
    assert.equal(applicationRequests.length, 3);
  });
  await check('PDF larger than 2 MB is rejected', async () => {
    await page.locator('[name=resumePdfFile]').setInputFiles({ name: 'oversize.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2 * 1024 * 1024 + 1, 32) });
    await submitApplication();
    await statusIs('error', 'maximal 2 MB');
    assert.equal(applicationRequests.length, 3);
  });
  await check('PDF alternative submits only to the mock and resets after confirmation', async () => {
    mockResponse = { status: 200, body: { ok: true, reference: 'QA-MOCK-PDF' } };
    await page.locator('[name=resumePdfFile]').setInputFiles({ name: 'qa.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% QA fixture only\n%%EOF') });
    await submitApplication();
    await statusIs('success', 'QA-MOCK-PDF');
    assert.equal(applicationRequests.length, 4);
    const sent = applicationRequests.at(-1);
    assert.equal(sent.linkedin, '');
    assert.equal(Buffer.from(sent.resumePdf.data, 'base64').toString().slice(0, 5), '%PDF-');
    assert.notEqual(sent.submission_id, applicationRequests[0].submission_id);
    assert.equal(await page.locator('[name=privacy_consent]').isChecked(), false);
  });

  const offers = new Set();
  for (const job of catalog) {
    await check('Detail page preserves role, schema and shell: ' + job.slug, async () => {
      await navigate(job.pathname);
      assert.equal(await page.locator('[name=career_role]').inputValue(), job.title);
      const offer = await page.locator('[name=source_offer]').inputValue();
      assert.ok(offer.startsWith('career-') && offer !== 'career-initiative', 'Wrong offer for ' + job.title);
      assert.ok(!offers.has(offer), 'Duplicate offer mapping: ' + offer);
      offers.add(offer);
      const schema = await page.locator('script[type="application/ld+json"]').evaluateAll(elements => elements.map(element => JSON.parse(element.textContent)).find(item => item['@type'] === 'JobPosting'));
      assert.equal(schema.title, job.title);
      assert.ok(schema.description);
      assert.equal(new URL(schema.url).pathname, job.pathname);
      assert.equal(new URL(await page.locator('link[rel=canonical]').getAttribute('href')).pathname, job.pathname);
      assert.equal(await page.locator('.site-nav').count(), 1);
      assert.equal(await page.locator('footer').count(), 1);
      assert.equal(await page.locator('#quick-apply').count(), 1);
      assert.equal(await page.locator('[name=privacy_consent]').isChecked(), false);
      assert.equal(await page.locator('a[href="https://crm.lengacher-partner.ch/book/karriere"]').count(), 0);
      assert.equal(await page.locator('.lp-jobs-booking-note').count(), 0);
      await page.setViewportSize({ width: 320, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      checkedDetails.push(job.pathname);
    });
  }

  await check('All details tested; no browser errors, missing assets or outbound requests', async () => {
    assert.equal(checkedDetails.length, catalog.length);
    assert.deepEqual(browserErrors, []);
    assert.deepEqual(resourceErrors, []);
    assert.deepEqual(blockedRequests, []);
  });
}

await fs.mkdir(outputRoot, { recursive: true });
const gitCommit = observedCommit();
const claimedCommit = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null;
try {
  if (gitCommit && claimedCommit) assert.equal(gitCommit, claimedCommit, 'QA commit differs from checked-out commit');
  buildDigest = await digestBuild();
  const catalog = await loadCatalog();
  await startServer();
  await startBrowser();
  await runSuite(catalog);
} catch (error) {
  fatalError = error.stack || String(error);
  console.error(fatalError);
} finally {
  try { await browser?.close(); } catch (error) { browserErrors.push({ kind: 'cleanup', message: error.message }); }
  if (server) {
    server.closeAllConnections?.();
    await new Promise(resolve => server.close(resolve));
  }
  const failed = checks.filter(check => !check.passed).length;
  const succeeded = !fatalError && failed === 0 && checks.length > 0 && browserErrors.length === 0 && resourceErrors.length === 0 && blockedRequests.length === 0;
  const report = {
    schemaVersion: 1,
    mode: 'LOCAL',
    proofModes: ['LOCAL', 'MOCKED'],
    result: succeeded ? 'PASS' : 'FAIL',
    startedAt,
    finishedAt: new Date().toISOString(),
    passed: succeeded,
    counts: { total: checks.length, passed: checks.length - failed, failed, detailPages: checkedDetails.length },
    gitCommit,
    claimedCommit,
    browserVersion,
    dependencyVersions,
    build: buildDigest,
    safety: { externalWritesSent: 0, applicationPostsMocked: applicationRequests.length, serviceWorkersBlocked: true, externalRequestsBlocked: true },
    proofLimits: ['Application responses are mocked; no fresh CRM record, email delivery or calendar booking is verified.'],
    checks,
    screenshots,
    browserErrors,
    resourceErrors,
    blockedRequests,
    fatalError: fatalError || null,
  };
  await fs.writeFile(path.join(outputRoot, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ browserQA: succeeded ? 'PASS' : 'FAIL', ...report.counts, report: path.join(outputRoot, 'report.json') }));
  if (!succeeded) process.exitCode = 1;
}
