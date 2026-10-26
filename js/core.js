(function (global) {
  'use strict';

  const APP_VERSION = 1;
  const MIN_DURATION_MS = 1000;

  const DEFAULT_PRESETS = [
    { id: 'preset-pitch', name: 'Pitch', durationMs: 5 * 60 * 1000, mode: 'countdown', warningPercent: 20, criticalSeconds: 60, overtimeEnabled: true },
    { id: 'preset-lightning', name: 'Lightning Talk', durationMs: 10 * 60 * 1000, mode: 'countdown', warningPercent: 20, criticalSeconds: 60, overtimeEnabled: true },
    { id: 'preset-presentation', name: 'Presentation', durationMs: 20 * 60 * 1000, mode: 'countdown', warningPercent: 20, criticalSeconds: 60, overtimeEnabled: true },
    { id: 'preset-keynote', name: 'Keynote', durationMs: 45 * 60 * 1000, mode: 'countdown', warningPercent: 20, criticalSeconds: 60, overtimeEnabled: true },
    { id: 'preset-qa', name: 'Q&A', durationMs: 15 * 60 * 1000, mode: 'countdown', warningPercent: 20, criticalSeconds: 60, overtimeEnabled: true }
  ];

  const DEFAULT_RUN_OF_SHOW = [
    { id: 'ros-opening', startTime: '09:00', title: 'Opening', speaker: '', durationMs: 10 * 60 * 1000, notes: '', status: 'pending', actualStartedAt: null },
    { id: 'ros-keynote', startTime: '09:10', title: 'Keynote', speaker: '', durationMs: 30 * 60 * 1000, notes: '', status: 'pending', actualStartedAt: null },
    { id: 'ros-qa', startTime: '09:40', title: 'Q&A', speaker: '', durationMs: 15 * 60 * 1000, notes: '', status: 'pending', actualStartedAt: null },
    { id: 'ros-break', startTime: '09:55', title: 'Break', speaker: '', durationMs: 20 * 60 * 1000, notes: '', status: 'pending', actualStartedAt: null },
    { id: 'ros-panel', startTime: '10:15', title: 'Panel', speaker: '', durationMs: 45 * 60 * 1000, notes: '', status: 'pending', actualStartedAt: null },
    { id: 'ros-closing', startTime: '11:00', title: 'Closing', speaker: '', durationMs: 5 * 60 * 1000, notes: '', status: 'pending', actualStartedAt: null }
  ];

  const SPEAKER_MESSAGES = [
    '2 MIN LEFT',
    '1 MIN LEFT',
    'WRAP UP',
    'SLOW DOWN',
    'SPEED UP',
    'MOVE TO CONCLUSION',
    'Q&A',
    'TIME',
    'THANK YOU'
  ];

  const DEFAULT_AI_SECTIONS = [
    { id: 'ai-intro', name: 'INTRO', durationMs: 2 * 60 * 1000 },
    { id: 'ai-context', name: 'CONTEXT', durationMs: 4 * 60 * 1000 },
    { id: 'ai-demo', name: 'DEMO', durationMs: 8 * 60 * 1000 },
    { id: 'ai-results', name: 'RESULTS', durationMs: 4 * 60 * 1000 },
    { id: 'ai-conclusion', name: 'CONCLUSION', durationMs: 2 * 60 * 1000 }
  ];

  function createId(prefix) {
    const random = global.crypto && global.crypto.getRandomValues
      ? Array.from(global.crypto.getRandomValues(new Uint32Array(2))).map((value) => value.toString(36)).join('')
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `${prefix || 'id'}-${random}`;
  }

  function createSessionCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    const values = new Uint8Array(4);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(values);
    for (let index = 0; index < 4; index += 1) {
      const value = global.crypto && global.crypto.getRandomValues ? values[index] : Math.floor(Math.random() * 256);
      result += alphabet[value % alphabet.length];
    }
    return result;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toFiniteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function defaultLanguage() {
    if (global.StageTimerI18n && typeof global.StageTimerI18n.detectLanguage === 'function') {
      return global.StageTimerI18n.detectLanguage();
    }
    const browserLanguage = global.navigator && global.navigator.language ? global.navigator.language : 'en';
    return String(browserLanguage).toLowerCase().startsWith('it') ? 'it' : 'en';
  }

  function createInitialState(now) {
    const timestamp = Number.isFinite(now) ? now : Date.now();
    return {
      version: APP_VERSION,
      revision: 1,
      updatedAt: timestamp,
      timer: {
        mode: 'countdown',
        durationMs: 5 * 60 * 1000,
        elapsedMs: 0,
        startedAt: null,
        status: 'idle',
        overtimeEnabled: true
      },
      thresholds: {
        warningPercent: 20,
        criticalSeconds: 60,
        normalTone: 'white'
      },
      presets: clone(DEFAULT_PRESETS),
      selectedPresetId: 'preset-pitch',
      message: null,
      messageSettings: {
        defaultSeconds: 8,
        sticky: false
      },
      runOfShow: {
        title: 'EVENT RUN OF SHOW',
        items: clone(DEFAULT_RUN_OF_SHOW),
        currentId: null,
        showStartedAt: null,
        baseItemId: null
      },
      stage: {
        showSessionInfo: true,
        showStatusLine: true,
        alwaysShowHours: false
      },
      remote: {
        enabled: false,
        endpoint: '',
        sessionCode: createSessionCode(),
        status: 'offline'
      },
      ai: {
        mode: 'off',
        autoConfirmed: false,
        endpoint: '',
        speechText: '',
        sections: clone(DEFAULT_AI_SECTIONS),
        currentSectionIndex: 0,
        lastSuggestion: '',
        liveTranscript: ''
      },
      ui: {
        compactRunOfShow: false,
        activePanel: 'timer',
        language: defaultLanguage()
      }
    };
  }

  function normalizeTimer(timer) {
    const source = timer || {};
    const statusValues = ['idle', 'running', 'paused', 'stopped', 'completed'];
    return {
      mode: source.mode === 'countup' ? 'countup' : 'countdown',
      durationMs: Math.max(MIN_DURATION_MS, Math.round(toFiniteNumber(source.durationMs, 5 * 60 * 1000))),
      elapsedMs: Math.max(0, toFiniteNumber(source.elapsedMs, 0)),
      startedAt: Number.isFinite(source.startedAt) ? source.startedAt : null,
      status: statusValues.includes(source.status) ? source.status : 'idle',
      overtimeEnabled: source.overtimeEnabled !== false
    };
  }

  function normalizeState(input, now) {
    const fallback = createInitialState(now);
    if (!input || typeof input !== 'object') return fallback;
    const state = clone(input);
    state.version = APP_VERSION;
    state.revision = Math.max(1, Math.floor(toFiniteNumber(state.revision, 1)));
    state.updatedAt = toFiniteNumber(state.updatedAt, Number.isFinite(now) ? now : Date.now());
    state.timer = normalizeTimer(state.timer);
    state.thresholds = Object.assign({}, fallback.thresholds, state.thresholds || {});
    state.thresholds.warningPercent = clamp(toFiniteNumber(state.thresholds.warningPercent, 20), 1, 99);
    state.thresholds.criticalSeconds = clamp(toFiniteNumber(state.thresholds.criticalSeconds, 60), 1, 24 * 60 * 60);
    state.thresholds.normalTone = state.thresholds.normalTone === 'green' ? 'green' : 'white';
    state.presets = Array.isArray(state.presets) && state.presets.length ? state.presets : fallback.presets;
    state.selectedPresetId = state.selectedPresetId || state.presets[0].id;
    state.message = state.message && typeof state.message.text === 'string' ? state.message : null;
    state.messageSettings = Object.assign({}, fallback.messageSettings, state.messageSettings || {});
    state.messageSettings.defaultSeconds = clamp(toFiniteNumber(state.messageSettings.defaultSeconds, 8), 1, 3600);
    state.runOfShow = Object.assign({}, fallback.runOfShow, state.runOfShow || {});
    state.runOfShow.items = Array.isArray(state.runOfShow.items) ? state.runOfShow.items : fallback.runOfShow.items;
    state.stage = Object.assign({}, fallback.stage, state.stage || {});
    state.remote = Object.assign({}, fallback.remote, state.remote || {});
    state.ai = Object.assign({}, fallback.ai, state.ai || {});
    state.ai.sections = Array.isArray(state.ai.sections) && state.ai.sections.length ? state.ai.sections : fallback.ai.sections;
    state.ui = Object.assign({}, fallback.ui, state.ui || {});
    state.ui.language = state.ui.language === 'it' ? 'it' : 'en';
    return state;
  }

  function effectiveElapsed(timer, now) {
    const safe = normalizeTimer(timer);
    if (safe.status !== 'running' || !Number.isFinite(safe.startedAt)) return safe.elapsedMs;
    return Math.max(0, safe.elapsedMs + Math.max(0, now - safe.startedAt));
  }

  function deriveTimer(timer, thresholds, now) {
    const safe = normalizeTimer(timer);
    const elapsed = effectiveElapsed(safe, now);
    const remaining = safe.durationMs - elapsed;
    const isOvertime = safe.overtimeEnabled && remaining < 0;
    const boundedElapsed = !safe.overtimeEnabled ? Math.min(elapsed, safe.durationMs) : elapsed;
    let displayMs;
    let displayPrefix = '';

    if (isOvertime) {
      displayMs = Math.abs(remaining);
      displayPrefix = '+';
    } else if (safe.mode === 'countup') {
      displayMs = boundedElapsed;
    } else {
      displayMs = Math.max(0, remaining);
    }

    const band = evaluateBand(remaining, safe.durationMs, thresholds, isOvertime);
    return {
      elapsedMs: elapsed,
      remainingMs: remaining,
      displayMs,
      displayPrefix,
      isOvertime,
      band,
      progress: safe.durationMs > 0 ? clamp(elapsed / safe.durationMs, 0, 1) : 0,
      shouldComplete: !safe.overtimeEnabled && safe.status === 'running' && elapsed >= safe.durationMs
    };
  }

  function evaluateBand(remainingMs, durationMs, thresholds, isOvertime) {
    if (isOvertime) return 'overtime';
    const warningPercent = clamp(toFiniteNumber(thresholds && thresholds.warningPercent, 20), 1, 99);
    const criticalMs = clamp(toFiniteNumber(thresholds && thresholds.criticalSeconds, 60), 1, 24 * 60 * 60) * 1000;
    if (remainingMs <= criticalMs) return 'critical';
    if (remainingMs / Math.max(durationMs, 1) <= warningPercent / 100) return 'warning';
    return 'normal';
  }

  function startTimer(timer, now) {
    const next = normalizeTimer(timer);
    next.elapsedMs = 0;
    next.startedAt = now;
    next.status = 'running';
    return next;
  }

  function pauseTimer(timer, now) {
    const next = normalizeTimer(timer);
    if (next.status !== 'running') return next;
    next.elapsedMs = effectiveElapsed(next, now);
    next.startedAt = null;
    next.status = 'paused';
    return next;
  }

  function resumeTimer(timer, now) {
    const next = normalizeTimer(timer);
    if (next.status !== 'paused') return next;
    next.startedAt = now;
    next.status = 'running';
    return next;
  }

  function stopTimer(timer, now) {
    const next = normalizeTimer(timer);
    if (next.status === 'running') next.elapsedMs = effectiveElapsed(next, now);
    next.startedAt = null;
    next.status = 'stopped';
    return next;
  }

  function resetTimer(timer) {
    const next = normalizeTimer(timer);
    next.elapsedMs = 0;
    next.startedAt = null;
    next.status = 'idle';
    return next;
  }

  function setDuration(timer, durationMs, now) {
    const next = normalizeTimer(timer);
    const currentElapsed = effectiveElapsed(next, now);
    next.durationMs = Math.max(MIN_DURATION_MS, Math.round(toFiniteNumber(durationMs, next.durationMs)));
    if (next.status === 'running') {
      next.elapsedMs = currentElapsed;
      next.startedAt = now;
    }
    if (!next.overtimeEnabled && currentElapsed >= next.durationMs) {
      next.elapsedMs = next.durationMs;
      next.startedAt = null;
      next.status = 'completed';
    }
    return next;
  }

  function adjustDuration(timer, deltaMs, now) {
    return setDuration(timer, normalizeTimer(timer).durationMs + deltaMs, now);
  }

  function completeIfNeeded(timer, now) {
    const next = normalizeTimer(timer);
    if (!next.overtimeEnabled && next.status === 'running' && effectiveElapsed(next, now) >= next.durationMs) {
      next.elapsedMs = next.durationMs;
      next.startedAt = null;
      next.status = 'completed';
    }
    return next;
  }

  function formatClock(ms, options) {
    const settings = options || {};
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const includeHours = settings.alwaysHours || hours > 0;
    const body = includeHours
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes + hours * 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return `${settings.prefix || ''}${body}`;
  }

  function formatDurationLong(ms) {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds || !parts.length) parts.push(`${seconds}s`);
    return parts.join(' ');
  }

  function parseDurationParts(hours, minutes, seconds) {
    const h = clamp(Math.floor(toFiniteNumber(hours, 0)), 0, 99);
    const m = clamp(Math.floor(toFiniteNumber(minutes, 0)), 0, 59);
    const s = clamp(Math.floor(toFiniteNumber(seconds, 0)), 0, 59);
    return Math.max(MIN_DURATION_MS, (h * 3600 + m * 60 + s) * 1000);
  }

  function durationToParts(durationMs) {
    const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }

  function timeToMinutes(value) {
    if (!/^\d{2}:\d{2}$/.test(String(value || ''))) return 0;
    const parts = value.split(':').map(Number);
    return parts[0] * 60 + parts[1];
  }

  function scheduleVariance(runOfShow, item, now) {
    if (!runOfShow || !item || !runOfShow.showStartedAt || !runOfShow.baseItemId) return null;
    const base = runOfShow.items.find((candidate) => candidate.id === runOfShow.baseItemId);
    if (!base) return null;
    let plannedOffsetMinutes = timeToMinutes(item.startTime) - timeToMinutes(base.startTime);
    if (plannedOffsetMinutes < -12 * 60) plannedOffsetMinutes += 24 * 60;
    if (plannedOffsetMinutes > 12 * 60) plannedOffsetMinutes -= 24 * 60;
    const actualStart = item.actualStartedAt || now;
    const expectedStart = runOfShow.showStartedAt + plannedOffsetMinutes * 60 * 1000;
    return actualStart - expectedStart;
  }

  function formatVariance(value) {
    if (value === null || !Number.isFinite(value)) return 'NOT STARTED';
    if (Math.abs(value) < 15000) return 'ON TIME';
    const formatted = formatClock(Math.abs(value), { alwaysHours: Math.abs(value) >= 3600000 });
    return value > 0 ? `+${formatted} LATE` : `-${formatted} AHEAD`;
  }

  function getRunOfShowContext(runOfShow) {
    const items = runOfShow && Array.isArray(runOfShow.items) ? runOfShow.items : [];
    const currentIndex = items.findIndex((item) => item.id === runOfShow.currentId);
    return {
      currentIndex,
      current: currentIndex >= 0 ? items[currentIndex] : null,
      next: currentIndex >= 0 && currentIndex + 1 < items.length ? items[currentIndex + 1] : (currentIndex < 0 ? items[0] || null : null),
      previous: currentIndex > 0 ? items[currentIndex - 1] : null
    };
  }

  function computeAI(state, now) {
    const ai = state.ai || {};
    const sections = Array.isArray(ai.sections) ? ai.sections : [];
    const timerView = deriveTimer(state.timer, state.thresholds, now);
    const elapsed = timerView.elapsedMs;
    let accumulated = 0;
    let expectedIndex = Math.max(0, sections.length - 1);
    for (let index = 0; index < sections.length; index += 1) {
      accumulated += Math.max(MIN_DURATION_MS, toFiniteNumber(sections[index].durationMs, MIN_DURATION_MS));
      if (elapsed < accumulated) {
        expectedIndex = index;
        break;
      }
    }
    const currentIndex = clamp(Math.floor(toFiniteNumber(ai.currentSectionIndex, 0)), 0, Math.max(0, sections.length - 1));
    const current = sections[currentIndex] || null;
    const expected = sections[expectedIndex] || null;
    const paceKey = currentIndex > expectedIndex ? 'ahead' : currentIndex < expectedIndex ? 'behind' : 'onPace';
    const pace = paceKey === 'ahead' ? 'AHEAD' : paceKey === 'behind' ? 'BEHIND' : 'ON PACE';
    const remainingPlan = sections.slice(currentIndex).reduce((sum, section) => sum + Math.max(MIN_DURATION_MS, toFiniteNumber(section.durationMs, 0)), 0);
    const estimatedFinishAt = now + remainingPlan;
    let suggestionKey = '';
    if (timerView.remainingMs <= 0) suggestionKey = 'speaker.time';
    else if (timerView.remainingMs <= 60 * 1000) suggestionKey = 'speaker.wrapUp';
    else if (timerView.remainingMs <= 2 * 60 * 1000) suggestionKey = 'speaker.twoMinutes';
    else if (paceKey === 'behind' && expectedIndex >= Math.max(0, sections.length - 2)) suggestionKey = 'speaker.conclusion';
    const englishSuggestions = {
      'speaker.time': 'TIME',
      'speaker.wrapUp': 'WRAP UP',
      'speaker.twoMinutes': '2 MIN LEFT',
      'speaker.conclusion': 'MOVE TO CONCLUSION'
    };
    const suggestion = englishSuggestions[suggestionKey] || '';
    return { current, expected, pace, paceKey, estimatedFinishAt, suggestion, suggestionKey, timerView };
  }

  const api = {
    APP_VERSION,
    MIN_DURATION_MS,
    DEFAULT_PRESETS,
    DEFAULT_RUN_OF_SHOW,
    DEFAULT_AI_SECTIONS,
    SPEAKER_MESSAGES,
    createId,
    createSessionCode,
    clone,
    clamp,
    createInitialState,
    normalizeTimer,
    normalizeState,
    effectiveElapsed,
    deriveTimer,
    evaluateBand,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    setDuration,
    adjustDuration,
    completeIfNeeded,
    formatClock,
    formatDurationLong,
    parseDurationParts,
    durationToParts,
    timeToMinutes,
    scheduleVariance,
    formatVariance,
    getRunOfShowContext,
    computeAI
  };

  global.StageTimerCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
