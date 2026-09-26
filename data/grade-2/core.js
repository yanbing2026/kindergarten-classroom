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

  /*
   * Grade 2 metadata is normalized here, at bank-build time, rather than being
   * guessed later by the adaptive engine. This keeps the runtime question
   * objects stable for analytics, remediation, review scheduling and exports.
   */
  const RULES={
    math:[
      [/place value|value of|hundreds|tens|ones|expanded form|digit/i,'place-value'],
      [/greater|less|smallest|largest|compare|order/i,'compare-order'],
      [/count by|skip count|number after|number before|number between|next number/i,'counting-patterns'],
      [/odd|even/i,'odd-even'],
      [/add|sum|total|altogether|in all|more than/i,'addition'],
      [/subtract|difference|left|remain|gave away|fewer/i,'subtraction'],
      [/multiply|groups of|each group|times/i,'early-multiplication'],
      [/divide|share equally|equal groups/i,'early-division'],
      [/money|coins|dollar|cents|change/i,'money'],
      [/time|clock|minute|hour/i,'time'],
      [/length|measure|inch|centimeter|ruler/i,'measurement'],
      [/shape|sides|vertices|angles|partition|halves|thirds|fourths/i,'geometry'],
      [/graph|bar|data|table|survey|most|least/i,'data-graphs'],
      [/pattern|rule|sequence/i,'patterns'],
      [/fraction|equal parts/i,'fractions'],
      [/word problem|story|altogether|how many/i,'word-problems']
    ],
    ela:[
      [/setting|character|problem|solution|lesson|beginning|middle|ending|theme|dialogue|quotation/i,'story-elements'],
      [/main idea|central idea/i,'main-idea'],
      [/detail|supporting detail|key detail/i,'key-details'],
      [/sequence|first|next|then|last|order/i,'sequence'],
      [/infer|probably|likely|what does.*tell|evidence/i,'inference'],
      [/meaning|context clue|synonym|antonym|word/i,'vocabulary'],
      [/noun|verb|pronoun|adjective|capital|punctuation|sentence/i,'language-conventions'],
      [/prefix|suffix|vowel|syllable|blend|sound|spell|decode/i,'phonics-word-study'],
      [/fact|opinion|source|research|evidence/i,'research-evidence']
    ],
    science:[
      [/solid|liquid|gas|matter|melt|freeze|steam|material|float|sink|bend|hard/i,'matter-properties'],
      [/plant|seed|root|stem|leaf|flower|animal|offspring|life cycle|habitat/i,'living-things'],
      [/weather|season|temperature|rain|cloud|wind/i,'weather-seasons'],
      [/sun|moon|shadow|light|sound|vibration/i,'light-sound'],
      [/push|pull|force|motion|move|speed/i,'forces-motion'],
      [/earth|rock|soil|land|water|erosion/i,'earth-systems'],
      [/observe|question|test|experiment|fair|data|evidence/i,'science-practices'],
      [/design|build|engineer|improve|solution/i,'engineering-design']
    ],
    social:[
      [/mayor|governor|president|government|law|rule|vote|community|citizen/i,'civics-government'],
      [/map|direction|north|south|east|west|location|region/i,'geography'],
      [/past|long ago|history|old|timeline|before|after/i,'history'],
      [/money|buy|sell|trade|job|worker|resource|need|want/i,'economics'],
      [/family|culture|tradition|holiday|celebrat|heritage/i,'culture-community'],
      [/community|neighborhood|service|worker|school/i,'community-life']
    ],
    writing:[
      [/topic sentence|main idea/i,'paragraph-main-idea'],
      [/supporting detail|detail|evidence/i,'supporting-details'],
      [/closing sentence|conclusion|ending/i,'conclusions'],
      [/first|next|then|last|sequence|order/i,'sequencing'],
      [/edit|revise|rewrite|grammar|punctuation|capital|spelling/i,'editing-revision'],
      [/fact|opinion|reason|evidence|support/i,'claims-evidence'],
      [/sentence|complete sentence|fragment/i,'sentence-structure'],
      [/paragraph|organize|coherence/i,'paragraph-organization']
    ]
  };

  const COGNITIVE_RULES=[
    [/which|what is|who|where|when|name|identify/i,'remember'],
    [/choose|select|sort|classify|match|compare|difference|similar/i,'analyze'],
    [/explain|why|how|meaning|lesson|main idea|infer|evidence/i,'reason'],
    [/solve|calculate|find|measure|use|apply/i,'apply'],
    [/revise|edit|improve|write|best sentence|support/i,'create']
  ];

  function deriveSkill(subject,unitKey,prompt){
    const rules=RULES[subject]||[];
    const text=String(prompt||'');
    for(const [re,key] of rules) if(re.test(text)) return 'g2.'+subject+'.'+key;
    return 'g2.'+subject+'.'+unitKey;
  }

  function deriveDifficulty(subject,prompt,interaction){
    const text=String(prompt||'');
    let d=2;
    if(/word problem|multi-step|explain|evidence|infer|compare|best|why|how/i.test(text)) d=3;
    if(/two-step|multiple|justify|revise|support.*reason|choose.*evidence/i.test(text)) d=4;
    if(/calculate|solve|measure|order|add|subtract|multiply|divide/i.test(text)) d=Math.max(d,3);
    if(/picture|which of these|what is|who|where|when/i.test(text)) d=Math.min(d,2);
    if(interaction==='graph'||interaction==='wordproblem') d=Math.max(d,3);
    return Math.max(1,Math.min(5,d));
  }

  function deriveCognitive(prompt){
    const text=String(prompt||'');
    for(const [re,key] of COGNITIVE_RULES) if(re.test(text)) return key;
    return 'understand';
  }

  function misconceptionFor(subject,skillId){
    const map={
      'g2.math.place-value':'place-value-confusion',
      'g2.math.compare-order':'place-value-comparison',
      'g2.math.counting-patterns':'counting-direction',
      'g2.math.addition':'operation-selection-addition',
      'g2.math.subtraction':'operation-selection-subtraction',
      'g2.math.time':'hour-minute-confusion',
      'g2.math.measurement':'measurement-unit-confusion',
      'g2.math.data-graphs':'data-totaling',
      'g2.math.geometry':'shape-attribute-confusion',
      'g2.ela.story-elements':'story-element-confusion',
      'g2.ela.main-idea':'main-idea-vs-detail',
      'g2.ela.key-details':'detail-location',
      'g2.ela.sequence':'event-order',
      'g2.ela.inference':'inference-from-evidence',
      'g2.ela.vocabulary':'word-meaning-confusion',
      'g2.ela.language-conventions':'language-rule-confusion',
      'g2.ela.phonics-word-study':'phonics-pattern-confusion',
      'g2.ela.research-evidence':'evidence-selection',
      'g2.science.matter-properties':'matter-property-confusion',
      'g2.science.living-things':'living-needs-confusion',
      'g2.science.weather-seasons':'weather-season-confusion',
      'g2.science.light-sound':'light-sound-concept-confusion',
      'g2.science.forces-motion':'force-motion-confusion',
      'g2.science.earth-systems':'earth-system-confusion',
      'g2.science.science-practices':'observation-vs-guess',
      'g2.science.engineering-design':'design-criteria-confusion',
      'g2.social.civics-government':'civics-role-confusion',
      'g2.social.geography':'map-direction-confusion',
      'g2.social.history':'time-order-confusion',
      'g2.social.economics':'needs-wants-confusion',
      'g2.social.culture-community':'culture-tradition-confusion',
      'g2.social.community-life':'community-role-confusion',
      'g2.writing.paragraph-main-idea':'topic-sentence-confusion',
      'g2.writing.supporting-details':'supporting-detail-confusion',
      'g2.writing.conclusions':'closing-sentence-confusion',
      'g2.writing.sequencing':'sequence-word-confusion',
      'g2.writing.editing-revision':'editing-rule-confusion',
      'g2.writing.claims-evidence':'evidence-support-confusion',
      'g2.writing.sentence-structure':'sentence-structure-confusion',
      'g2.writing.paragraph-organization':'paragraph-organization-confusion'
    };
    const value=map[skillId];
    return value?[value]:[];
  }

  function build(defs,subject){
    return defs.map((d,unitIndex)=>{
      const unitTitle=String(d[0]||('Unit '+(unitIndex+1)));
      const unitKey=slug(unitTitle,'unit-'+(unitIndex+1));
      const lessons=Array.isArray(d[1])?d[1]:[];
      return {
        unit:unitTitle,
        unitKey,
        schemaVersion:1,
        lessons:lessons.map((q,questionIndex)=>{
          const prompt=String(q[0]||'');
          const choices=Array.isArray(q[1])?q[1].slice():[];
          const answer=q[2];
          const interaction=Array.isArray(q[1])&&q[1].length===4?'choice':'choice';
          const skillId=deriveSkill(subject,unitKey,prompt);
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
            skillId,
            skillName:skillId.split('.').slice(-1)[0].replace(/-/g,' '),
            difficulty:deriveDifficulty(subject,prompt,interaction),
            cognitiveLevel:deriveCognitive(prompt),
            misconceptionTargets:misconceptionFor(subject,skillId),
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
