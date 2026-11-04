/**
 * Self-test for the grade CSS split (§6.2).
 *
 * shared/main.css used to be one 83 KB render-blocking stylesheet including
 * ~20 KB of grade/course rules the home screen never needs. The grade rules
 * now live in shared/grade.css, loaded on demand by ensureGradeCSS() when a
 * grade screen opens. The loading/error chrome (.grade-loading/.grade-end)
 * stays in main.css because renderGradeLoading paints before grade.css
 * arrives; both files stay precached so offline lessons keep working.
 *
 * Run with: node scripts/test_css_split.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const mainCss = fs.readFileSync(path.join(ROOT, 'shared/main.css'), 'utf8');
const gradeCss = fs.readFileSync(path.join(ROOT, 'shared/grade.css'), 'utf8');
const swSource = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

console.log('Testing grade CSS split...');

// 1. The split actually moved weight out of the critical shell.
assert(gradeCss.length > 10000, `shared/grade.css looks too small (${gradeCss.length} bytes)`);
assert(mainCss.length < 70000, `shared/main.css should be under 70 KB after the split (${mainCss.length} bytes)`);
console.log(`✓ grade.css holds ${gradeCss.length} bytes, main.css down to ${mainCss.length} bytes`);

// 2. Selector contract: grade/course rules live in grade.css, except the
//    loading/error chrome that the loading screen needs before grade.css
//    arrives (plus the shared .sr-only helper).
{
    const chromeOk = (sel) => /^\.(grade-loading|grade-end|sr-only)/.test(sel);
    for (const [name, css] of [['main.css', mainCss]]) {
        for (const m of css.matchAll(/\.((?:grade|course)-[\w-]+)/g)) {
            assert(chromeOk(m[0]), `${name} still contains non-chrome grade rule "${m[0]}" (move it to grade.css)`);
        }
    }
    for (const cls of ['grade-lesson-card', 'grade-choices', 'grade-choice', 'course-unit', 'course-overview', 'grade-blipola', 'grade-text-answer']) {
        assert(gradeCss.includes('.' + cls), `shared/grade.css must define .${cls}`);
    }
    console.log('✓ only loading/error chrome stays in main.css; lesson rules live in grade.css');
}

// 3. grade.css is lazy, not render-blocking: no static <link> for it, and
//    the on-demand loader is wired into the grade render path.
{
    assert(!/<link[^>]+href=["']shared\/grade\.css["']/.test(html), 'grade.css must not be a static <link> (that would undo the split)');
    assert(html.includes('function ensureGradeCSS('), 'index.html must define ensureGradeCSS()');
    assert(html.includes('shared/grade.css'), 'ensureGradeCSS must reference shared/grade.css');
    // Called both while grade data is still loading and on the prewarmed /
    // kindergarten path, so every grade screen is styled exactly once needed.
    const renderSrc = html.slice(html.indexOf('function render() {'));
    assert(renderSrc.includes('ensureGradeCSS()'), 'render() must call ensureGradeCSS() for grade screens');
    console.log('✓ grade.css loads on demand through ensureGradeCSS() in the grade render path');
}

// 4. Offline still works: grade.css is precached and exists on disk.
{
    const shell = swSource.match(/const\s+APP_SHELL\s*=\s*\[([\s\S]*?)\];/)[1];
    assert(shell.includes('./shared/grade.css'), 'APP_SHELL must precache ./shared/grade.css');
    assert(fs.existsSync(path.join(ROOT, 'shared/grade.css')), 'precached grade.css must exist');
    console.log('✓ grade.css is precached for offline lessons');
}

console.log('\nAll CSS split tests PASSED! ✅');
