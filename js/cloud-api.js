(function () {
  'use strict';

  // BlockQuest Classroom - Cloud Client Transport Layer
  // Backed by Cloudflare Worker + D1 (docs/cloud-backend-d1.md, worker/src/index.js)
  // Zero external dependencies, offline-first. Never logs tokens or verifiers.

  var DEFAULT_BASE_URL = 'https://blockquest-api.yanbing2004.workers.dev';
  var TOKEN_KEY = 'kc_cloud_token_v1';
  var TIMEOUT_MS = 10000;

  var customFetch = null;

  function getStorage() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        return localStorage;
      }
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && window && window.localStorage) {
        return window.localStorage;
      }
    } catch (_) {}
    return null;
  }

  function getToken() {
    var storage = getStorage();
    if (!storage) return null;
    try {
      var t = storage.getItem(TOKEN_KEY);
      return (typeof t === 'string' && t) ? t : null;
    } catch (_) {
      return null;
    }
  }

  function hasToken() {
    return !!getToken();
  }

  function setToken(token) {
    var storage = getStorage();
    if (!storage) return;
    try {
      if (token) {
        storage.setItem(TOKEN_KEY, String(token));
      } else {
        storage.removeItem(TOKEN_KEY);
      }
    } catch (_) {}
  }

  function clearToken() {
    var storage = getStorage();
    if (!storage) return;
    try {
      storage.removeItem(TOKEN_KEY);
    } catch (_) {}
  }

  function getFetch() {
    if (customFetch) return customFetch;
    if (typeof fetch === 'function') return fetch;
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      return window.fetch.bind(window);
    }
    return null;
  }

  function _setFetch(fn) {
    var prev = customFetch || getFetch();
    customFetch = fn;
    return prev;
  }

  function setBaseUrl(url) {
    KCCloud.BASE_URL = String(url || '');
  }

  async function request(path, options) {
    options = options || {};
    var fetchFn = getFetch();
    if (typeof fetchFn !== 'function') {
      return { ok: false, error: 'offline' };
    }

    var baseUrl = (KCCloud.BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    var url = baseUrl + path;
    var method = (options.method || 'GET').toUpperCase();

    var headers = Object.assign({
      'Content-Type': 'application/json'
    }, options.headers);

    var token = getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = null;
    if (controller) {
      timer = setTimeout(function () {
        try {
          controller.abort();
        } catch (_) {}
      }, TIMEOUT_MS);
      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
    }

    var res;
    try {
      var fetchOptions = {
        method: method,
        headers: headers
      };
      if (options.body !== undefined) {
        fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      }
      if (controller) {
        fetchOptions.signal = controller.signal;
      }
      res = await fetchFn(url, fetchOptions);
    } catch (_) {
      return { ok: false, error: 'offline' };
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }

    var data;
    try {
      data = await res.json();
    } catch (_) {
      if (res && res.status >= 400) {
        return { ok: false, error: 'server_error' };
      }
      return { ok: false, error: 'offline' };
    }

    var isOk = res && typeof res.ok === 'boolean' ? res.ok : (res && res.status >= 200 && res.status < 300);

    if (!isOk) {
      var error = (data && typeof data.error === 'string' && data.error) ? data.error : 'server_error';
      if (res && res.status === 401 && (error === 'unauthorized' || error === 'token_expired')) {
        clearToken();
      }
      return { ok: false, error: error };
    }

    return data;
  }

  async function salt(name) {
    return request('/salt', {
      method: 'POST',
      body: { name: name }
    });
  }

  async function create(name, pinVerifier, saltVal, progress) {
    var body = {
      name: name,
      pinVerifier: pinVerifier,
      salt: saltVal
    };
    if (progress !== undefined) {
      body.progress = progress;
    }
    var res = await request('/create', {
      method: 'POST',
      body: body
    });
    if (res && res.ok && res.token) {
      setToken(res.token);
    }
    return res;
  }

  async function login(name, pinVerifier) {
    var res = await request('/login', {
      method: 'POST',
      body: {
        name: name,
        pinVerifier: pinVerifier
      }
    });
    if (res && res.ok && res.token) {
      setToken(res.token);
    }
    return res;
  }

  async function me() {
    return request('/me', {
      method: 'GET'
    });
  }

  async function saveProgress(progress) {
    return request('/progress', {
      method: 'POST',
      body: {
        progress: progress !== undefined ? progress : {}
      }
    });
  }

  async function rotatePin(oldVerifier, newVerifier, newSalt) {
    var res = await request('/pin', {
      method: 'POST',
      body: {
        oldVerifier: oldVerifier,
        newVerifier: newVerifier,
        newSalt: newSalt
      }
    });
    if (res && res.ok && res.token) {
      setToken(res.token);
    }
    return res;
  }

  async function deletePlayer(pinVerifier) {
    return request('/player', {
      method: 'DELETE',
      body: {
        pinVerifier: pinVerifier
      }
    });
  }

  async function sendEvents(events) {
    if (!Array.isArray(events) || events.length === 0) {
      return { ok: true, accepted: 0 };
    }
    var totalAccepted = 0;
    var batchSize = 50;
    for (var i = 0; i < events.length; i += batchSize) {
      var batch = events.slice(i, i + batchSize);
      var res = await request('/events', {
        method: 'POST',
        body: { events: batch }
      });
      if (!res || !res.ok) {
        return {
          ok: false,
          error: (res && res.error) ? res.error : 'server_error',
          accepted: totalAccepted
        };
      }
      var count = (typeof res.accepted === 'number') ? res.accepted : batch.length;
      totalAccepted += count;
    }
    return { ok: true, accepted: totalAccepted };
  }

  async function report(days) {
    var d = 30;
    if (typeof days === 'number' && days > 0) {
      d = days;
    } else if (typeof days === 'string' && days.trim()) {
      var parsed = parseInt(days, 10);
      if (!isNaN(parsed) && parsed > 0) {
        d = parsed;
      }
    }
    return request('/report?days=' + encodeURIComponent(d), {
      method: 'GET'
    });
  }

  var KCCloud = {
    BASE_URL: DEFAULT_BASE_URL,
    setBaseUrl: setBaseUrl,
    _setFetch: _setFetch,
    hasToken: hasToken,
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,
    salt: salt,
    create: create,
    login: login,
    me: me,
    saveProgress: saveProgress,
    rotatePin: rotatePin,
    deletePlayer: deletePlayer,
    sendEvents: sendEvents,
    report: report
  };

  if (typeof window !== 'undefined') {
    window.KCCloud = KCCloud;
  } else if (typeof global !== 'undefined') {
    global.KCCloud = KCCloud;
  }
})();
