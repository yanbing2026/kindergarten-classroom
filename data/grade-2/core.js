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
    return defs.map(d=>({unit:d[0],lessons:Array.from({length:30},(_,n)=>{const q=d[1][n%d[1].length];return {title:q[0],prompt:q[0],choices:q[1],answer:q[2],hint:'Use the clues and think about the skill in this unit.',explanation:'The correct answer is '+q[2]+'.'};})}));
  }
  window.KC_G2_INTERACTIVE={math:build(banks.math),ela:build(banks.ela),science:build(banks.science),social:build(banks.social),writing:build(banks.writing)};
})();
