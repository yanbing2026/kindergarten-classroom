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
    const inferredG1 = (grade === '1' || grade === 'g1' || grade === 'grade-1' || grade === 'grade1')
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

  function classifyMisconception(q, result){
    if(!q || !result || result.correct) return null;
    const title=String(q.title||'').toLowerCase();
    const selected=String(result.selectedAnswer ?? '').trim();
    const answer=String(q.answer ?? '').trim();
    if(title==='tens and ones' && selected && answer){
      const n=Number(q.prompt?.match(/\\d+/)?.[0]);
      if(Number.isFinite(n)){
        const tens=Math.floor(n/10), ones=n%10;
        if(selected===String(ones)) return 'tens-ones-confusion';
        if(selected===String(tens*10)) return 'digit-vs-value-confusion';
      }
    }
    if(title==='ones place' && selected && selected===String(Math.floor(Number(q.prompt?.match(/\\d+/)?.[0]||0)/10))) return 'tens-ones-confusion';
    if(title==='expanded form' && selected && /\\+/.test(selected)) return 'expanded-form-decomposition';
    if(title==='compare numbers' && selected) return 'place-value-comparison';
    if(title==='number after' && selected && Number(selected)===Number(answer)-1) return 'counting-direction';
    if(title==='number before' && selected && Number(selected)===Number(answer)+1) return 'counting-direction';
    if(title==='word problem'){
      const prompt=String(q.prompt||'').toLowerCase();
      if(/gets|more|total|altogether/.test(prompt)) return 'operation-selection-addition';
      if(/left|eats|gave away|fewer/.test(prompt)) return 'operation-selection-subtraction';
    }
    if(title==='read data') return 'data-totaling';
    if(title==='name a shape'||title==='count sides'||title==='equal sides'||title==='shape parts') return 'shape-attribute-confusion';
    if(title==='tell time') return 'hour-minute-confusion';
    if(title==='measure length'||title==='compare length') return 'measurement-unit-confusion';
    if(title==='main idea') return 'main-idea-vs-detail';
    if(title==='key details') return 'detail-location';
    if(title==='sequence'||title==='story sequence') return 'event-order';
    if(title==='inference') return 'inference-from-evidence';
    if(title==='synonyms'||title==='antonyms') return 'word-meaning-confusion';
    if(title==='context clues') return 'context-clue-use';
    if(title==='nouns and verbs') return 'part-of-speech-confusion';
    if(title==='capitalization') return 'capitalization-rule';
    if(title==='punctuation') return 'punctuation-choice';
    if(title==='testable question') return 'testability-confusion';
    if(title==='fair test') return 'controlled-variable-confusion';
    if(title==='observation') return 'observation-vs-guess';
    if(title==='living or nonliving?'||title==='plant needs') return 'living-needs-confusion';
    if(title==='temperature') return 'measurement-tool-confusion';
    if(title==='seasons') return 'season-order-confusion';
    if(title==='light source'||title==='shadows'||title==='sound') return 'light-sound-concept-confusion';
    if(title==='solid or liquid?'||title==='materials') return 'matter-property-confusion';
    return 'concept-misunderstanding';
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
    const misconception = result.misconception || meta.misconception || classifyMisconception(result.question, result);
    prev.misconceptions = prev.misconceptions || {};
    if (misconception) prev.misconceptions[misconception] = (prev.misconceptions[misconception] || 0) + 1;
    prev.recent = (prev.recent || []).concat([{
      at: prev.lastAttemptAt,
      correct: !!result.correct,
      firstTry: !!result.firstTry,
      difficulty: meta.difficulty,
      misconception
    }]).slice(-12);
    if (misconception) prev.lastMisconception = misconception;
    progress.skillStats[meta.skillId] = prev;
    return prev;
  }

  function getSkillState(progress, meta){
    return progress?.skillStats?.[meta?.skillId] || null;
  }

  function adaptiveScore(q, context){
    const progress=context?.progress || {};
    const meta=describeQuestion(q, context);
    const skill=getSkillState(progress, meta);
    if(!skill) return 50 + Math.random()*20;
    const mastery=Number(skill.mastery)||0;
    let score=(100-mastery);
    const last=skill.recent?.[skill.recent.length-1];
    if(last && !last.correct) score += 28;
    if(skill.lastMisconception) score += 12;
    if((skill.attempts||0)===0) score += 18;
    const desired=nextDifficulty(skill);
    const delta=Math.abs((meta.difficulty||1)-desired);
    score -= delta*10;
    return score + Math.random()*18;
  }

  function selectAdaptiveLessons(lessons, context, count){
    const pool=[...(lessons||[])];
    const target=Math.min(Number(count)||4,pool.length);
    if(!target) return [];
    const scored=pool.map(q=>({q,score:adaptiveScore(q,context)}))
      .sort((a,b)=>b.score-a.score);
    const chosen=[];
    const seenSkills=new Set();
    // First pass: cover different weak/unseen skills when possible.
    for(const item of scored){
      const meta=describeQuestion(item.q,context);
      if(!seenSkills.has(meta.skillId)){
        chosen.push(item.q); seenSkills.add(meta.skillId);
        if(chosen.length===target) return chosen;
      }
    }
    for(const item of scored){
      if(chosen.length===target) break;
      if(!chosen.includes(item.q)) chosen.push(item.q);
    }
    return chosen;
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
    adaptiveScore,
    selectAdaptiveLessons,
    classifyMisconception,
    _slug: slug
  };
})();