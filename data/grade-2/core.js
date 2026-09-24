/* Grade 2 core interactive question banks. */
(function(){
  const banks={
    math:window.KC_G2_MATH || [],
    ela:window.KC_G2_ELA || [],
    science:window.KC_G2_SCIENCE || [],
    social:window.KC_G2_SOCIAL || [],
    writing:window.KC_G2_WRITING || []
  };
  function build(defs){
    return defs.map(d=>({unit:d[0],lessons:d[1].slice(0,30).map(q=>({title:q[0],prompt:q[0],choices:q[1],answer:q[2],hint:q[3]||'Use the clues and think about the skill in this unit.',explanation:q[4]||('The correct answer is '+q[2]+'.')}))}));
  }
  window.KC_G2_INTERACTIVE={math:build(banks.math),ela:build(banks.ela),science:build(banks.science),social:build(banks.social),writing:build(banks.writing)};
})();
