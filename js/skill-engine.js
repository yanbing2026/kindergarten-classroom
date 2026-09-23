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

  function describeQuestion(q, context){
    q = q || {};
    context = context || {};
    const grade = slug(context.gradeId || context.gradeLevel,'grade');
    const subject = slug(context.subjectKey || context.subject || 'math','subject');
    const unit = slug(context.unitKey || context.unitTitle,'unit');
    const interaction = slug(q.interaction || q.type || 'choice','choice');
    const mapped = TYPE_MAP[interaction] || TYPE_MAP.choice;

    // Explicit skill metadata wins. Existing question banks remain compatible.
    const explicit = q.skillId || q.skill || q.skillKey;
    const skillId = explicit
      ? slug(explicit)
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
      concept: q.skillName || mapped.concept,
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