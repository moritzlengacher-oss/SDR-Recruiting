import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.join(appRoot, 'public');
const read = relative => fs.readFileSync(path.resolve(appRoot, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const contract = json('quality-contract.json');

// Pinned after comparing the 29 relevant local files with GitHub's approved
// 9b1e2da baseline. These values intentionally do not come from the candidate
// contract or candidate manifest. Updating both a reference and its manifest
// cannot make this test pass without also changing this protected checker.
// This file itself remains mutable: provider rules must protect the checkers
// and require the exact-revision status. A repository test cannot prove that.
const APPROVED_BASELINE = '9b1e2da60ebdafdca9ddcf3a57f6ab90b1f1f858';
const APPROVED_TARGET = {
  "repository": "moritzlengacher-oss/SDR-Recruiting",
  "repositoryId": 1258806588,
  "provider": "vercel",
  "projectName": "lp-karriere",
  "projectId": "prj_aai674bWi0ZXbmKh2ocCCRuSSv5o",
  "teamId": "team_D2HfAoMX5gjDjxSQrYJYaBsu",
  "rootDirectory": "karriere",
  "outputDirectory": "public",
  "publicOrigin": "https://jobs.lengacher-partner.ch",
  "origin": "https://jobs-app.lengacher-partner.ch",
  "sourceFilesOutsideRootDirectory": true,
  "proxyProject": {
    "name": "ic",
    "id": "prj_O9fd4QxGfe5vdDyU12UHOax0GimH",
    "policy": "preserve_existing_host_proxy"
  }
};
const APPROVED_REFERENCE_SHA256 = {
  "brand/source-manifest.json": "7d4df6c513e6f440275a11dcf089d34640e470dfcd9973861e799fc1603402d3",
  "brand/header.html": "2b1e0dcdc69b95478bae7a17390a24741c64bd02a0cfee3cc18cc575b20b20b5",
  "brand/footer.html": "fb5eec3df562c1434be4d86223b57cb1140f1ee5b29ce6685b70231b2802c182",
  "brand/search.html": "bfbfc1458b1ff13643a06ae029e348026079dea0a7eb0f5fb1336b8e97b1882a",
  "brand/original-assets.b64": "a9f9b1d71855c1e0725854aad2b6caf9c59dc744571aa805740d010c52ab41a5",
  "api/career-application.js": "88ef4cc241b47295433f25fa267d0ada0d4cdd31a819c6059c27249d9e2aa97d"
};
const HISTORICAL_CLIENT_SHA256 = '0d3b4f9748ed59ddf455d27b7fd99fa020dea2c9cc268028c3f73ac4a50cba99';
const EXPECTED_CLIENT_SHA256 = '4d4afe412b5c7913afd2a2fbb88cd11de588bb97f835d7c8f981ff22c7a6ade7';
const APPROVED_JOB_INVENTORY_SHA256 = 'fcce0e2625890af54586d9bbec6445fe38607787cc6f7f90db38d7d2ccdbea32';
const REQUIRED_FEATURE_IDS = [
  "original-brand",
  "shared-shell",
  "corporate-and-career-search",
  "approved-job-catalog",
  "category-and-keyword-filters",
  "location-level-reset",
  "quick-apply",
  "employer-content",
  "career-booking",
  "application-fields-consent",
  "linkedin-or-pdf",
  "retry-preserves-data",
  "confirmed-success-only",
  "seo-routing-security",
  "responsive-keyboard-access"
];
const REQUIRED_SUITES = ['qa.test.mjs', 'brand-guard.test.mjs', 'quality-contract.test.mjs', '../tests/lp-karriere-release-guard.test.mjs'];
const REQUIRED_CHECK_NAME = 'ASU / lp-karriere / quality-gate';
const REQUIRED_FORM_FIELDS = ['form_name', 'source_url', 'source_offer', 'submission_id', 'website', 'name', 'email', 'phone', 'residence', 'career_role', 'workload', 'earliest_start', 'linkedin', 'resumePdfFile', 'message', 'privacy_consent'];
const REQUIRED_HUB_IDS = ['stellen', 'offene-stellen', 'job-search', 'job-location', 'job-level', 'job-reset', 'job-count', 'job-grid', 'no-results', 'vorteile', 'arbeitsalltag', 'ablauf', 'faq', 'bewerben', 'quick-apply', 'application'];

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
function unescapeHtml(value) {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  return String(value).replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (match, entity) => {
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? match;
    return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
  });
}
function attribute(tag, name) {
  const expression = new RegExp('(?:^|\\s)' + name + '="([^"]*)"');
  const match = tag.match(expression);
  return match ? unescapeHtml(match[1]) : null;
}
function tagWithName(html, name) {
  return [...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(match => match[0]).find(tag => attribute(tag, 'name') === name);
}
function roleOptions(html) {
  const select = [...html.matchAll(/<select\b[^>]*>[\s\S]*?<\/select>/g)].map(match => match[0]).find(tag => attribute(tag, 'name') === 'career_role');
  assert.ok(select, 'Role selector is required');
  return [...select.matchAll(/<option\b[^>]*>[\s\S]*?<\/option>/g)].map(match => ({
    role: attribute(match[0], 'value'),
    selected: /\bselected(?:\s|=|>)/.test(match[0]),
  }));
}
function posting(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  const result = scripts.map(match => JSON.parse(match[1])).find(item => item['@type'] === 'JobPosting');
  assert.ok(result, 'Missing JobPosting');
  return result;
}
function jobFolders() {
  return fs.readdirSync(path.join(appRoot, 'karriere'), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== 'assets' && fs.existsSync(path.join(appRoot, 'karriere', entry.name, 'index.html')))
    .map(entry => entry.name).sort();
}
function sourceOfferMap() {
  const source = read('karriere/assets/app.js');
  const match = source.match(/const careerOfferMap=(\{[\s\S]*?\});/);
  assert.ok(match, 'The approved role/offer map must be present');
  return JSON.parse(match[1]);
}
function sourceInventory() {
  const hub = read('karriere/index.html');
  const cards = [...hub.matchAll(/<article\b[^>]*class="[^"]*\bjob-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/g)].map(match => match[0]);
  const offers = sourceOfferMap();
  assert.equal(cards.length, 21, 'The overview must retain every approved job card');
  return jobFolders().map(slug => {
    const html = read('karriere/' + slug + '/index.html');
    const schema = posting(html);
    const card = cards.find(markup => markup.includes('href="/karriere/' + slug + '"'));
    assert.ok(card, 'Missing overview entry for ' + slug);
    assert.equal(attribute(card, 'data-quick-role'), schema.title, 'Quick Apply role mismatch: ' + slug);
    return { slug, role: schema.title, offer: offers[schema.title], category: attribute(card, 'data-category'), location: attribute(card, 'data-location'), level: attribute(card, 'data-level') };
  });
}

test('Contract binds the approved repository, project, host proxy and delivery target', () => {
  assert.equal(contract.schemaVersion, 1);
  assert.equal(contract.baseline.acceptedCode, APPROVED_BASELINE);
  assert.deepEqual(contract.target, APPROVED_TARGET);
  assert.equal(contract.brand.source, 'https://www.lengacher-partner.ch/');
  assert.equal(contract.target.sourceFilesOutsideRootDirectory, true, 'The provider must make the repository-level regression suite available');
  // sourceFilesOutsideRootDirectory is a provider project setting, not a
  // vercel.json setting. This static contract does not claim to observe it live.
  if (process.env.GITHUB_REPOSITORY) assert.equal(process.env.GITHUB_REPOSITORY, APPROVED_TARGET.repository);
  if (process.env.VERCEL_PROJECT_ID) assert.equal(process.env.VERCEL_PROJECT_ID, APPROVED_TARGET.projectId);
});

test('Approved source hashes cannot be replaced by editing only the candidate contract', () => {
  assert.deepEqual(contract.protectedReferences, APPROVED_REFERENCE_SHA256);
  for (const [relative, expected] of Object.entries(APPROVED_REFERENCE_SHA256)) {
    assert.equal(sha256(fs.readFileSync(path.join(appRoot, relative))), expected, 'Protected reference changed: ' + relative);
  }
  const manifest = json('brand/source-manifest.json');
  assert.equal(manifest.source, contract.brand.source);
  assert.equal(manifest.captured, '2026-10-27');
  assert.deepEqual(manifest.fonts, ['Cormorant Garamond', 'DM Mono']);
  assert.deepEqual(contract.brand.fonts, manifest.fonts);
  assert.deepEqual(contract.brand.palette, { paper: '#f5f2ec', ink: '#0d0d0d', gold: '#b8975a', navy: '#1a2744' });
  assert.deepEqual(contract.brand.effectivePalette, { paper: '#f5f2ec', ink: '#0d0d0d', gold: '#76591f', navy: '#1a2744' });
  assert.equal(contract.brand.message, 'KI, Prozesse und Wachstum für Schweizer KMU');
  assert.deepEqual(contract.brand.assets, manifest.assets);
  assert.equal(Object.keys(manifest.assets).length, 14);
  const bundle = JSON.parse(gunzipSync(Buffer.from(read('brand/original-assets.b64').trim(), 'base64')).toString('utf8'));
  assert.deepEqual(Object.keys(bundle).sort(), Object.keys(manifest.assets).sort());
  for (const [relative, expected] of Object.entries(manifest.assets)) {
    assert.ok(!relative.includes('..') && !path.isAbsolute(relative), relative);
    const bytes = Buffer.from(bundle[relative], 'base64');
    assert.equal(bytes.length, expected.bytes, relative);
    assert.equal(sha256(bytes), expected.sha256, relative);
    assert.equal(sha256(fs.readFileSync(path.join(outputRoot, relative))), expected.sha256, 'Built asset differs: ' + relative);
  }
});

test('All approved job identities, offer mappings and discovery metadata are retained', () => {
  assert.equal(contract.jobs.length, 21);
  const declared = [...contract.jobs].sort((left, right) => left.slug.localeCompare(right.slug));
  assert.equal(sha256(canonical(declared)), APPROVED_JOB_INVENTORY_SHA256, 'Contract changed the approved job inventory');
  assert.equal(contract.jobInventorySha256, APPROVED_JOB_INVENTORY_SHA256);
  const observed = sourceInventory();
  assert.equal(sha256(canonical(observed)), APPROVED_JOB_INVENTORY_SHA256, 'Source changed or lost an approved role, offer, category, location or level');
  assert.deepEqual(observed, declared);
  assert.deepEqual(contract.initiative, { role: 'Initiativbewerbung', offer: 'career-initiative' });
  const expectedOffers = Object.fromEntries([{ role: contract.initiative.role, offer: contract.initiative.offer }, ...declared].map(job => [job.role, job.offer]));
  assert.deepEqual(sourceOfferMap(), expectedOffers);
  const hub = read('karriere/index.html');
  assert.deepEqual(roleOptions(hub).map(option => option.role).sort(), Object.keys(expectedOffers).sort());
  const search = json('public/karriere/assets/jobs-search.json');
  assert.equal(search.length, 22);
  assert.deepEqual(search.filter(item => item.type === 'Stelle').map(item => ({ slug: item.url.replace('/karriere/', ''), role: item.title })).sort((a, b) => a.slug.localeCompare(b.slug)), declared.map(job => ({ slug: job.slug, role: job.role })));
  assert.ok(search.some(item => item.url === '/karriere'));
  for (const job of declared) {
    const html = read('karriere/' + job.slug + '/index.html');
    const canonicalTag = [...html.matchAll(/<link\b[^>]*>/g)].map(match => match[0]).find(tag => attribute(tag, 'rel') === 'canonical');
    assert.equal(attribute(canonicalTag || '', 'href'), APPROVED_TARGET.publicOrigin + '/karriere/' + job.slug);
    assert.equal(posting(html).title, job.role);
    assert.ok(posting(html).description?.trim(), job.slug + ' description');
    assert.deepEqual(roleOptions(html).filter(option => option.selected).map(option => option.role), [job.role], job.slug + ' default role');
  }
});

test('Feature contract and all pages preserve the complete shared shell and application entry points', () => {
  assert.deepEqual(contract.features.map(feature => feature.id).sort(), [...REQUIRED_FEATURE_IDS].sort());
  for (const feature of contract.features) {
    assert.equal(feature.mandatory, true, feature.id);
    assert.ok(feature.criterion?.trim(), feature.id);
    assert.ok(feature.verificationFiles.length > 0, feature.id);
    for (const file of feature.verificationFiles) assert.ok(fs.existsSync(path.resolve(appRoot, file)), feature.id + ': ' + file);
  }
  const hub = read('karriere/index.html');
  for (const id of REQUIRED_HUB_IDS) assert.ok(hub.includes('id="' + id + '"'), 'Missing feature anchor/control: ' + id);
  const header = read('brand/header.html'), footer = read('brand/footer.html'), search = read('brand/search.html');
  const pages = ['index.html', ...jobFolders().map(slug => slug + '/index.html')];
  assert.equal(pages.length, 22);
  for (const relative of pages) {
    const html = read('public/karriere/' + relative);
    assert.ok(html.includes(header) && html.includes(footer) && html.includes(search), 'Incomplete approved shell: ' + relative);
    assert.ok(html.includes('lang="de-CH"'), relative + ' language');
    assert.ok(html.includes(contract.brand.message), relative + ' brand wording');
    assert.ok(html.includes('id="quick-apply"'), relative + ' legacy entry');
    assert.ok(html.includes('href="https://crm.lengacher-partner.ch/book/karriere"'), relative + ' booking');
    for (const asset of ['/assets/lp-brand/styles.css', '/karriere/assets/styles.css', '/karriere/assets/app.js', '/karriere/assets/brand-shell.js']) assert.ok(html.includes(asset), relative + ': ' + asset);
    const form = html.match(/<form\b[^>]*id="application"[^>]*>[\s\S]*?<\/form>/)?.[0];
    assert.ok(form, relative + ' form');
    assert.equal(attribute(form, 'action'), '/api/career-application');
    assert.equal(attribute(form, 'method')?.toLowerCase(), 'post');
    for (const field of REQUIRED_FORM_FIELDS) assert.ok(tagWithName(form, field), relative + ': ' + field);
    for (const field of ['name', 'email', 'career_role', 'privacy_consent']) assert.match(tagWithName(form, field), /\brequired(?:\s|=|>)/, relative + ': required ' + field);
    assert.ok(!/\bchecked(?:\s|=|>)/.test(tagWithName(form, 'privacy_consent')), relative + ': consent cannot be preselected');
    assert.equal(attribute(tagWithName(form, 'email'), 'type'), 'email');
    assert.equal(attribute(tagWithName(form, 'resumePdfFile'), 'type'), 'file');
  }
});

test('The authorized client fix resets only a confirmed submission and preserves the approved retry behavior', () => {
  assert.equal(contract.clientApplication.path, 'karriere/assets/app.js');
  assert.equal(contract.clientApplication.historicalBaselineCommit, APPROVED_BASELINE);
  assert.equal(contract.clientApplication.historicalBaselineSha256, HISTORICAL_CLIENT_SHA256);
  assert.equal(contract.clientApplication.expectedCandidateSha256, EXPECTED_CLIENT_SHA256);
  for (const key of ['retrySubmissionIdStable', 'newSubmissionIdAfterConfirmedSuccess', 'successRequiresHttpSuccessAndOkTrue']) assert.equal(contract.clientApplication[key], true, key);
  assert.ok(contract.clientApplication.verificationFiles.includes('browser-qa.mjs'), 'The client behavior requires real-browser regression checks with intercepted requests');
  const client = read('karriere/assets/app.js');
  assert.equal(sha256(client), EXPECTED_CLIENT_SHA256, 'The client differs from the reviewed minimal fix');
  assert.equal(sha256(read('public/karriere/assets/app.js')), EXPECTED_CLIENT_SHA256, 'The built client differs from the reviewed source');
  // Reversing the authorized insertion and its documented final LF must
  // recover the independent historical anchor. This guards the unchanged
  // error/retry branches; browser-qa exercises the actual hidden-input reset.
  const corrected = "form.reset();if(submissionInput)submissionInput.value='';syncCareerOffer();";
  assert.equal(client.split(corrected).length, 2, 'There must be exactly one scoped success-path correction');
  assert.ok(client.endsWith('\n'), 'The reviewed candidate has one added final LF');
  assert.equal(sha256(client.replace(corrected, 'form.reset();syncCareerOffer();').slice(0, -1)), HISTORICAL_CLIENT_SHA256, 'The change exceeds the reviewed success-path fix and one final LF');
});

test('Relay remains unchanged and mocked application responses cannot certify live delivery', () => {
  assert.equal(contract.integration.integrationScope, 'unchanged_relay_contract');
  assert.equal(contract.integration.endpoint, '/api/career-application');
  assert.equal(contract.integration.upstream, 'https://www.lengacher-partner.ch/api/career-application');
  assert.equal(contract.integration.relayPath, 'api/career-application.js');
  assert.equal(contract.integration.relaySha256, APPROVED_REFERENCE_SHA256['api/career-application.js']);
  assert.equal(sha256(fs.readFileSync(path.join(appRoot, contract.integration.relayPath))), APPROVED_REFERENCE_SHA256['api/career-application.js']);
  assert.equal(contract.integration.maxPdfBytes, 2 * 1024 * 1024);
  assert.equal(contract.integration.careerBooking, 'https://crm.lengacher-partner.ch/book/karriere');
  assert.equal(contract.integration.mockedSuccessProvesLiveDelivery, false);
  assert.equal(contract.integration.liveDelivery.status, 'UNVERIFIED');
  assert.equal(contract.integration.liveDelivery.mode, 'LIVE');
  assert.equal(contract.integration.liveDelivery.requiredForThisScopedChange, false);
  assert.deepEqual(contract.integration.liveDelivery.evidence, []);
  assert.deepEqual(contract.integration.historicalDeliveryEvidence, []);
  const config = json('vercel.json');
  assert.equal(config.redirects.find(rule => rule.source === '/')?.destination, '/karriere');
  assert.ok(config.functions['api/career-application.js']);
  assert.ok(!config.rewrites?.length, 'The separate host proxy is not redefined in this project');
  const headers = config.headers.find(rule => rule.source === '/(.*)')?.headers || [];
  for (const name of ['Content-Security-Policy', 'X-Content-Type-Options', 'X-Frame-Options', 'Strict-Transport-Security']) assert.ok(headers.some(header => header.key === name), name);
});

test('npm, Vercel and the required GitHub check all invoke the complete canonical gate', () => {
  const expected = { test: 'node verify.mjs', build: 'node verify.mjs' };
  assert.equal(contract.verification.canonicalCommand, 'node verify.mjs');
  assert.deepEqual(contract.verification.npmScripts, expected);
  const pkg = json('package.json');
  for (const [name, command] of Object.entries(expected)) assert.equal(pkg.scripts[name], command, 'npm ' + name + ' bypasses the complete gate');
  const config = json('vercel.json');
  assert.equal(config.buildCommand, 'node verify.mjs');
  assert.equal(config.outputDirectory, 'public');
  assert.deepEqual(contract.verification.staticSuites, REQUIRED_SUITES);
  assert.equal(contract.verification.browserEntrypoint, 'browser-qa.mjs');
  assert.equal(contract.verification.browserRequired, true);
  assert.equal(contract.verification.allowStaticOnlyRelease, false);
  assert.equal(contract.verification.allowSkippedTests, false);
  assert.equal(contract.verification.allowTodoTests, false);
  assert.equal(contract.verification.requiredCheckName, REQUIRED_CHECK_NAME);
  assert.deepEqual(contract.verification.workflowEvents, ['push', 'pull_request']);
  assert.equal(contract.verification.eventPathFiltersAllowed, false);
  assert.equal(contract.verification.eventBranchFiltersAllowed, false);
  const verifier = read('verify.mjs');
  const staticInvocation = verifier.match(/run\(\s*['"]static['"]\s*,\s*(\[[^\]]+\])/);
  assert.ok(staticInvocation, 'The verifier must execute the static suites');
  const staticArguments = [...staticInvocation[1].matchAll(/['"]([^'"]+)['"]/g)].map(match => match[1]);
  assert.ok(staticArguments.includes('--test'));
  for (const file of REQUIRED_SUITES) assert.ok(staticArguments.includes(file), 'Verifier omitted ' + file);
  assert.match(verifier, /run\(\s*['"]build['"]\s*,\s*\[\s*['"]build\.mjs['"]\s*\]/);
  assert.match(verifier, /run\(\s*['"]browser['"]\s*,\s*\[\s*['"]browser-qa\.mjs['"]\s*\]/);
  assert.match(verifier, /process\.exitCode\s*=\s*1\b/, 'Verifier failures must exit nonzero');
  assert.match(verifier, /QA_OUTPUT_DIR/, 'Browser evidence must use the current run directory');
  const workflow = read(contract.verification.workflow);
  assert.match(workflow, /^on:\s*$/m);
  assert.match(workflow, /^  push:\s*$/m);
  assert.match(workflow, /^  pull_request:\s*$/m);
  assert.ok(!/^\s+(?:paths|paths-ignore|branches|branches-ignore):/m.test(workflow), 'Required check must not disappear through event filters');
  assert.ok(workflow.split('\n').some(line => line.trim() === 'name: ' + REQUIRED_CHECK_NAME));
  assert.match(workflow, /^\s+working-directory:\s+karriere\s*$/m);
  assert.match(workflow, /^\s+run:\s+npm test\s*$/m, 'CI must call the canonical npm gate');
  assert.ok(!/continue-on-error:\s*true|\|\|\s*(?:true|exit\s+0)/.test(workflow), 'CI must not swallow verifier failures');
  assert.match(workflow, /if-no-files-found:\s*error/, 'Missing QA evidence is a failure');
  assert.match(workflow, /github\.sha/, 'Retained evidence must identify the tested revision');
  const lock = json('package-lock.json');
  for (const name of ['playwright-core', '@sparticuz/chromium']) {
    assert.match(pkg.devDependencies?.[name] || '', /^\d+\.\d+\.\d+$/, 'Pin exact browser test dependency: ' + name);
    assert.equal(lock.packages?.['']?.devDependencies?.[name], pkg.devDependencies[name], 'Lockfile differs: ' + name);
  }
});

test('Evidence rules distinguish candidate checks, post-release acceptance and provider enforcement', () => {
  assert.deepEqual(contract.qaPolicy.preReleaseRequired, ['V1', 'V2', 'N1']);
  assert.deepEqual(contract.qaPolicy.postReleaseAcceptanceRequired, ['N2']);
  assert.equal(contract.qaPolicy.N2PlanRequiredBeforeRelease, true);
  assert.equal(contract.qaPolicy.sameTestTwiceIsIndependentReview, false);
  assert.deepEqual(contract.evidencePolicy.statuses, ['PASS', 'FAIL', 'BLOCKED', 'UNVERIFIED', 'N/A']);
  assert.deepEqual(contract.evidencePolicy.modes, ['LIVE', 'LOCAL', 'MOCKED', 'STATIC', 'HISTORICAL']);
  for (const key of ['requireRevisionAndTarget', 'requireEvidenceForPass', 'requireReasonForNotApplicable', 'preserveFailedAttempts', 'changedCandidateInvalidatesAffectedEvidence']) assert.equal(contract.evidencePolicy[key], true, key);
  assert.equal(contract.evidencePolicy.mockedOrHistoricalEvidenceProvesNewLiveEffect, false);
  assert.equal(contract.evidencePolicy.testCountsAloneProveAcceptance, false);
  for (const relative of ['quality-contract.json', 'quality-contract.test.mjs', 'verify.mjs', 'browser-qa.mjs', 'build.mjs', '../.github/workflows/lp-karriere-qa.yml', 'package.json', 'package-lock.json', 'vercel.json', 'karriere/assets/app.js', ...Object.keys(APPROVED_REFERENCE_SHA256)]) {
    assert.ok(contract.testIntegrity.protectedFiles.includes(relative), 'Unprotected checker/reference: ' + relative);
    assert.ok(fs.existsSync(path.resolve(appRoot, relative)), relative);
  }
  assert.equal(contract.testIntegrity.providerEnforcementStatus, 'UNVERIFIED', 'Remote enforcement requires separately observed provider evidence, not a local PASS');
  assert.ok(contract.testIntegrity.enforcementLimit.includes('mutable'));
  assert.ok(contract.testIntegrity.enforcementLimit.includes('GitHub/Vercel'));
});
