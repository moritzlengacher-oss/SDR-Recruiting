import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.dirname(appRoot);
const evidenceRoot = path.join(appRoot, 'qa-output');
const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID();
const outputRoot = path.join(evidenceRoot, 'runs', runId);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const expectedTarget = Object.freeze({
  repository: 'moritzlengacher-oss/SDR-Recruiting',
  projectId: 'prj_aai674bWi0ZXbmKh2ocCCRuSSv5o',
  projectName: 'lp-karriere',
  publicOrigin: 'https://jobs.lengacher-partner.ch',
  rootDirectory: 'karriere',
});
const evidence = {
  schemaVersion: 1,
  runId,
  startedAt: new Date().toISOString(),
  result: 'UNVERIFIED',
  scope: 'Candidate build, original brand, preserved functions and mocked integration contracts',
  target: expectedTarget,
  stages: [],
  limits: [
    'The local browser intercepts application requests; it does not prove live CRM, email or calendar delivery.',
    'Candidate checks do not replace two prechecks, independent review, post-deployment verification or provider enforcement.',
    'A repository script is mutable; GitHub rulesets and Vercel Deployment Checks must be enabled separately.',
  ],
};

function git(...args) {
  const result = spawnSync('git', args, { cwd: repositoryRoot, encoding: 'utf8', timeout: 10000 });
  return result.status === 0 ? result.stdout.trim() : null;
}

function snapshot() {
  const records = [];
  function walk(relative) {
    const full = path.join(repositoryRoot, relative);
    if (!fs.existsSync(full)) return;
    if (fs.statSync(full).isDirectory()) {
      for (const name of fs.readdirSync(full).sort()) {
        if (['node_modules', 'public', 'qa-output', '.git', '.vercel'].includes(name)) continue;
        walk(path.join(relative, name));
      }
    } else records.push({ path: relative.split(path.sep).join('/'), sha256: sha256(fs.readFileSync(full)) });
  }
  for (const relative of ['AGENTS.md', 'index.html', '.github', 'docs/quality', 'karriere', 'tests']) walk(relative);
  records.sort((a, b) => a.path.localeCompare(b.path));
  return { sha256: sha256(JSON.stringify(records)), files: records };
}

function run(name, args, mode, extraEnv = {}) {
  const start = Date.now();
  const result = spawnSync(process.execPath, args, {
    cwd: appRoot,
    env: { ...process.env, ...extraEnv },
    encoding: 'utf8',
    timeout: 360000,
    maxBuffer: 16 * 1024 * 1024,
  });
  const log = (result.stdout || '') + (result.stderr || '') + (result.error ? '\n' + result.error.message : '');
  fs.writeFileSync(path.join(outputRoot, name + '.log'), log);
  process.stdout.write(log);
  const stage = { name, mode, result: result.status === 0 ? 'PASS' : 'FAIL', exitCode: result.status, durationMs: Date.now() - start, logSha256: sha256(log) };
  if (name === 'static') stage.proofModes = ['STATIC', 'MOCKED'];
  if (name === 'browser') stage.proofModes = ['LOCAL', 'MOCKED'];
  const counts = Object.fromEntries([...log.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$/gm)].map(match => [match[1], Number(match[2])]));
  if (Object.keys(counts).length) stage.counts = counts;
  evidence.stages.push(stage);
  assert.equal(result.status, 0, name + ' failed; see qa-output/' + name + '.log');
  return stage;
}

function currentBuild() {
  const directory = path.join(appRoot, 'public');
  const files = [];
  function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(full);
      else {
        assert.ok(entry.isFile(), 'Unexpected non-regular built artifact: ' + full);
        files.push({ path: path.relative(directory, full).split(path.sep).join('/'), sha256: sha256(fs.readFileSync(full)) });
      }
    }
  }
  walk(directory);
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return { sha256: sha256(JSON.stringify(files)), files };
}

