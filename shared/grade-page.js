/* Shared Grade Page bootstrap.
   Directs entry from standalone grade URLs to the main classroom engine with grade pre-selected.
   Using window.location.replace removes the nested iframe, enabling native touch gestures,
   preventing iOS scroll/viewport conflicts, and ensuring Web Speech TTS works unrestricted.
*/
window.KC_GRADE_PAGE = {
  mount: function (config) {
    if (!config || !config.engineUrl) return;
    const host = document.getElementById("kc-grade-app");
    if (host) {
      host.innerHTML = '<div style="padding:32px;text-align:center"><strong>' +
        (config.label || 'Classroom') +
        '</strong><p>Loading classroom…</p><p><a href="' +
        config.engineUrl +
        '">Click here if not redirected automatically.</a></p></div>';
    }
    try {
      window.location.replace(config.engineUrl);
    } catch (_) {
      window.location.href = config.engineUrl;
    }
  }
};
