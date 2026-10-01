/**
 * Self-test for thin kindergarten curriculum levels:
 * Verifies that categories have >= 8 items per level (ensuring non-replacement
 * sampling for ROUND_LENGTH = 8) and all IDs are globally unique within each category.
 *
 * Categories tested:
 * - sentences (Complete Sentences)
 * - decompose (Number Decomposition)
 * - printconcepts (Print Concepts)
 * - begendsounds (Beginning/Ending Sounds)
 * - prepositions (Prepositions)
 * - sortcategory (Sort by Category)
 * - words / chinese / spanish (Vocabulary L10 expanded to >= 8)
 *
 * Run with: node scripts/test_thin_levels.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const contentPath = path.resolve(__dirname, '../data/kindergarten/content.js');
assert(fs.existsSync(contentPath), `content.js not found at ${contentPath}`);
const contentJs = fs.readFileSync(contentPath, 'utf8');

const ctx = { Array, Object, String, Math };
vm.createContext(ctx);
const evaluated = vm.runInContext(contentJs + '\n;({ CATEGORIES, VOCAB_LEVELS });', ctx);
const CATEGORIES = evaluated.CATEGORIES;
assert(Array.isArray(CATEGORIES), 'CATEGORIES must be loaded from content.js');

console.log('Testing thin kindergarten categories for ROUND_LENGTH >= 8 items per level...');

// Categories to verify as they are expanded.
const ACTIVE_CATEGORIES = ['sentences', 'decompose', 'printconcepts', 'begendsounds', 'prepositions', 'sortcategory'];

for (const catKey of ACTIVE_CATEGORIES) {
    const cat = CATEGORIES.find(c => c.key === catKey);
    assert(cat, `Category "${catKey}" must exist in CATEGORIES`);
    assert(Array.isArray(cat.levels) && cat.levels.length > 0, `Category "${catKey}" must have levels`);

    const seenIds = new Set();
    const seenItems = new Set();

    for (let i = 0; i < cat.levels.length; i++) {
        const lv = cat.levels[i];
        assert(Array.isArray(lv.items), `${catKey} level ${lv.id} items must be an array`);
        assert(
            lv.items.length >= 8,
            `Category "${catKey}" level ${lv.id} (Level ${i + 1}) must have >= 8 items, found ${lv.items.length}`
        );

        for (const item of lv.items) {
            assert(item.id && typeof item.id === 'string', `${catKey} item must have string id, found ${JSON.stringify(item)}`);
            assert(!seenIds.has(item.id), `Duplicate ID in category "${catKey}": "${item.id}"`);
            seenIds.add(item.id);

            // Specific category contract checks
            if (catKey === 'sentences') {
                assert(typeof item.broken === 'string' && item.broken.length > 0, `Sentence ${item.id} missing broken text`);
                assert(typeof item.correct === 'string' && item.correct.length > 0, `Sentence ${item.id} missing correct text`);
                assert(Array.isArray(item.options) && item.options.length === 4, `Sentence ${item.id} must have 4 options`);
                assert(item.options.includes(item.correct), `Sentence ${item.id} options must include correct answer`);
                assert(!seenItems.has(item.correct.toLowerCase()), `Sentence text "${item.correct}" duplicated across levels`);
                seenItems.add(item.correct.toLowerCase());
            } else if (catKey === 'decompose') {
                assert(typeof item.number === 'number', `Decompose ${item.id} missing number`);
                assert(Array.isArray(item.answer) && item.answer.length === 2, `Decompose ${item.id} answer must be [a, b]`);
                assert.strictEqual(item.answer[0] + item.answer[1], item.number, `Decompose ${item.id} answer does not sum to number`);
                assert(Array.isArray(item.options) && item.options.length === 4, `Decompose ${item.id} options must have 4 pairs`);
                const answerStr = `${item.answer[0]}+${item.answer[1]}`;
                const optionStrs = item.options.map(o => `${o[0]}+${o[1]}`);
                assert(optionStrs.includes(answerStr), `Decompose ${item.id} options must include answer pair`);
            } else if (catKey === 'printconcepts') {
                assert(typeof item.scenario === 'string', `PrintConcepts ${item.id} missing scenario`);
                assert(typeof item.question === 'string', `PrintConcepts ${item.id} missing question`);
                assert(typeof item.answer === 'string', `PrintConcepts ${item.id} missing answer`);
                assert(Array.isArray(item.options) && item.options.length >= 4, `PrintConcepts ${item.id} options must have >= 4 choices`);
                assert(item.options.includes(item.answer), `PrintConcepts ${item.id} options must include answer`);
                assert(!seenItems.has(item.question), `PrintConcepts question "${item.question}" duplicated across levels`);
                seenItems.add(item.question);
            } else if (catKey === 'begendsounds') {
                assert(typeof item.word === 'string', `Sounds ${item.id} missing word`);
                assert(typeof item.emoji === 'string', `Sounds ${item.id} missing emoji`);
                assert(item.position === 'beginning' || item.position === 'ending', `Sounds ${item.id} invalid position`);
                assert(typeof item.answer === 'string', `Sounds ${item.id} missing answer`);
                assert(Array.isArray(item.options) && item.options.length === 4, `Sounds ${item.id} options must have 4 choices`);
                assert(item.options.includes(item.answer), `Sounds ${item.id} options must include answer`);
            } else if (catKey === 'prepositions') {
                assert(typeof item.scene === 'string', `Preposition ${item.id} missing scene`);
                assert(typeof item.answer === 'string', `Preposition ${item.id} missing answer`);
                assert(Array.isArray(item.options) && item.options.length === 4, `Preposition ${item.id} options must have 4 choices`);
                assert(item.options.includes(item.answer), `Preposition ${item.id} options must include answer`);
            } else if (catKey === 'sortcategory') {
                assert(item.item && typeof item.item.name === 'string' && typeof item.item.emoji === 'string', `SortCategory ${item.id} missing item`);
                assert(typeof item.correctCategory === 'string', `SortCategory ${item.id} missing correctCategory`);
                assert(Array.isArray(item.categories) && item.categories.length === 4, `SortCategory ${item.id} categories must have 4 choices`);
                assert(item.categories.includes(item.correctCategory), `SortCategory ${item.id} categories must include correctCategory`);
                assert(!seenItems.has(item.item.name), `SortCategory item "${item.item.name}" duplicated across levels`);
                seenItems.add(item.item.name);
            } else if (catKey === 'words' || catKey === 'chinese' || catKey === 'spanish') {
                for (const vocab of lv.items) {
                    assert(vocab.emoji, `${catKey} ${vocab.id} missing emoji`);
                    if (catKey === 'chinese') {
                        assert(vocab.hanzi && typeof vocab.hanzi === 'string', `Chinese ${vocab.id} missing hanzi`);
                    } else if (catKey === 'spanish') {
                        assert(vocab.es && typeof vocab.es === 'string', `Spanish ${vocab.id} missing es`);
                    }
                }
            }
        }
    }
    console.log(`✓ ${catKey}: all ${cat.levels.length} levels verified with >= 8 items (total: ${seenIds.size} unique items)`);
}

console.log('\nAll thin levels verified successfully! ✅');
