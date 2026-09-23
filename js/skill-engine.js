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

    // Spaced-review schedule: weak/error skills return quickly; stable skills spread out.
    const priorStreak = Number(prev.reviewStreak || 0);
    let reviewStreak = priorStreak;
    let reviewDays;
    if (!result.correct) {
      reviewStreak = 0;
      reviewDays = 0;
    } else if (!result.firstTry) {
      reviewStreak = Math.max(0, priorStreak);
      reviewDays = 1;
    } else {
      reviewStreak = priorStreak + 1;
      const intervals = [0, 1, 3, 7, 14, 30];
      reviewDays = intervals[Math.min(reviewStreak, intervals.length - 1)];
    }
    if (misconception && result.correct) reviewDays = Math.min(reviewDays, 1);
    const reviewAt = new Date(Date.now() + reviewDays * 86400000);
    prev.reviewStreak = reviewStreak;
    prev.reviewIntervalDays = reviewDays;
    prev.nextReviewAt = reviewAt.toISOString();

    progress.skillStats[meta.skillId] = prev;
    return prev;
  }

  function buildDailyMission(progress, options){
    options=options||{};
    const limit=Math.max(1,Math.min(8,Number(options.limit)||4));
    const stats=progress?.skillStats||{};
    const candidates=Object.values(stats);
    const now=Date.now();
    const due=candidates.filter(s=>s?.nextReviewAt && Date.parse(s.nextReviewAt)<=now);
    const weak=candidates.filter(s=>Number(s?.mastery||0)<60);
    const review=due.sort((a,b)=>(Number(a.mastery)||0)-(Number(b.mastery)||0));
    const focus=review.concat(weak.filter(s=>!review.includes(s)));
    const skills=focus.slice(0,limit).map(s=>({
      skillId:s.skillId, mastery:Number(s.mastery)||0,
      misconception:s.lastMisconception||null,
      action:(s.nextReviewAt && Date.parse(s.nextReviewAt)<=now)?'review':'practice'
    }));
    return {
      date:new Date().toISOString().slice(0,10),
      target:limit,
      skills,
      completed:0,
      reason:skills.length?'Focus on skills that need review or more practice.':'Build momentum with a new skill.'
    };
  }

  function tutorRecommendation(progress, q, context){
    const meta=describeQuestion(q,context);
    const skill=getSkillState(progress,meta);
    const attempts=skill?.attempts||0;
    const mastery=Number(skill?.mastery)||0;
    const misconception=skill?.lastMisconception||null;
    const wrong=(skill?.recent||[]).filter(x=>!x.correct).length;
    const labels={
      'tens-ones-confusion':'Remember: the tens digit tells how many groups of ten. The ones digit tells how many ones.',
      'digit-vs-value-confusion':'Look at the place: a digit can show a value of ones or tens.',
      'expanded-form-decomposition':'Break the number into tens and ones, then write the two values separately.',
      'place-value-comparison':'Compare the tens first. If the tens are equal, compare the ones.',
      'counting-direction':'Check whether the question asks for the number before or after.',
      'operation-selection-addition':'Look for clues such as more, gets, total, or altogether.',
      'operation-selection-subtraction':'Look for clues such as left, gave away, fewer, or how many remain.',
      'data-totaling':'Read each bar or count carefully before adding the data.',
      'shape-attribute-confusion':'Count the sides and look at the shape attributes instead of its name.',
      'hour-minute-confusion':'For an hour time, focus on the short hour hand.',
      'measurement-unit-confusion':'Compare the object and the measuring marks using the same unit.'
    };
    let mode='prompt', message='What clue can you use to solve this?';
    if(!skill || attempts===0){
      mode='model'; message='Let’s try one small step together.';
    } else if(misconception && labels[misconception]){
      mode='misconception'; message=labels[misconception];
    } else if(wrong>=2 || mastery<60){
      mode='scaffold'; message='Let’s slow down. Find one important clue, then solve one step.';
    } else if(mastery>=85){
      mode='challenge'; message='You know this skill. Explain how you found the answer.';
    } else if(skill.nextReviewAt && Date.parse(skill.nextReviewAt)<=Date.now()){
      mode='review'; message='This is a good time to remember this skill. What do you remember?';
    }
    return {mode,message,skillId:meta.skillId,mastery,misconception,attempts};
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
    if(skill.nextReviewAt){
      const due=Date.parse(skill.nextReviewAt) <= Date.now();
      if(due) score += 42;
      else score -= 10;
    }
    const desired=nextDifficulty(skill);
    const delta=Math.abs((meta.difficulty||1)-desired);
    score -= delta*10;
    return score + Math.random()*18;
  }

  function selectAdaptiveLessons(lessons, context, count){
    const pool=[...(lessons||[])];
    const target=Math.min(Number(count)||4,pool.length);
    if(!target) return [];
    const recentIds=new Set((context?.recentQuestionIds||[]).map(String));
    const recentSkills=new Set((context?.recentSkillIds||[]).map(String));
    const scored=pool.map(q=>{
      const meta=describeQuestion(q,context);
      let score=adaptiveScore(q,context);
      if(recentIds.has(String(q.id||q.lessonId||''))) score-=55;
      if(recentSkills.has(String(meta.skillId))) score-=8;
      // Prefer a small amount of repetition when the skill is weak or due.
      const st=getSkillState(context?.progress||{},meta);
      if(st && Number(st.mastery||0)<60) score+=8;
      if(st && st.nextReviewAt && Date.parse(st.nextReviewAt)<=Date.now()) score+=12;
      return {q,meta,score};
    }).sort((a,b)=>b.score-a.score);
    const chosen=[],seenSkills=new Set();
    // First pass: different skills, prioritizing weak/due/unseen skills.
    for(const item of scored){
      if(!seenSkills.has(item.meta.skillId)){
        chosen.push(item.q); seenSkills.add(item.meta.skillId);
        if(chosen.length===target) return chosen;
      }
    }
    for(const item of scored){
      if(chosen.length===target) break;
      if(!chosen.includes(item.q)) chosen.push(item.q);
    }
    return chosen;
  }

  function selectNextAdaptiveLesson(lessons, context){
    const pool=[...(lessons||[])];
    if(!pool.length)return null;
    const ranked=pool.map(q=>{
      const meta=describeQuestion(q,context);
      let score=adaptiveScore(q,context);
      const recentIds=new Set((context?.recentQuestionIds||[]).map(String));
      const recentSkills=new Set((context?.recentSkillIds||[]).map(String));
      if(recentIds.has(String(q.id||q.lessonId||''))) score-=70;
      if(recentSkills.has(String(meta.skillId))) score-=10;
      const st=getSkillState(context?.progress||{},meta);
      if(st && Number(st.mastery||0)<60) score+=10;
      if(st && st.nextReviewAt && Date.parse(st.nextReviewAt)<=Date.now()) score+=15;
      return {q,score};
    }).sort((a,b)=>b.score-a.score);
    return ranked[0]?.q || pool[0];
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
    selectNextAdaptiveLesson,
    tutorRecommendation,
    buildDailyMission,
    classifyMisconception,
    _slug: slug
  };
})();