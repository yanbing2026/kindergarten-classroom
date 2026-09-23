(function(){
  'use strict';

  const VERSION = 1;

  function slug(value, fallback){
    const s = String(value || '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70);
    return s || fallback || 'skill';
  }

  const TYPE_MAP = {
    numberline: {concept:'number line', cognitive:'representation'},
    count: {concept:'counting and cardinality', cognitive:'procedural'},
    compare: {concept:'comparing numbers', cognitive:'reasoning'},
    shape: {concept:'shape attributes', cognitive:'classification'},
    clock: {concept:'telling time', cognitive:'application'},
    sortnumbers: {concept:'ordering numbers', cognitive:'reasoning'},
    graph: {concept:'data and graphs', cognitive:'interpretation'},
    wordproblem: {concept:'word problems', cognitive:'application'},
    tenframe: {concept:'ten frames and place value', cognitive:'representation'},
    measurement: {concept:'measurement', cognitive:'application'},
    choice: {concept:'conceptual understanding', cognitive:'reasoning'},
    text: {concept:'written response', cognitive:'communication'}
  };

  // Explicit Grade 1 taxonomy for adaptive learning.
  const G1_TITLE_SKILLS = {
    math: {
      'add within 20':'addition-within-20','subtract within 20':'subtraction-within-20','math story':'addition-within-20',
      'number after':'counting-to-120','number before':'counting-to-120','number between':'counting-to-120',
      'compare numbers':'compare-order-numbers','tens and ones':'tens-and-ones','ones place':'tens-and-ones',
      'expanded form':'tens-and-ones','build a number':'tens-and-ones',
      'measure length':'measure-length','compare length':'measure-length','tell time':'tell-time-hour',
      'read data':'data-counting','name a shape':'shape-attributes','count sides':'shape-attributes',
      'equal sides':'shape-attributes','shape parts':'shape-attributes','word problem':'addition-word-problems'
    },
    ela: {
      'short vowel sounds':'phonics-short-long-vowels','consonant blends':'phonics-blends','long vowel patterns':'phonics-short-long-vowels','decode a word':'phonics-short-long-vowels',
      'main idea':'main-idea','key details':'key-details','sequence':'sequence','inference':'inference',
      'synonyms':'synonyms-antonyms','antonyms':'synonyms-antonyms','context clues':'context-clues','word categories':'word-categories',
      'nouns and verbs':'nouns-verbs','capitalization':'capitalization','punctuation':'punctuation','pronouns':'pronouns',
      'complete sentence':'complete-sentence','add details':'add-details','story sequence':'story-sequence','revise a sentence':'revision-details',
      'ask a research question':'research-question','find a useful source':'source-selection','fact or opinion':'fact-opinion','share evidence':'evidence'
    },
    science: {
      'testable question':'testable-question','fair test':'fair-test','observation':'observation','improve a design':'engineering-revision',
      'living or nonliving?':'living-things','plant needs':'living-things','animal body parts':'plants-animals','offspring':'plants-animals',
      'plant parts':'plants-animals','animal homes':'plants-animals','animal movement':'plants-animals','life cycles':'plants-animals',
      'temperature':'weather-seasons','rain':'weather-seasons','seasons':'weather-seasons','weather choice':'weather-seasons',
      'light source':'light-sound','shadows':'light-sound','sound':'light-sound','loud and soft':'light-sound',
      'solid or liquid?':'matter-materials','materials':'matter-materials','push or pull':'matter-materials','choose a material':'matter-materials'
    }
  };

  function inferG1Skill(subject, title){
    const table=G1_TITLE_SKILLS[subject];
    if(!table) return null;
    return table[String(title||'').toLowerCase().trim()] || null;
  }

  function describeQuestion(q, context){
    q = q || {};
    context = context || {};
    const grade = slug(context.gradeId || context.gradeLevel,'grade');
    const subject = slug(context.subjectKey || context.subject || 'math','subject');
    const unit = slug(context.unitKey || context.unitTitle,'unit');
    const interaction = slug(q.interaction || q.type || 'choice','choice');
    const mapped = TYPE_MAP[interaction] || TYPE_MAP.choice;

    // Explicit metadata wins, then Grade 1 title taxonomy, then legacy fallback.
    const explicit = q.skillId || q.skill || q.skillKey;
    const inferredG1 = (grade === '1' || grade === 'grade-1' || grade === 'grade1')
      ? inferG1Skill(subject, q.title) : null;
    const skillId = explicit
      ? slug(explicit)
      : inferredG1
        ? 'grade1.' + subject + '.' + inferredG1
        : grade + '.' + subject + '.' + unit + '.' + slug(mapped.concept);

    const difficulty = Math.max(1, Math.min(5,
      Number(q.difficulty) || Number(context.difficulty) || (
        interaction === 'wordproblem' || interaction === 'graph' ? 3 :
        interaction === 'numberline' || interaction === 'compare' ? 2 : 1
      )
    ));

    return {
      version: VERSION,
      skillId,
      concept: q.skillName || inferredG1 || mapped.concept,
      interaction,
      difficulty,
      cognitiveLevel: q.cognitiveLevel || mapped.cognitive,
      prerequisite: q.prerequisite || null,
      misconception: q.misconception || null,
      standard: q.standard || null
    };
  }

  function updateSkillEvidence(progress, meta, result){
    if (!progress || !meta) return null;
    progress.skillStats = progress.skillStats || {};
    const prev = progress.skillStats[meta.skillId] || {
      skillId: meta.skillId,
      attempts: 0, correct: 0, firstTryCorrect: 0,
      mastery: 0, lastAttemptAt: null, recent: []
    };
    prev.attempts += 1;
    if (result.correct) prev.correct += 1;
    if (result.correct && result.firstTry) prev.firstTryCorrect += 1;
    // Bayesian-style smoothing prevents one lucky answer from claiming mastery.
    prev.mastery = Math.round(((prev.correct + 1) / (prev.attempts + 2)) * 100);
    prev.lastAttemptAt = new Date().toISOString();
    prev.recent = (prev.recent || []).concat([{
      at: prev.lastAttemptAt,
      correct: !!result.correct,
      firstTry: !!result.firstTry,
      difficulty: meta.difficulty,
      misconception: result.misconception || meta.misconception || null
    }]).slice(-12);
    progress.skillStats[meta.skillId] = prev;
    return prev;
  }

  function nextDifficulty(skill){
    if (!skill) return 2;
    if (skill.mastery >= 85 && skill.attempts >= 4) return Math.min(5, (skill.lastDifficulty || 2) + 1);
    if (skill.mastery < 60 && skill.attempts >= 2) return Math.max(1, (skill.lastDifficulty || 2) - 1);
    return skill.lastDifficulty || 2;
  }

  window.KCSkillEngine = {
    VERSION,
    describeQuestion,
    updateSkillEvidence,
    nextDifficulty,
    _slug: slug
  };
})();