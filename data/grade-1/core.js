/* Grade 1 core-subject metadata build layer.
 *
 * The four source banks only carry presentation fields (title/prompt/choices/
 * answer/hint/explanation). Without stable ids the adaptive engine treated
 * every Grade 1 question as the same empty id, so review/recent-question
 * selection could not work. This layer mirrors data/grade-2/core.js at a
 * smaller scale: merge the extension bank, then attach ids and skill tags.
 */
(function () {
  'use strict';

  const SOURCES = {
    ela: 'KC_G1_ELA',
    science: 'KC_G1_SCIENCE',
    social: 'KC_G1_SOCIAL',
    writing: 'KC_G1_WRITING'
  };

  const SKILLS = {
    ela: {
      'short vowel sounds': 'phonics-vowels', 'consonant blends': 'phonics-blends',
      'long vowel patterns': 'phonics-vowels', 'decode a word': 'phonics-decoding',
      'ending sounds': 'phonics-ending-sounds', 'digraphs': 'phonics-digraphs',
      'two-syllable words': 'phonics-syllables', 'rhyming words': 'phonics-rhyme',
      'main idea': 'main-idea', 'key details': 'key-details', 'sequence': 'sequence',
      'inference': 'inference', 'retell a story': 'retell', 'character feelings': 'character-feelings',
      'compare texts': 'compare-texts', 'answer from text': 'text-evidence',
      'synonyms': 'synonyms-antonyms', 'antonyms': 'synonyms-antonyms',
      'context clues': 'context-clues', 'word categories': 'word-categories',
      'multiple-meaning words': 'multiple-meaning', 'shades of meaning': 'word-choice',
      'prefixes': 'prefixes', 'using a dictionary': 'dictionary',
      'nouns and verbs': 'nouns-verbs', 'capitalization': 'capitalization',
      'punctuation': 'punctuation', 'pronouns': 'pronouns', 'adjectives': 'adjectives',
      'subject-verb agreement': 'subject-verb', 'question marks': 'punctuation',
      'commas in a list': 'punctuation',
      'complete sentence': 'complete-sentence', 'add details': 'add-details',
      'story sequence': 'story-sequence', 'revise a sentence': 'revision',
      'narrative opening': 'narrative-opening', 'informative sentence': 'informative-sentence',
      'opinion reason': 'opinion-reason', 'edit for capitals': 'capitalization',
      'ask a research question': 'research-question', 'find a useful source': 'source-selection',
      'fact or opinion': 'fact-opinion', 'share evidence': 'evidence',
      'parts of a book': 'book-parts', 'use a diagram': 'diagram',
      'compare two facts': 'compare-facts', 'cite a source': 'source-selection'
    },
    science: {
      'living or nonliving?': 'living-things', 'plant needs': 'living-things',
      'animal body parts': 'plants-animals', 'offspring': 'plants-animals',
      'plant parts': 'plants-animals', 'animal homes': 'plants-animals',
      'animal movement': 'plants-animals', 'life cycles': 'plants-animals',
      'basic needs': 'living-things', 'grow and change': 'living-things',
      'respond to the world': 'living-things', 'sort living and nonliving': 'living-things',
      'pollination': 'plants-animals', 'parents and offspring': 'plants-animals',
      'camouflage': 'plants-animals', 'food chains': 'plants-animals',
      'temperature': 'weather-seasons', 'rain': 'weather-seasons', 'seasons': 'weather-seasons',
      'weather choice': 'weather-seasons', 'weather patterns': 'weather-seasons',
      'seasonal clothing': 'weather-seasons', 'severe weather': 'weather-seasons',
      'seasons in order': 'weather-seasons',
      'light source': 'light-sound', 'shadows': 'light-sound', 'sound': 'light-sound',
      'loud and soft': 'light-sound', 'transparent or opaque': 'light-sound',
      'light and materials': 'light-sound', 'vibration and pitch': 'light-sound', 'echoes': 'light-sound',
      'solid or liquid?': 'matter-materials', 'materials': 'matter-materials',
      'push or pull': 'matter-materials', 'choose a material': 'matter-materials',
      'states of matter': 'matter-materials', 'reversible change': 'matter-materials',
      'sink or float': 'matter-materials', 'properties sort': 'matter-materials',
      'testable question': 'testable-question', 'fair test': 'fair-test',
      'observation': 'observation', 'improve a design': 'engineering-revision',
      'measure results': 'measure-results', 'compare designs': 'engineering-revision',
      'record data': 'record-data', 'use evidence': 'evidence'
    },
    social: {
      'community': 'community', 'community helpers': 'community-helpers',
      'needs and wants': 'needs-wants', 'traditions': 'traditions',
      'family roles': 'family-roles', 'community places': 'community-places',
      'volunteering': 'volunteering', 'celebrations': 'traditions',
      'map purpose': 'maps', 'map symbols': 'maps', 'near and far': 'maps',
      'directions': 'maps', 'map key': 'maps', 'cardinal directions': 'maps',
      'land and water': 'maps', 'draw a route': 'maps',
      'why rules?': 'rules', 'fairness': 'fairness', 'civic responsibility': 'civic-responsibility',
      'leaders': 'leaders', 'home and school rules': 'rules', 'laws': 'laws',
      'voting': 'voting', 'services': 'services',
      'past and present': 'then-now', 'change over time': 'then-now',
      'historical source': 'sources', 'timeline': 'timeline', 'then and now': 'then-now',
      'primary sources': 'sources', 'sequencing events': 'timeline', 'community change': 'then-now',
      'goods and services': 'goods-services', 'saving': 'saving', 'choices': 'choices',
      'spend or save': 'saving', 'wants and needs': 'needs-wants',
      'producers': 'producers', 'barter': 'trade',
      'respect': 'respect', 'classroom citizenship': 'citizenship',
      'different perspectives': 'perspectives', 'community pride': 'citizenship',
      'culture': 'culture', 'helping the community': 'citizenship', 'rules at home': 'rules'
    },
    writing: {
      'choose the complete sentence': 'complete-sentence', 'put the words in order': 'word-order',
      'choose the best word': 'word-choice', 'build a sentence': 'complete-sentence',
      'subject and predicate': 'complete-sentence', 'end punctuation': 'punctuation',
      'word order': 'word-order', 'complete thought': 'complete-sentence',
      'choose the topic sentence': 'topic-sentence', 'put the paragraph in order': 'paragraph-order',
      'choose the best connector': 'connectors', 'write two sentences': 'paragraph-writing',
      'supporting sentences': 'supporting-details', 'concluding sentence': 'conclusion',
      'indent': 'paragraph-format', 'stay on topic': 'topic-sentence',
      'choose the beginning': 'narrative-opening', 'order the story': 'story-sequence',
      'choose a strong detail': 'details', 'write a short story': 'narrative-writing',
      'characters': 'characters', 'setting': 'setting', 'problem and solution': 'problem-solution',
      'temporal words': 'story-sequence',
      'choose a fact': 'facts', 'organize the explanation': 'informative-structure',
      'choose the precise word': 'word-choice', 'explain a topic': 'informative-writing',
      'topic and facts': 'facts', 'definitions': 'definitions', 'compare': 'compare-contrast',
      'diagram labels': 'labels',
      'choose the opinion': 'opinion', 'build an opinion': 'opinion',
      'choose the reason': 'reasons', 'write an opinion': 'opinion-writing',
      'state opinion': 'opinion', 'give two reasons': 'reasons',
      'address the reader': 'audience', 'word choice': 'word-choice',
      'fix the capital letter': 'capitalization', 'build a correct sentence': 'sentence-editing',
      'choose the correct punctuation': 'punctuation', 'revise your sentence': 'revision',
      'spelling': 'spelling', 'verb tense': 'verb-tense', 'combine sentences': 'sentence-combining',
      'peer feedback': 'feedback'
    }
  };

  const slug = (value, fallback) => String(value || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || fallback || 'unit';

  function difficultyOf(q) {
    const words = String(q.prompt || '').split(/\s+/).filter(Boolean).length;
    if (words >= 16 || /why|how|compare|explain|best/i.test(q.prompt || '')) return 3;
    if (words >= 10) return 2;
    return 1;
  }

  function normalize(subject, units) {
    return (units || []).map((unit, unitIndex) => {
      const unitTitle = String(unit.unit || ('Unit ' + (unitIndex + 1)));
      const unitKey = slug(unitTitle, 'unit-' + (unitIndex + 1));
      return {
        unit: unitTitle,
        unitKey,
        schemaVersion: 1,
        lessons: (unit.lessons || []).map((q, questionIndex) => {
          const title = String(q.title || '');
          return Object.assign({}, q, {
            schemaVersion: 1,
            id: 'g1.' + subject + '.' + unitKey + '.q' + String(questionIndex + 1).padStart(2, '0'),
            gradeId: 'g1',
            subjectKey: subject,
            unitKey,
            unitIndex,
            questionIndex,
            skillId: (SKILLS[subject] || {})[title.toLowerCase()] || ('g1.' + subject + '.' + unitKey),
            difficulty: q.difficulty || difficultyOf(q),
            cognitiveLevel: q.cognitiveLevel || (/write|explain|compare/i.test(title) ? 'reason' : 'understand'),
            interaction: q.type || 'choice'
          });
        })
      };
    });
  }

  function merged(subject, key) {
    const base = Array.isArray(window[key]) ? window[key] : [];
    if (base.some((unit) => unit && unit.schemaVersion === 1)) return base;
    const extra = (window.KC_G1_EXTRA && window.KC_G1_EXTRA[subject]) || {};
    return base.map((unit) => {
      const additions = extra[unit.unit] || [];
      return {
        unit: unit.unit,
        lessons: [].concat(unit.lessons || [], additions)
      };
    });
  }

  const banks = {};
  Object.entries(SOURCES).forEach(([subject, key]) => {
    banks[subject] = normalize(subject, merged(subject, key));
  });

  window.KC_G1_CORE = banks;
  // Keep the original globals populated so older cached pages and the
  // existing index.html wiring keep working without a second code path.
  window.KC_G1_ELA = banks.ela;
  window.KC_G1_SCIENCE = banks.science;
  window.KC_G1_SOCIAL = banks.social;
  window.KC_G1_WRITING = banks.writing;
})();
