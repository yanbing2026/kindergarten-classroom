/**
 * Self-test for app shell precache integrity and version synchronization:
 * 1. Verifies that APP_VERSION in index.html is identical to APP_VERSION in sw.js.
 * 2. Verifies that CACHE_NAME in sw.js is derived from APP_VERSION via template literal.
 * 3. Verifies that every path in APP_SHELL in sw.js exists on disk.
 *
 * Run with: node scripts/test_app_shell.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = process.env.KC_ROOT
    ? path.resolve(process.env.KC_ROOT)
    : path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const SW_PATH = path.join(ROOT_DIR, 'sw.js');

console.log('Testing app shell precache integrity and version synchronization...');

assert(fs.existsSync(INDEX_PATH), `index.html must exist at ${INDEX_PATH}`);
assert(fs.existsSync(SW_PATH), `sw.js must exist at ${SW_PATH}`);

const swJs = fs.readFileSync(SW_PATH, 'utf8');
const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');

// 1. Verify APP_VERSION in index.html is IDENTICAL to sw.js
const swVersionMatch = swJs.match(/const\s+APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
assert(swVersionMatch, 'Could not find const APP_VERSION in sw.js');
const swVersion = swVersionMatch[1];

const htmlVersionMatch = indexHtml.match(/const\s+APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
assert(htmlVersionMatch, 'Could not find const APP_VERSION in index.html');
const htmlVersion = htmlVersionMatch[1];

assert.strictEqual(
    swVersion,
    htmlVersion,
    `APP_VERSION mismatch: sw.js has "${swVersion}", index.html has "${htmlVersion}"`
);
console.log(`✓ APP_VERSION is identical in index.html and sw.js ("${swVersion}").`);

// 2. Verify sw.js CACHE_NAME is derived from APP_VERSION via template literal
const cacheNameDeclMatch = swJs.match(/const\s+CACHE_NAME\s*=\s*([^;\n]+);/);
assert(cacheNameDeclMatch, 'Could not find const CACHE_NAME declaration in sw.js');
const cacheNameExpr = cacheNameDeclMatch[1].trim();

assert(
    cacheNameExpr.startsWith('`') && cacheNameExpr.endsWith('`'),
    `CACHE_NAME in sw.js must be a template literal, found: ${cacheNameExpr}`
);
assert(
    /\$\{\s*APP_VERSION\s*\}/.test(cacheNameExpr),
    `CACHE_NAME in sw.js must derive from APP_VERSION (template literal referencing \${APP_VERSION}), found: ${cacheNameExpr}`
);
console.log(`✓ CACHE_NAME in sw.js is derived from APP_VERSION (${cacheNameExpr}).`);

// 3. Verify every path in APP_SHELL array exists on disk
const appShellMatch = swJs.match(/const\s+APP_SHELL\s*=\s*\[([\s\S]*?)\];/);
assert(appShellMatch, 'Could not find const APP_SHELL in sw.js');
const shellUrls = [...appShellMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
assert(shellUrls.length > 0, 'APP_SHELL array must not be empty');

// Also scan sw.js for any relative precache paths (e.g. appended test entries)
const allRelativePaths = [...swJs.matchAll(/['"](\.\/[^'"]+)['"]/g)].map(m => m[1]);
const pathsToCheck = Array.from(new Set([...shellUrls, ...allRelativePaths]));

for (const rawPath of pathsToCheck) {
    const diskPath = (rawPath === './' || rawPath === '.')
        ? ROOT_DIR
        : path.resolve(ROOT_DIR, rawPath.replace(/^\.\//, ''));
    assert(
        fs.existsSync(diskPath),
        `APP_SHELL resource does not exist on disk: ${rawPath} (resolved to ${diskPath})`
    );
}
console.log(`✓ All ${pathsToCheck.length} app shell resources in sw.js exist on disk.`);

console.log('\nAll app shell and version sync tests PASSED! ✅');