// A fresh immutable run directory prevents stale verdicts without erasing failures.
fs.mkdirSync(outputRoot, { recursive: true });
try {
  const observedCommit = git('rev-parse', 'HEAD');
  const claimedCommit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null;
  evidence.revision = { observedCommit, claimedCommit, trackedChanges: git('status', '--porcelain', '--untracked-files=no') };
  if (claimedCommit) assert.match(claimedCommit, /^[a-f0-9]{40}$/i, 'Invalid deployment/CI commit');
  if (observedCommit && claimedCommit) assert.equal(observedCommit, claimedCommit, 'Evidence must match the actual checked-out revision');
  if (process.env.CI || process.env.VERCEL) {
    assert.ok(observedCommit || claimedCommit, 'CI/deployment revision is required');
    assert.ok(!evidence.revision.trackedChanges, 'Tracked source was changed after checkout');
  }
  if (process.env.GITHUB_REPOSITORY) assert.equal(process.env.GITHUB_REPOSITORY, expectedTarget.repository, 'Wrong repository');
  if (process.env.VERCEL) {
    assert.equal(process.env.VERCEL_PROJECT_ID, expectedTarget.projectId, 'Wrong or unverified Vercel project');
    assert.ok(claimedCommit, 'Git deployment commit is required');
    if (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG) {
      assert.equal(process.env.VERCEL_GIT_REPO_OWNER + '/' + process.env.VERCEL_GIT_REPO_SLUG, expectedTarget.repository, 'Wrong deployment repository');
    }
  }
  evidence.contractSha256 = sha256(fs.readFileSync(path.join(appRoot, 'quality-contract.json')));
  evidence.source = snapshot();
  run('build', ['build.mjs'], 'STATIC');
  const staticStage = run('static', ['--test', '--test-isolation=none', '--test-reporter=tap', 'qa.test.mjs', 'brand-guard.test.mjs', 'quality-contract.test.mjs', '../tests/lp-karriere-release-guard.test.mjs'], 'STATIC');
  assert.ok(staticStage.counts?.tests > 0, 'No static tests ran');
  assert.equal(staticStage.counts?.skipped, 0, 'Skipped tests cannot satisfy the release gate');
  assert.equal(staticStage.counts?.todo, 0, 'TODO tests cannot satisfy the release gate');
  run('browser', ['browser-qa.mjs'], 'LOCAL', { QA_OUTPUT_DIR: path.join(outputRoot, 'browser') });
  const browserReport = JSON.parse(fs.readFileSync(path.join(outputRoot, 'browser', 'report.json'), 'utf8'));
  assert.equal(browserReport.passed, true, 'Browser evidence did not pass');
  assert.ok(browserReport.counts?.total > 0, 'No browser cases ran');
  assert.equal(browserReport.counts?.failed, 0, 'Browser cases failed');
  const contract = JSON.parse(fs.readFileSync(path.join(appRoot, 'quality-contract.json'), 'utf8'));
  assert.equal(browserReport.counts?.detailPages, contract.jobs.length, 'Not every contracted detail page was checked');
  assert.deepEqual(currentBuild(), browserReport.build, 'Complete built file inventory changed after browser QA');
  evidence.browserReportSha256 = sha256(JSON.stringify(browserReport));
  evidence.browser = browserReport;
  assert.equal(snapshot().sha256, evidence.source.sha256, 'Source changed during verification');
  evidence.result = 'PASS';
} catch (error) {
  evidence.result = 'FAIL';
  evidence.error = error.message;
  process.exitCode = 1;
  console.error('ASU quality gate FAILED: ' + error.message);
} finally {
  evidence.completedAt = new Date().toISOString();
  const serialized = JSON.stringify(evidence, null, 2) + '\n';
  fs.writeFileSync(path.join(outputRoot, 'release-evidence.json'), serialized, { flag: 'wx' });
  // Convenience copy only: the authoritative full run remains in runs/<runId>/.
  fs.writeFileSync(path.join(evidenceRoot, 'release-evidence.json'), serialized);
  console.log('ASU candidate quality gate: ' + evidence.result + ' — qa-output/runs/' + runId + '/release-evidence.json');
}
