/* Blipola Voice v1 — offline browser speech layer
 * TTS stays in the host app. This module adds microphone input and a small
 * adapter that maps a child's spoken answer to an existing choice.
 */
(function () {
  'use strict';

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const state = { listening: false, recognition: null };

  function supported() {
    return !!SpeechRecognition;
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[“”"'.,!?;:，。！？；：]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function languageFor(question) {
    const lang = (question && question.lang) || 'en-US';
    if (lang.startsWith('zh')) return 'zh-CN';
    if (lang.startsWith('es')) return 'es-US';
    return 'en-US';
  }

  function setUI(text, active) {
    const btn = document.getElementById('blipolaVoiceBtn');
    const status = document.getElementById('blipolaVoiceStatus');
    if (btn) {
      btn.textContent = active ? '🛑 Stop' : '🎤 Speak';
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    if (status) status.textContent = text || '';
  }

  function stop() {
    if (state.recognition) {
      try { state.recognition.abort(); } catch (e) {}
      state.recognition = null;
    }
    state.listening = false;
    setUI('Tap Speak and answer out loud.', false);
  }

  function choiceMatch(transcript, question) {
    if (!question || !Array.isArray(question.choices)) return null;
    const heard = normalize(transcript);
    if (!heard) return null;

    const choices = question.choices;
    const exact = choices.find(c => [c.id, c.speak, c.text, c.html]
      .map(normalize).filter(Boolean).includes(heard));
    if (exact) return exact;

    const contains = choices.find(c => {
      const values = [c.id, c.speak, c.text, c.html].map(normalize).filter(Boolean);
      return values.some(v => v.length > 1 && (heard.includes(v) || v.includes(heard)));
    });
    if (contains) return contains;

    const ordinals = {
      '1': 0, 'one': 0, 'first': 0, '1st': 0,
      '2': 1, 'two': 1, 'second': 1, '2nd': 1,
      '3': 2, 'three': 2, 'third': 2, '3rd': 2,
      '4': 3, 'four': 3, 'fourth': 3, '4th': 3
    };
    const ordinal = ordinals[heard];
    if (ordinal !== undefined && choices[ordinal]) return choices[ordinal];
    return null;
  }

  function start(question, callbacks) {
    callbacks = callbacks || {};
    if (!supported()) {
      setUI('Voice input is not supported on this browser.', false);
      return false;
    }
    if (state.listening) {
      stop();
      return false;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = languageFor(question);
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 3;
    state.recognition = recognition;
    state.listening = true;
    setUI('Listening… say your answer!', true);

    recognition.onresult = function (event) {
      const transcript = Array.from(event.results || [])
        .map(r => r[0] && r[0].transcript)
        .filter(Boolean).join(' ')
        .trim();
      const match = choiceMatch(transcript, question);
      if (callbacks.onTranscript) callbacks.onTranscript(transcript, !!match);
      if (match && callbacks.onChoice) callbacks.onChoice(match.id);
      else setUI('I heard “' + transcript + '”. Try again.', false);
    };

    recognition.onerror = function (event) {
      const message = event.error === 'not-allowed'
        ? 'Please allow microphone access.'
        : event.error === 'no-speech'
          ? 'I did not hear you. Try again.'
          : 'Voice input had a little trouble. Try again.';
      setUI(message, false);
      if (callbacks.onError) callbacks.onError(event.error);
    };

    recognition.onend = function () {
      state.listening = false;
      state.recognition = null;
      if (document.getElementById('blipolaVoiceBtn')) {
        setUI('Tap Speak and answer out loud.', false);
      }
    };

    try {
      recognition.start();
      return true;
    } catch (e) {
      stop();
      return false;
    }
  }

  function speakCurrent(question) {
    if (!question || typeof window.speak !== 'function') return;
    window.speak(question.speakText || '', { lang: question.lang || 'en-US' });
  }

  window.BlipolaVoice = { supported, start, stop, speakCurrent, choiceMatch };
})();