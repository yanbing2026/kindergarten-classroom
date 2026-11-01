/**
 * Self-test for the offline shell contract.
 *
 * The PWA promise only holds if every first-render dependency is precached and
 * a subpage navigation falls back to its own cached document. Before this test
 * the shell had 8 entries while the homepage loaded 13 scripts and a 68 KB
 * stylesheet that only entered the cache on a second online visit.
 *
 * Run with: node scripts/test_offline_shell.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const swSource = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

function parseShell() {
    const match = swSource.match(/const\s+APP_SHELL\s*=\s*\[([\s\S]*?)\];/);
    assert(match, 'sw.js must declare APP_SHELL');
    return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

function localAssets(htmlPath) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const assets = [];
    for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) assets.push(m[1]);
    for (const m of html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/g)) assets.push(m[1]);
    for (const m of html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)) assets.push(m[1]);
    return assets.filter((src) => !/^https?:|^\/\//.test(src));
}

function normalize(fromDir, src) {
    return path.posix.normalize(path.posix.join(fromDir, src)).replace(/^\.\//, '');
}

console.log('Testing offline shell coverage...');

const shell = parseShell();
const shellSet = new Set(shell.map((p) => p.replace(/^\.\//, '')));
assert(shell.length >= 20, `APP_SHELL looks too small (${shell.length} entries)`);

// 1. Every local asset needed by the homepage and the four grade pages is
//    precached, so a first offline cold start can render and run.
const pages = [
    ['index.html', '.'],
    ['pre-k/index.html', 'pre-k'],
    ['kindergarten/index.html', 'kindergarten'],
    ['grade-1/index.html', 'grade-1'],
    ['grade-2/index.html', 'grade-2']
];
for (const [file, dir] of pages) {
    const full = path.join(ROOT, file);
    assert(fs.existsSync(full), `${file} must exist`);
    for (const src of localAssets(full)) {
        const rel = normalize(dir, src);
        assert(
            shellSet.has(rel),
            `${file} loads "${src}" (${rel}) but it is not in APP_SHELL; offline first load would fail`
        );
        assert(fs.existsSync(path.join(ROOT, rel)), `${rel} is precached but does not exist on disk`);
    }
}
console.log('✓ every local script/stylesheet used by all five entry pages is precached');

// 2. Every precached path exists on disk (catches typo-only shells).
for (const entry of shell) {
    if (entry === './') continue;
    const rel = entry.replace(/^\.\//, '');
    assert(fs.existsSync(path.join(ROOT, rel)), `APP_SHELL entry ${entry} does not exist`);
}
console.log(`✓ all ${shell.length} APP_SHELL entries exist on disk`);

// 3. Navigation fallback is path-aware. Extract and exercise shellPathFor().
const fnMatch = swSource.match(/function\s+shellPathFor\s*\(url\)\s*\{([\s\S]*?)\n\}/);
assert(fnMatch, 'sw.js must define shellPathFor(url)');
const shellPathFor = new Function('url', fnMatch[1]);
const cases = [
    ['https://x.test/', './index.html'],
    ['https://x.test/index.html', './index.html'],
    ['https://x.test/grade-2/', './grade-2/index.html'],
    ['https://x.test/grade-2/index.html', './grade-2/index.html'],
    ['https://x.test/grade-1/', './grade-1/index.html'],
    ['https://x.test/kindergarten/', './kindergarten/index.html'],
    ['https://x.test/pre-k/', './pre-k/index.html'],
    ['https://x.test/some/deep/page', './index.html']
];
for (const [url, expected] of cases) {
    assert.strictEqual(shellPathFor(new URL(url)), expected, `fallback for ${url}`);
}
console.log('✓ navigation fallback maps each grade path to its own cached document');

// 4. Image cache version is independent of APP_VERSION.
assert(
    /const\s+IMAGE_CACHE_VERSION\s*=\s*['"][^'"]+['"]/.test(swSource),
    'IMAGE_CACHE must have its own version constant'
);
assert(
    /const\s+IMAGE_CACHE\s*=\s*`kc-images-\$\{IMAGE_CACHE_VERSION\}`/.test(swSource),
    'IMAGE_CACHE must derive from IMAGE_CACHE_VERSION, not APP_VERSION'
);
console.log('✓ image cache version is decoupled from APP_VERSION');

// 5. install tolerates individual failures instead of cache.addAll.
assert(!/cache\.addAll\s*\(/.test(swSource), 'install must not use all-or-nothing cache.addAll');
assert(/Promise\.allSettled/.test(swSource), 'install must report per-file precache failures');
console.log('✓ install reports per-file failures instead of failing the whole shell');
