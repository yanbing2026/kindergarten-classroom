/**
 * Self-test for N17 image assets & reference integrity:
 * 1. Verifies that all files under images/ are referenced and reachable.
 * 2. Asserts 0 orphan files, 0 broken paths, and 1:1 alignment between
 *    images/science/*.webp and SCIENCE_LEVELS in index.html.
 * 3. Verifies sw.js APP_SHELL contains no missing files or dead image references.
 * 4. Verifies wordMediaHTML() properly degrades to emoji fallback when item.img is undefined.
 *
 * Run with: node scripts/test_image_references.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const SW_PATH = path.join(ROOT_DIR, 'sw.js');
const IMAGES_DIR = path.join(ROOT_DIR, 'images');

console.log('Testing N17 image assets and reference integrity...');

assert(fs.existsSync(INDEX_PATH), 'index.html must exist');
assert(fs.existsSync(SW_PATH), 'sw.js must exist');
assert(fs.existsSync(IMAGES_DIR), 'images/ directory must exist');

const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
const swJs = fs.readFileSync(SW_PATH, 'utf8');

// 1. Scan all files on disk under images/
const diskFiles = [];
function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(full);
        } else if (entry.isFile()) {
            diskFiles.push(path.relative(ROOT_DIR, full));
        }
    }
}
walkDir(IMAGES_DIR);

console.log(`Found ${diskFiles.length} file(s) under images/ on disk.`);

// Assert no non-image files exist under images/
const ALLOWED_EXTS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg']);
const nonImageFiles = diskFiles.filter(f => !ALLOWED_EXTS.has(path.extname(f).toLowerCase()));
assert.strictEqual(
    nonImageFiles.length,
    0,
    `Found non-image/orphan files under images/: ${JSON.stringify(nonImageFiles)}`
);

// 2. Extract SCIENCE_LEVELS IDs from index.html
const scienceBlockMatch = indexHtml.match(/const\s+SCIENCE_LEVELS\s*=\s*\[([\s\S]*?)\];\s*const\s+SCIENCE_LEVELS_MAPPED/);
assert(scienceBlockMatch, 'Could not find SCIENCE_LEVELS in index.html');
const scienceIdMatches = [...scienceBlockMatch[1].matchAll(/id\s*:\s*'([^']+)'/g)];
const scienceIds = scienceIdMatches.map(m => m[1]);
assert.strictEqual(scienceIds.length, 96, `Expected exactly 96 science items, found ${scienceIds.length}`);

// Check 1:1 mapping with images/science/*.webp
const expectedSciencePaths = new Set(scienceIds.map(id => `images/science/${id}.webp`));
const diskSciencePaths = new Set(diskFiles.filter(f => f.startsWith('images/science/')));

const missingFromDisk = [...expectedSciencePaths].filter(p => !diskSciencePaths.has(p));
assert.strictEqual(
    missingFromDisk.length,
    0,
    `Missing science images on disk: ${JSON.stringify(missingFromDisk)}`
);

const extraOnDisk = [...diskSciencePaths].filter(p => !expectedSciencePaths.has(p));
assert.strictEqual(
    extraOnDisk.length,
    0,
    `Unreferenced/extra images on disk: ${JSON.stringify(extraOnDisk)}`
);
console.log('✓ All 96 science webp images match SCIENCE_LEVELS 1:1 with zero orphans.');

// 3. Verify no images/words references exist anywhere in index.html or sw.js
assert(
    !indexHtml.includes('images/words/'),
    'index.html should not contain any references to images/words/'
);
assert(
    !swJs.includes('images/words/'),
    'sw.js should not contain any references to images/words/'
);
console.log('✓ Zero references to dead images/words/ in index.html and sw.js.');

// 4. Verify sw.js APP_SHELL assets all exist on disk
const appShellMatch = swJs.match(/const\s+APP_SHELL\s*=\s*\[([\s\S]*?)\];/);
assert(appShellMatch, 'Could not find APP_SHELL in sw.js');
const shellUrls = [...appShellMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1]);

for (const rawUrl of shellUrls) {
    if (rawUrl === './') continue;
    const cleanPath = rawUrl.replace(/^\.\//, '');
    const diskPath = path.join(ROOT_DIR, cleanPath);
    assert(
        fs.existsSync(diskPath),
        `APP_SHELL resource does not exist on disk: ${cleanPath}`
    );
}
console.log(`✓ All ${shellUrls.length} APP_SHELL resources in sw.js exist on disk.`);

// 5. Test wordMediaHTML fallback behavior
// Extract wordMediaHTML function from index.html
function extractFunction(source, fnName) {
    const startPattern = `function ${fnName}(`;
    const startIdx = source.indexOf(startPattern);
    assert(startIdx !== -1, `Could not find "${startPattern}" in index.html`);
    const openBraceIdx = source.indexOf('{', startIdx);
    let depth = 0;
    let endIdx = -1;
    for (let i = openBraceIdx; i < source.length; i++) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}') {
            depth--;
            if (depth === 0) { endIdx = i + 1; break; }
        }
    }
    return source.slice(startIdx, endIdx);
}

const wordMediaHTMLSrc = extractFunction(indexHtml, 'wordMediaHTML');
global.esc = (s) => String(s);
const wordMediaHTML = eval(`(${wordMediaHTMLSrc})`);

// Test item with image
const itemWithImg = { id: 'test_photo', emoji: '🔬', img: 'images/science/sun.webp' };
const renderedImg = wordMediaHTML(itemWithImg, 64);
assert(renderedImg.includes('<img src="images/science/sun.webp"'), 'Should render img tag when img is present');

// Test item without image (emoji fallback — standard for VOCAB_LEVELS)
const itemWithoutImg = { id: 'apple', emoji: '🍎' };
const renderedEmoji = wordMediaHTML(itemWithoutImg, 64);
assert(renderedEmoji.includes('🍎'), 'Should fallback to emoji when img is missing');
assert(!renderedEmoji.includes('<img'), 'Should NOT render img tag when img is missing');
assert(!renderedEmoji.includes('undefined'), 'Should not render undefined in fallback');
console.log('✓ wordMediaHTML correctly renders img or degrades gracefully to emoji fallback.');

console.log('\nAll N17 image integrity tests PASSED! ✅');
