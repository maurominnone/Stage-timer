(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const store = new StageTimerStore();
  let state = store.load();
  let i18n = StageTimerI18n.create(state.ui.language);
  let lastAppliedLanguage = '';
  let lastControlSeenAt = 0;
  let lastFitText = '';
  let cursorTimer = null;
  let remoteStatus = 'offline';

  const sync = new StageTimerLocalSync('stage', handleSyncMessage);
  const remote = new StageTimerRemoteAdapter();

  const elements = {
    connection: $('stageConnection'),
    connectionText: $('stageConnection').querySelector('strong'),
    message: $('stageMessage'),
    messageText: $('stageMessageText'),
    mode: $('stageMode'),
    timer: $('stageTimer'),
    band: $('stageBandLabel'),
    footer: $('stageFooter'),
    current: $('stageCurrent'),
    speaker: $('stageSpeaker'),
    next: $('stageNext'),
    variance: $('stageVariance'),
    fullscreenHint: $('fullscreenHint'),
    zone: document.querySelector('.stage-timer-zone')
  };

  function handleSyncMessage(message) {
    if (message.role === 'control') lastControlSeenAt = Date.now();
    if (message.type === 'STATE' && message.state) {
      const incoming = StageTimerCore.normalizeState(message.state, Date.now());
      if (incoming.revision >= state.revision) {
        const remoteChanged = incoming.remote.enabled !== state.remote.enabled ||
          incoming.remote.endpoint !== state.remote.endpoint ||
          incoming.remote.sessionCode !== state.remote.sessionCode;
        state = store.save(incoming);
        if (remoteChanged) connectRemote();
        render();
      }
    }
    if (message.type === 'REQUEST_STATE') sync.sendState(state);
  }

  function connectRemote() {
    remote.connect({
      enabled: state.remote.enabled,
      endpoint: state.remote.endpoint,
      sessionCode: state.remote.sessionCode,
      role: 'stage',
      token: sessionStorage.getItem('stageTimerAI.remoteToken') || ''
    });
  }

  remote.addEventListener('status', (event) => {
    remoteStatus = event.detail.status;
    renderConnection();
  });

  remote.addEventListener('message', (event) => {
    const packet = event.detail;
    if (packet && packet.type === 'STATE' && packet.payload) {
      const incoming = StageTimerCore.normalizeState(packet.payload, Date.now());
      if (incoming.revision >= state.revision) {
        state = store.save(incoming);
        render();
      }
    }
  });

  function renderConnection() {
    const age = lastControlSeenAt ? Date.now() - lastControlSeenAt : Infinity;
    let status = age < 5500 ? 'connected' : age < 16000 ? 'reconnecting' : 'offline';
    if (remoteStatus === 'connected') status = 'connected';
    else if (status === 'offline' && remoteStatus === 'reconnecting') status = 'reconnecting';
    elements.connection.dataset.status = status;
    elements.connectionText.textContent = i18n.t(`connection.${status}`);
  }

  function fitTimer(force) {
    const text = elements.timer.textContent;
    if (!force && text === lastFitText) return;
    lastFitText = text;
    const zone = elements.zone;
    if (!zone.clientWidth || !zone.clientHeight) return;
    const maxWidth = zone.clientWidth * 0.96;
    const maxHeight = zone.clientHeight * 0.62;
    let low = 24;
    let high = Math.max(48, Math.min(window.innerWidth, window.innerHeight * 1.55));
    let best = low;
    for (let step = 0; step < 13; step += 1) {
      const middle = (low + high) / 2;
      elements.timer.style.fontSize = `${middle}px`;
      const fits = elements.timer.scrollWidth <= maxWidth && elements.timer.scrollHeight <= maxHeight;
      if (fits) {
        best = middle;
        low = middle;
      } else {
        high = middle;
      }
    }
    elements.timer.style.fontSize = `${Math.floor(best)}px`;
  }

  function applyLanguage() {
    if (lastAppliedLanguage === state.ui.language) return;
    i18n.setLanguage(state.ui.language);
    i18n.apply(document);
    lastAppliedLanguage = state.ui.language;
  }

  function render() {
    applyLanguage();
    const now = Date.now();
    const timerView = StageTimerCore.deriveTimer(state.timer, state.thresholds, now);
    const display = StageTimerCore.formatClock(timerView.displayMs, {
      prefix: timerView.displayPrefix,
      alwaysHours: state.stage.alwaysShowHours
    });
    if (elements.timer.textContent !== display) {
      elements.timer.textContent = display;
      requestAnimationFrame(() => fitTimer());
    }
    document.body.dataset.band = timerView.band;
    document.body.dataset.normalTone = state.thresholds.normalTone;
    document.body.classList.toggle('hide-session', !state.stage.showSessionInfo);
    document.body.classList.toggle('hide-status', !state.stage.showStatusLine);
    elements.mode.textContent = `${i18n.t(`mode.${state.timer.mode}`)} · ${i18n.t(`status.${state.timer.status}`)}`;
    elements.band.textContent = i18n.t(`band.${timerView.band}`);

    const context = StageTimerCore.getRunOfShowContext(state.runOfShow);
    elements.current.textContent = context.current ? i18n.localizeDefaultRunItem(context.current) : i18n.t('timer.noActiveSession');
    elements.speaker.textContent = context.current && context.current.speaker ? context.current.speaker : '';
    elements.next.textContent = context.next ? i18n.localizeDefaultRunItem(context.next) : '—';
    const variance = context.current ? StageTimerCore.scheduleVariance(state.runOfShow, context.current, now) : null;
    elements.variance.textContent = i18n.formatVariance(variance);

    const messageVisible = state.message && (!state.message.expiresAt || now < state.message.expiresAt);
    elements.message.hidden = !messageVisible;
    elements.messageText.textContent = messageVisible ? (state.message.i18nKey ? i18n.t(state.message.i18nKey) : state.message.text) : '';
    renderConnection();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => showFullscreenHint());
    }
  }

  function showFullscreenHint() {
    elements.fullscreenHint.hidden = false;
    window.setTimeout(() => { elements.fullscreenHint.hidden = true; }, 4500);
  }

  function resetCursorTimer() {
    document.body.classList.remove('cursor-hidden');
    if (cursorTimer) window.clearTimeout(cursorTimer);
    cursorTimer = window.setTimeout(() => document.body.classList.add('cursor-hidden'), 2200);
  }

  function init() {
    sync.start();
    sync.requestState();
    connectRemote();
    render();
    fitTimer(true);
    window.setInterval(render, 100);
    window.setInterval(() => {
      sync.heartbeat({ type: 'STAGE_ALIVE', appRevision: state.revision });
      remote.send('STAGE_ALIVE', { revision: state.revision });
    }, 2000);

    window.addEventListener('resize', () => requestAnimationFrame(() => fitTimer(true)));
    if ('ResizeObserver' in window) new ResizeObserver(() => fitTimer(true)).observe(elements.zone);
    document.addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      resetCursorTimer();
    });
    document.addEventListener('dblclick', toggleFullscreen);
    ['mousemove', 'pointerdown', 'touchstart'].forEach((name) => document.addEventListener(name, resetCursorTimer, { passive: true }));
    document.addEventListener('fullscreenchange', () => {
      elements.fullscreenHint.hidden = true;
      requestAnimationFrame(() => fitTimer(true));
    });
    window.addEventListener('beforeunload', () => {
      sync.close();
      remote.disconnect();
    });

    if (new URLSearchParams(window.location.search).get('fullscreen') === '1') showFullscreenHint();
    resetCursorTimer();
    document.documentElement.dataset.ready = 'true';
  }

  init();
})();
