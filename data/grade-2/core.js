/* Grade 2 core interactive question banks. */
(function(){
  'use strict';

  const banks={
    math:window.KC_G2_MATH || [],
    ela:window.KC_G2_ELA || [],
    science:window.KC_G2_SCIENCE || [],
    social:window.KC_G2_SOCIAL || [],
    writing:window.KC_G2_WRITING || []
  };

  function slug(value, fallback){
    const s=String(value||'').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70);
    return s || fallback || 'unit';
  }

  // Normalize the legacy compact bank into a stable question schema once at load time.
  // Stable IDs are important for adaptive sampling, deduplication, progress tracking,
  // remediation history, and future question-level analytics.
  function build(defs, subject){
    return defs.map((d,unitIndex)=>{
      const unitTitle=String(d[0]||('Unit '+(unitIndex+1)));
      const unitKey=slug(unitTitle,'unit-'+(unitIndex+1));
      return {
        unit:unitTitle,
        unitKey,
        lessons:(d[1]||[]).slice(0,30).map((q,questionIndex)=>{
          const prompt=String(q[0]||'');
          const choices=Array.isArray(q[1]) ? q[1].slice() : [];
          const answer=q[2];
          return {
            schemaVersion:1,
            id:'g2.'+subject+'.'+unitKey+'.q'+String(questionIndex+1).padStart(2,'0'),
            gradeId:'g2',
            subjectKey:subject,
            unitKey,
            unitIndex,
            questionIndex,
            title:prompt,
            prompt,
            choices,
            answer,
            hint:q[3]||'Use the clues and think about the skill in this unit.',
            explanation:q[4]||('The correct answer is '+answer+'.')
          };
        })
      };
    });
  }

  window.KC_G2_INTERACTIVE={
    math:build(banks.math,'math'),
    ela:build(banks.ela,'ela'),
    science:build(banks.science,'science'),
    social:build(banks.social,'social'),
    writing:build(banks.writing,'writing')
  };
})();
