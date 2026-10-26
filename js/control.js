(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const store = new StageTimerStore();
  let state = store.load();
  let i18n = StageTimerI18n.create(state.ui.language);
  let lastStageSeenAt = 0;
  let lastRenderedRevision = -1;
  let completionPending = false;
  let messageExpiryPending = false;
  let stageWindow = null;
  let lastAutoSuggestion = state.ai.lastSuggestion || '';
  let currentAiSuggestionKey = '';

  const sync = new StageTimerLocalSync('control', handleSyncMessage);
  const remote = new StageTimerRemoteAdapter();
  const speech = new StageTimerSpeechAdapter();

  const elements = {};
  const ids = [
    'stageConnectionPill', 'stageConnectionText', 'stageStateLabel', 'timerStatusBadge',
    'currentSessionLabel', 'nextSessionLabel', 'scheduleVarianceLabel', 'timerReadoutWrap',
    'timerReadout', 'timerModeLabel', 'timerBandLabel', 'hoursInput', 'minutesInput',
    'secondsInput', 'modeSelect', 'overtimeToggle', 'startButton', 'pauseButton',
    'resumeButton', 'stopButton', 'resetButton', 'setTimeLabel', 'remainingTimeLabel',
    'elapsedTimeLabel', 'presetSelect', 'normalThresholdText', 'warningThresholdText',
    'criticalThresholdText', 'messageGrid', 'customMessageInput', 'messageSecondsInput',
    'messageStickyToggle', 'activeMessageBox', 'activeMessageText', 'aiModeBadge',
    'aiCurrentSection', 'aiExpectedSection', 'aiTimeLeft', 'aiPace', 'aiEstimatedFinish',
    'aiSuggestionBox', 'aiSuggestionText', 'runOfShowTitleInput', 'runOfShowBody',
    'mobileRunOfShowList', 'presetDialog', 'presetForm', 'presetDialogTitle', 'presetIdInput',
    'presetNameInput', 'presetHoursInput', 'presetMinutesInput', 'presetSecondsInput',
    'presetModeInput', 'presetOvertimeInput', 'presetWarningInput', 'presetCriticalInput',
    'runItemDialog', 'runItemForm', 'runItemDialogTitle', 'runItemIdInput',
    'runItemStartInput', 'runItemTitleInput', 'runItemSpeakerInput', 'runItemDurationInput',
    'runItemNotesInput', 'settingsDialog', 'settingsForm', 'settingsWarningInput',
    'settingsCriticalInput', 'settingsNormalTone', 'settingsSessionInfo', 'settingsStatusLine',
    'settingsAlwaysHours', 'remoteEnabledInput', 'remoteEndpointInput', 'remoteSessionCodeInput',
    'aiDialog', 'aiForm', 'aiModeInput', 'aiEndpointInput', 'aiAutoConfirmedInput',
    'aiSectionsInput', 'aiSpeechTextInput', 'toastRegion'
  ];
  ids.forEach((id) => { elements[id] = $(id); });

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toast(message, type) {
    const item = document.createElement('div');
    item.className = `toast${type === 'error' ? ' error' : ''}`;
    item.textContent = message;
    elements.toastRegion.appendChild(item);
    window.setTimeout(() => item.remove(), 3200);
  }

  function commit(mutator, options) {
    const now = Date.now();
    const next = StageTimerCore.clone(state);
    mutator(next, now);
    next.revision = Math.max(state.revision + 1, next.revision + 1);
    next.updatedAt = now;
    state = store.save(next);
    sync.sendState(state);
    remote.send('STATE', state);
    renderAll();
    if (options && options.toastKey) toast(i18n.t(options.toastKey, options.variables));
    if (options && options.toast) toast(options.toast);
    return state;
  }

  function handleSyncMessage(message) {
    if (message.role === 'stage' || message.type === 'STAGE_ALIVE') lastStageSeenAt = Date.now();
    if (message.type === 'REQUEST_STATE' || (message.type === 'HELLO' && message.role === 'stage')) {
      sync.sendState(state);
      return;
    }
    if (message.type === 'STATE' && message.state) {
      const incoming = StageTimerCore.normalizeState(message.state, Date.now());
      if (incoming.revision > state.revision) {
        state = store.save(incoming);
        renderAll();
      }
    }
  }

  function reconnectRemote() {
    remote.connect({
      enabled: state.remote.enabled,
      endpoint: state.remote.endpoint,
      sessionCode: state.remote.sessionCode,
      role: 'control',
      token: sessionStorage.getItem('stageTimerAI.remoteToken') || ''
    });
  }

  remote.addEventListener('message', (event) => {
    const packet = event.detail;
    if (packet && packet.type === 'REQUEST_STATE') remote.send('STATE', state);
    if (packet && packet.type === 'STAGE_ALIVE') lastStageSeenAt = Date.now();
  });

  function formatTimer(timerView, forceHours) {
    return StageTimerCore.formatClock(timerView.displayMs, {
      prefix: timerView.displayPrefix,
      alwaysHours: Boolean(forceHours)
    });
  }

  function statusText(status) {
    return i18n.t(`status.${status}`);
  }

  function bandText(band) {
    return i18n.t(`band.${band}`);
  }

  function connectionText(status) {
    return i18n.t(`connection.${status}`);
  }

  function modeText(mode) {
    return i18n.t(`mode.${mode}`);
  }

  function localizedMessage(message) {
    return message && message.i18nKey ? i18n.t(message.i18nKey) : (message ? message.text : '');
  }

  function syncDurationInputs() {
    if ([elements.hoursInput, elements.minutesInput, elements.secondsInput].includes(document.activeElement)) return;
    const parts = StageTimerCore.durationToParts(state.timer.durationMs);
    elements.hoursInput.value = parts.hours;
    elements.minutesInput.value = parts.minutes;
    elements.secondsInput.value = parts.seconds;
    elements.modeSelect.value = state.timer.mode;
    elements.overtimeToggle.checked = state.timer.overtimeEnabled;
  }

  function renderLanguageControls() {
    document.querySelectorAll('[data-language]').forEach((button) => {
      const active = button.dataset.language === i18n.language;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function renderPresets() {
    const previous = state.selectedPresetId;
    elements.presetSelect.innerHTML = state.presets.map((preset) => {
      const name = i18n.localizeDefaultPreset(preset);
      return `<option value="${escapeHtml(preset.id)}">${escapeHtml(name)} · ${escapeHtml(i18n.formatDuration(preset.durationMs))}</option>`;
    }).join('');
    const selectedExists = state.presets.some((preset) => preset.id === previous);
    elements.presetSelect.value = selectedExists ? previous : state.presets[0].id;
  }

  function renderMessageButtons() {
    elements.messageGrid.innerHTML = StageTimerI18n.speakerMessageKeys.map((key) =>
      `<button class="button button-small button-secondary" type="button" data-speaker-key="${escapeHtml(key)}">${escapeHtml(i18n.t(key))}</button>`
    ).join('');
  }

  function itemStatus(item) {
    if (item.id === state.runOfShow.currentId) return 'current';
    return item.status || 'pending';
  }

  function runItemActions(item, index) {
    return `<div class="row-actions">
      <button class="row-action start" type="button" data-ros-action="start" data-id="${escapeHtml(item.id)}">${escapeHtml(i18n.t('ros.start'))}</button>
      <button class="row-action" type="button" data-ros-action="up" data-id="${escapeHtml(item.id)}" ${index === 0 ? 'disabled' : ''}>↑</button>
      <button class="row-action" type="button" data-ros-action="down" data-id="${escapeHtml(item.id)}" ${index === state.runOfShow.items.length - 1 ? 'disabled' : ''}>↓</button>
      <button class="row-action" type="button" data-ros-action="edit" data-id="${escapeHtml(item.id)}">${escapeHtml(i18n.t('ros.edit'))}</button>
      <button class="row-action delete" type="button" data-ros-action="delete" data-id="${escapeHtml(item.id)}">${escapeHtml(i18n.t('ros.delete'))}</button>
    </div>`;
  }

  function renderRunOfShow() {
    elements.runOfShowTitleInput.value = state.runOfShow.title === 'EVENT RUN OF SHOW' ? i18n.t('ros.defaultTitle') : (state.runOfShow.title || '');
    elements.runOfShowBody.innerHTML = state.runOfShow.items.map((item, index) => {
      const status = itemStatus(item);
      const title = i18n.localizeDefaultRunItem(item);
      return `<tr data-status="${status}">
        <td><strong>${escapeHtml(item.startTime)}</strong></td>
        <td class="session-title">${escapeHtml(title)}</td>
        <td>${escapeHtml(item.speaker || '—')}</td>
        <td>${escapeHtml(i18n.formatDuration(item.durationMs))}</td>
        <td class="notes-cell">${escapeHtml(item.notes || '—')}</td>
        <td>${escapeHtml(statusText(status))}</td>
        <td>${runItemActions(item, index)}</td>
      </tr>`;
    }).join('');

    elements.mobileRunOfShowList.innerHTML = state.runOfShow.items.map((item, index) => {
      const status = itemStatus(item);
      const title = i18n.localizeDefaultRunItem(item);
      return `<article class="ros-card" data-status="${status}">
        <div class="ros-card-top"><span class="ros-card-time">${escapeHtml(item.startTime)}</span><span>${escapeHtml(statusText(status))}</span></div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(item.speaker || i18n.t('ros.noSpeaker'))} · ${escapeHtml(i18n.formatDuration(item.durationMs))}</p>
        ${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ''}
        <div class="ros-card-actions">${runItemActions(item, index)}</div>
      </article>`;
    }).join('');
  }

  function renderStatic() {
    if (i18n.language !== state.ui.language) i18n.setLanguage(state.ui.language);
    i18n.apply(document);
    renderLanguageControls();
    syncDurationInputs();
    renderPresets();
    renderMessageButtons();
    renderRunOfShow();
    elements.messageSecondsInput.value = state.messageSettings.defaultSeconds;
    elements.messageStickyToggle.checked = state.messageSettings.sticky;
    elements.normalThresholdText.textContent = `> ${state.thresholds.warningPercent}%`;
    elements.warningThresholdText.textContent = `≤ ${state.thresholds.warningPercent}%`;
    elements.criticalThresholdText.textContent = `≤ ${state.thresholds.criticalSeconds}s`;
    elements.aiModeBadge.textContent = i18n.t(`ai.${state.ai.mode}`);
    elements.aiModeBadge.classList.toggle('muted', state.ai.mode === 'off');
    lastRenderedRevision = state.revision;
  }

  function updateLive() {
    const now = Date.now();
    const timerView = StageTimerCore.deriveTimer(state.timer, state.thresholds, now);
    elements.timerReadout.textContent = formatTimer(timerView, state.stage.alwaysShowHours);
    elements.timerReadoutWrap.dataset.band = timerView.band;
    elements.timerReadoutWrap.dataset.normalTone = state.thresholds.normalTone;
    elements.timerModeLabel.textContent = modeText(state.timer.mode);
    elements.timerBandLabel.textContent = bandText(timerView.band);
    elements.timerStatusBadge.textContent = statusText(state.timer.status);
    elements.timerStatusBadge.dataset.status = state.timer.status;
    elements.setTimeLabel.textContent = StageTimerCore.formatClock(state.timer.durationMs, { alwaysHours: state.timer.durationMs >= 3600000 });
    elements.remainingTimeLabel.textContent = StageTimerCore.formatClock(Math.max(0, timerView.remainingMs), { alwaysHours: state.timer.durationMs >= 3600000 });
    elements.elapsedTimeLabel.textContent = StageTimerCore.formatClock(timerView.elapsedMs, { alwaysHours: timerView.elapsedMs >= 3600000 });

    const context = StageTimerCore.getRunOfShowContext(state.runOfShow);
    elements.currentSessionLabel.textContent = context.current ? i18n.localizeDefaultRunItem(context.current) : i18n.t('timer.noActiveSession');
    elements.nextSessionLabel.textContent = context.next ? i18n.localizeDefaultRunItem(context.next) : '—';
    const variance = context.current ? StageTimerCore.scheduleVariance(state.runOfShow, context.current, now) : null;
    elements.scheduleVarianceLabel.textContent = i18n.formatVariance(variance);

    const stageAge = lastStageSeenAt ? now - lastStageSeenAt : Infinity;
    const stageStatus = stageAge < 5500 ? 'connected' : stageAge < 16000 ? 'reconnecting' : 'offline';
    elements.stageConnectionPill.dataset.status = stageStatus;
    elements.stageConnectionText.textContent = connectionText(stageStatus);
    elements.stageStateLabel.textContent = connectionText(stageStatus);

    elements.startButton.disabled = state.timer.status === 'running';
    elements.pauseButton.disabled = state.timer.status !== 'running';
    elements.resumeButton.disabled = state.timer.status !== 'paused';
    elements.stopButton.disabled = !['running', 'paused'].includes(state.timer.status);
    elements.resetButton.disabled = state.timer.status === 'idle' && state.timer.elapsedMs === 0;

    if (state.message) {
      const expired = state.message.expiresAt && now >= state.message.expiresAt;
      if (expired && !messageExpiryPending) {
        messageExpiryPending = true;
        commit((draft) => { draft.message = null; });
        messageExpiryPending = false;
      } else if (!expired) {
        elements.activeMessageBox.hidden = false;
        elements.activeMessageText.textContent = localizedMessage(state.message);
      }
    } else {
      elements.activeMessageBox.hidden = true;
    }

    const aiView = StageTimerCore.computeAI(state, now);
    elements.aiCurrentSection.textContent = aiView.current ? i18n.localizeDefaultAiSection(aiView.current) : '—';
    elements.aiExpectedSection.textContent = aiView.expected ? i18n.localizeDefaultAiSection(aiView.expected) : '—';
    elements.aiTimeLeft.textContent = StageTimerCore.formatClock(Math.max(0, aiView.timerView.remainingMs), { alwaysHours: false });
    elements.aiPace.textContent = i18n.t(`ai.${aiView.paceKey}`);
    elements.aiEstimatedFinish.textContent = new Date(aiView.estimatedFinishAt).toLocaleTimeString(i18n.locale, { hour: '2-digit', minute: '2-digit' });
    currentAiSuggestionKey = aiView.suggestionKey;
    elements.aiSuggestionBox.hidden = state.ai.mode === 'off' || !currentAiSuggestionKey;
    elements.aiSuggestionText.textContent = currentAiSuggestionKey ? i18n.t(currentAiSuggestionKey) : '—';

    if (state.ai.mode === 'auto' && state.ai.autoConfirmed && currentAiSuggestionKey && currentAiSuggestionKey !== lastAutoSuggestion && !state.message) {
      lastAutoSuggestion = currentAiSuggestionKey;
      sendStageMessage(i18n.t(currentAiSuggestionKey), false, true, currentAiSuggestionKey);
    }

    if (timerView.shouldComplete && !completionPending) {
      completionPending = true;
      commit((draft) => { draft.timer = StageTimerCore.completeIfNeeded(draft.timer, now); });
      completionPending = false;
    }
  }

  function renderAll() {
    if (lastRenderedRevision !== state.revision || i18n.language !== state.ui.language) renderStatic();
    updateLive();
  }

  function changeLanguage(language) {
    const normalized = StageTimerI18n.normalizeLanguage(language);
    StageTimerI18n.saveLanguage(normalized);
    commit((draft) => { draft.ui.language = normalized; });
  }

  function readDurationInputs() {
    return StageTimerCore.parseDurationParts(elements.hoursInput.value, elements.minutesInput.value, elements.secondsInput.value);
  }

  function applyTime() {
    const durationMs = readDurationInputs();
    commit((draft, now) => {
      draft.timer.mode = elements.modeSelect.value === 'countup' ? 'countup' : 'countdown';
      draft.timer.overtimeEnabled = elements.overtimeToggle.checked;
      draft.timer = StageTimerCore.setDuration(draft.timer, durationMs, now);
    }, { toastKey: 'timer.applied' });
  }

  function sendStageMessage(text, stickyOverride, fromAuto, i18nKey) {
    const clean = String(text || '').trim().slice(0, 80);
    if (!clean) return;
    const sticky = typeof stickyOverride === 'boolean' ? stickyOverride : elements.messageStickyToggle.checked;
    const seconds = StageTimerCore.clamp(Number(elements.messageSecondsInput.value) || 8, 1, 3600);
    commit((draft, now) => {
      draft.messageSettings.defaultSeconds = seconds;
      draft.messageSettings.sticky = sticky;
      draft.message = {
        id: StageTimerCore.createId('message'),
        text: clean,
        i18nKey: i18nKey || null,
        createdAt: now,
        expiresAt: sticky ? null : now + seconds * 1000,
        source: fromAuto ? 'ai-auto' : (i18nKey ? 'quick-message' : 'control')
      };
      if (fromAuto) draft.ai.lastSuggestion = i18nKey || clean;
    });
    if (!fromAuto) toast(i18n.t('message.sent', { message: clean }));
  }

  function openStage(mode) {
    const url = new URL('stage.html', document.baseURI);
    if (mode === 'fullscreen') url.searchParams.set('fullscreen', '1');
    if (mode === 'window' || mode === 'fullscreen') {
      stageWindow = window.open(url.toString(), 'stageTimerStage', 'popup,width=1280,height=720,resizable=yes');
    } else {
      stageWindow = window.open(url.toString(), '_blank');
      if (stageWindow) stageWindow.opener = null;
    }
    lastStageSeenAt = Date.now() - 6000;
    updateLive();
    if (!stageWindow) toast(i18n.t('popup.blocked'), 'error');
  }

  function loadPreset(preset) {
    if (!preset) return;
    commit((draft, now) => {
      draft.selectedPresetId = preset.id;
      draft.timer.mode = preset.mode;
      draft.timer.overtimeEnabled = preset.overtimeEnabled;
      draft.timer = StageTimerCore.setDuration(draft.timer, preset.durationMs, now);
      draft.timer = StageTimerCore.resetTimer(draft.timer);
      draft.thresholds.warningPercent = preset.warningPercent;
      draft.thresholds.criticalSeconds = preset.criticalSeconds;
    }, { toastKey: 'preset.loaded', variables: { name: i18n.localizeDefaultPreset(preset) } });
  }

  function selectedPreset() {
    return state.presets.find((preset) => preset.id === elements.presetSelect.value) || state.presets[0];
  }

  function openPresetDialog(preset, duplicate) {
    const source = preset || {
      id: '', name: '', durationMs: 5 * 60 * 1000, mode: 'countdown',
      warningPercent: state.thresholds.warningPercent,
      criticalSeconds: state.thresholds.criticalSeconds,
      overtimeEnabled: true
    };
    const parts = StageTimerCore.durationToParts(source.durationMs);
    elements.presetDialogTitle.textContent = duplicate ? i18n.t('preset.duplicateTitle') : source.id ? i18n.t('preset.editTitle') : i18n.t('preset.newTitle');
    elements.presetIdInput.value = duplicate ? '' : source.id;
    elements.presetNameInput.value = duplicate ? `${source.name} ${i18n.t('preset.copySuffix')}` : source.name;
    elements.presetHoursInput.value = parts.hours;
    elements.presetMinutesInput.value = parts.minutes;
    elements.presetSecondsInput.value = parts.seconds;
    elements.presetModeInput.value = source.mode;
    elements.presetOvertimeInput.checked = source.overtimeEnabled;
    elements.presetWarningInput.value = source.warningPercent;
    elements.presetCriticalInput.value = source.criticalSeconds;
    elements.presetDialog.showModal();
    elements.presetNameInput.focus();
  }

  function savePreset() {
    const name = elements.presetNameInput.value.trim();
    if (!name) return toast(i18n.t('preset.nameRequired'), 'error');
    const id = elements.presetIdInput.value || StageTimerCore.createId('preset');
    const preset = {
      id,
      name: name.slice(0, 40),
      durationMs: StageTimerCore.parseDurationParts(elements.presetHoursInput.value, elements.presetMinutesInput.value, elements.presetSecondsInput.value),
      mode: elements.presetModeInput.value === 'countup' ? 'countup' : 'countdown',
      warningPercent: StageTimerCore.clamp(Number(elements.presetWarningInput.value) || 20, 1, 99),
      criticalSeconds: StageTimerCore.clamp(Number(elements.presetCriticalInput.value) || 60, 1, 86400),
      overtimeEnabled: elements.presetOvertimeInput.checked
    };
    commit((draft) => {
      const index = draft.presets.findIndex((item) => item.id === id);
      if (index >= 0) draft.presets[index] = preset;
      else draft.presets.push(preset);
      draft.selectedPresetId = id;
    }, { toastKey: 'preset.saved', variables: { name: preset.name } });
    elements.presetDialog.close();
  }

  function openRunItemDialog(item) {
    const source = item || { id: '', startTime: '09:00', title: '', speaker: '', durationMs: 10 * 60 * 1000, notes: '' };
    elements.runItemDialogTitle.textContent = source.id ? i18n.t('ros.editItem') : i18n.t('ros.newItem');
    elements.runItemIdInput.value = source.id;
    elements.runItemStartInput.value = source.startTime;
    elements.runItemTitleInput.value = source.title;
    elements.runItemSpeakerInput.value = source.speaker || '';
    elements.runItemDurationInput.value = Math.max(1, Math.round(source.durationMs / 60000));
    elements.runItemNotesInput.value = source.notes || '';
    elements.runItemDialog.showModal();
    elements.runItemTitleInput.focus();
  }

  function saveRunItem() {
    const title = elements.runItemTitleInput.value.trim();
    if (!title || !elements.runItemStartInput.value) return toast(i18n.t('ros.timeTitleRequired'), 'error');
    const id = elements.runItemIdInput.value || StageTimerCore.createId('ros');
    const existing = state.runOfShow.items.find((item) => item.id === id);
    const item = {
      id,
      startTime: elements.runItemStartInput.value,
      title: title.slice(0, 60),
      speaker: elements.runItemSpeakerInput.value.trim().slice(0, 60),
      durationMs: StageTimerCore.clamp(Number(elements.runItemDurationInput.value) || 1, 1, 1440) * 60000,
      notes: elements.runItemNotesInput.value.trim().slice(0, 240),
      status: existing ? existing.status : 'pending',
      actualStartedAt: existing ? existing.actualStartedAt : null
    };
    commit((draft) => {
      const index = draft.runOfShow.items.findIndex((candidate) => candidate.id === id);
      if (index >= 0) draft.runOfShow.items[index] = item;
      else draft.runOfShow.items.push(item);
    }, { toastKey: 'ros.saved', variables: { title: item.title } });
    elements.runItemDialog.close();
  }

  function startRunItem(id) {
    commit((draft, now) => {
      const previous = draft.runOfShow.items.find((item) => item.id === draft.runOfShow.currentId);
      if (previous && previous.id !== id && previous.status === 'current') previous.status = 'completed';
      const item = draft.runOfShow.items.find((candidate) => candidate.id === id);
      if (!item) return;
      if (!draft.runOfShow.showStartedAt) {
        draft.runOfShow.showStartedAt = now;
        draft.runOfShow.baseItemId = item.id;
      }
      item.status = 'current';
      item.actualStartedAt = now;
      draft.runOfShow.currentId = item.id;
      draft.timer.mode = 'countdown';
      draft.timer.durationMs = item.durationMs;
      draft.timer = StageTimerCore.startTimer(draft.timer, now);
    }, { toastKey: 'ros.started' });
  }

  function startRelativeSession(offset) {
    const context = StageTimerCore.getRunOfShowContext(state.runOfShow);
    let index = context.currentIndex;
    if (index < 0) index = offset >= 0 ? -1 : 1;
    const target = state.runOfShow.items[index + offset];
    if (target) startRunItem(target.id);
    else toast(i18n.t(offset > 0 ? 'ros.noNext' : 'ros.noPrevious'), 'error');
  }

  function skipCurrentSession() {
    const context = StageTimerCore.getRunOfShowContext(state.runOfShow);
    if (!context.current) return toast(i18n.t('ros.noActiveToSkip'), 'error');
    const next = state.runOfShow.items[context.currentIndex + 1];
    commit((draft) => {
      const current = draft.runOfShow.items.find((item) => item.id === draft.runOfShow.currentId);
      if (current) current.status = 'skipped';
    });
    if (next) startRunItem(next.id);
    else commit((draft) => { draft.runOfShow.currentId = null; draft.timer = StageTimerCore.stopTimer(draft.timer, Date.now()); });
  }

  function handleRunOfShowAction(action, id) {
    const index = state.runOfShow.items.findIndex((item) => item.id === id);
    const item = state.runOfShow.items[index];
    if (!item) return;
    if (action === 'start') return startRunItem(id);
    if (action === 'edit') return openRunItemDialog(item);
    if (action === 'delete') {
      if (!window.confirm(i18n.t('ros.deleteConfirm', { title: item.title }))) return;
      commit((draft) => {
        draft.runOfShow.items = draft.runOfShow.items.filter((candidate) => candidate.id !== id);
        if (draft.runOfShow.currentId === id) draft.runOfShow.currentId = null;
      }, { toastKey: 'ros.deleted' });
      return;
    }
    if (action === 'up' || action === 'down') {
      const targetIndex = action === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= state.runOfShow.items.length) return;
      commit((draft) => {
        const items = draft.runOfShow.items;
        [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
      });
    }
  }

  function openSettings() {
    elements.settingsWarningInput.value = state.thresholds.warningPercent;
    elements.settingsCriticalInput.value = state.thresholds.criticalSeconds;
    elements.settingsNormalTone.value = state.thresholds.normalTone;
    elements.settingsSessionInfo.checked = state.stage.showSessionInfo;
    elements.settingsStatusLine.checked = state.stage.showStatusLine;
    elements.settingsAlwaysHours.checked = state.stage.alwaysShowHours;
    elements.remoteEnabledInput.checked = state.remote.enabled;
    elements.remoteEndpointInput.value = state.remote.endpoint;
    elements.remoteSessionCodeInput.value = state.remote.sessionCode;
    elements.settingsDialog.showModal();
  }

  function saveSettings() {
    commit((draft) => {
      draft.thresholds.warningPercent = StageTimerCore.clamp(Number(elements.settingsWarningInput.value) || 20, 1, 99);
      draft.thresholds.criticalSeconds = StageTimerCore.clamp(Number(elements.settingsCriticalInput.value) || 60, 1, 86400);
      draft.thresholds.normalTone = elements.settingsNormalTone.value === 'green' ? 'green' : 'white';
      draft.stage.showSessionInfo = elements.settingsSessionInfo.checked;
      draft.stage.showStatusLine = elements.settingsStatusLine.checked;
      draft.stage.alwaysShowHours = elements.settingsAlwaysHours.checked;
      draft.remote.enabled = elements.remoteEnabledInput.checked;
      draft.remote.endpoint = elements.remoteEndpointInput.value.trim();
      draft.remote.sessionCode = elements.remoteSessionCodeInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || StageTimerCore.createSessionCode();
    }, { toastKey: 'settings.saved' });
    elements.settingsDialog.close();
    reconnectRemote();
  }

  function openAiSettings() {
    elements.aiModeInput.value = state.ai.mode;
    elements.aiEndpointInput.value = state.ai.endpoint || '';
    elements.aiAutoConfirmedInput.checked = state.ai.autoConfirmed;
    elements.aiSectionsInput.value = state.ai.sections.map((section) => `${section.name} | ${Math.round(section.durationMs / 60000)}`).join('\n');
    elements.aiSpeechTextInput.value = state.ai.speechText || '';
    elements.aiDialog.showModal();
  }

  function saveAiSettings() {
    const mode = ['off', 'suggest', 'auto'].includes(elements.aiModeInput.value) ? elements.aiModeInput.value : 'off';
    if (mode === 'auto' && !elements.aiAutoConfirmedInput.checked) return toast(i18n.t('ai.confirmAuto'), 'error');
    const sections = elements.aiSectionsInput.value.split('\n').map((line) => {
      const parts = line.split('|');
      const name = (parts[0] || '').trim().toUpperCase();
      const minutes = StageTimerCore.clamp(Number(parts[1]) || 1, 1, 1440);
      return name ? { id: StageTimerCore.createId('ai-section'), name: name.slice(0, 40), durationMs: minutes * 60000 } : null;
    }).filter(Boolean);
    if (!sections.length) return toast(i18n.t('ai.addSection'), 'error');
    commit((draft) => {
      draft.ai.mode = mode;
      draft.ai.autoConfirmed = mode === 'auto' && elements.aiAutoConfirmedInput.checked;
      draft.ai.endpoint = elements.aiEndpointInput.value.trim();
      draft.ai.speechText = elements.aiSpeechTextInput.value.trim();
      draft.ai.sections = sections;
      draft.ai.currentSectionIndex = 0;
      draft.ai.lastSuggestion = '';
    }, { toastKey: 'ai.saved' });
    lastAutoSuggestion = '';
    elements.aiDialog.close();
  }

  function isTypingTarget(target) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable;
  }

  function bindEvents() {
    document.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => changeLanguage(button.dataset.language)));
    $('openStageButton').addEventListener('click', () => openStage('tab'));
    $('openStageWindowButton').addEventListener('click', () => openStage('window'));
    $('openFullscreenStageTopButton').addEventListener('click', () => openStage('fullscreen'));
    $('openFullscreenStageButton').addEventListener('click', () => openStage('fullscreen'));
    $('settingsButton').addEventListener('click', openSettings);
    $('applyTimeButton').addEventListener('click', applyTime);

    elements.modeSelect.addEventListener('change', () => commit((draft) => { draft.timer.mode = elements.modeSelect.value; }));
    elements.overtimeToggle.addEventListener('change', () => commit((draft, now) => {
      draft.timer.overtimeEnabled = elements.overtimeToggle.checked;
      draft.timer = StageTimerCore.completeIfNeeded(draft.timer, now);
    }));

    elements.startButton.addEventListener('click', () => commit((draft, now) => { draft.timer = StageTimerCore.startTimer(draft.timer, now); }));
    elements.pauseButton.addEventListener('click', () => commit((draft, now) => { draft.timer = StageTimerCore.pauseTimer(draft.timer, now); }));
    elements.resumeButton.addEventListener('click', () => commit((draft, now) => { draft.timer = StageTimerCore.resumeTimer(draft.timer, now); }));
    elements.stopButton.addEventListener('click', () => commit((draft, now) => { draft.timer = StageTimerCore.stopTimer(draft.timer, now); }));
    elements.resetButton.addEventListener('click', () => commit((draft) => { draft.timer = StageTimerCore.resetTimer(draft.timer); }));

    document.querySelectorAll('[data-adjust]').forEach((button) => button.addEventListener('click', () => commit((draft, now) => {
      draft.timer = StageTimerCore.adjustDuration(draft.timer, Number(button.dataset.adjust), now);
    })));

    elements.presetSelect.addEventListener('change', () => commit((draft) => { draft.selectedPresetId = elements.presetSelect.value; }));
    $('loadPresetButton').addEventListener('click', () => loadPreset(selectedPreset()));
    $('newPresetButton').addEventListener('click', () => openPresetDialog(null, false));
    $('editPresetButton').addEventListener('click', () => openPresetDialog(selectedPreset(), false));
    $('duplicatePresetButton').addEventListener('click', () => openPresetDialog(selectedPreset(), true));
    $('deletePresetButton').addEventListener('click', () => {
      const preset = selectedPreset();
      if (!preset || state.presets.length <= 1) return toast(i18n.t('preset.keepOne'), 'error');
      if (!window.confirm(i18n.t('preset.deleteConfirm', { name: preset.name }))) return;
      commit((draft) => {
        draft.presets = draft.presets.filter((item) => item.id !== preset.id);
        draft.selectedPresetId = draft.presets[0].id;
      }, { toastKey: 'preset.deleted' });
    });
    elements.presetForm.addEventListener('submit', (event) => {
      if (event.submitter && event.submitter.value === 'cancel') return;
      event.preventDefault();
      savePreset();
    });

    elements.messageGrid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-speaker-key]');
      if (button) sendStageMessage(i18n.t(button.dataset.speakerKey), undefined, false, button.dataset.speakerKey);
    });
    $('sendCustomMessageButton').addEventListener('click', () => {
      sendStageMessage(elements.customMessageInput.value);
      elements.customMessageInput.value = '';
    });
    elements.customMessageInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        $('sendCustomMessageButton').click();
      }
    });
    $('clearMessageButton').addEventListener('click', () => commit((draft) => { draft.message = null; }));

    $('addRunItemButton').addEventListener('click', () => openRunItemDialog());
    elements.runItemForm.addEventListener('submit', (event) => {
      if (event.submitter && event.submitter.value === 'cancel') return;
      event.preventDefault();
      saveRunItem();
    });
    function rosClickHandler(event) {
      const button = event.target.closest('[data-ros-action]');
      if (button) handleRunOfShowAction(button.dataset.rosAction, button.dataset.id);
    }
    elements.runOfShowBody.addEventListener('click', rosClickHandler);
    elements.mobileRunOfShowList.addEventListener('click', rosClickHandler);
    $('nextSessionButton').addEventListener('click', () => startRelativeSession(1));
    $('previousSessionButton').addEventListener('click', () => startRelativeSession(-1));
    $('skipSessionButton').addEventListener('click', skipCurrentSession);
    elements.runOfShowTitleInput.addEventListener('change', () => commit((draft) => { draft.runOfShow.title = elements.runOfShowTitleInput.value.trim().slice(0, 80); }));

    elements.settingsForm.addEventListener('submit', (event) => {
      if (event.submitter && event.submitter.value === 'cancel') return;
      event.preventDefault();
      saveSettings();
    });
    $('resetApplicationButton').addEventListener('click', (event) => {
      event.preventDefault();
      if (!window.confirm(i18n.t('settings.resetConfirm'))) return;
      state = store.reset();
      state.ui.language = i18n.language;
      state = store.save(state);
      sync.sendState(state);
      renderAll();
      elements.settingsDialog.close();
      toast(i18n.t('settings.resetDone'));
    });

    $('configureAiButton').addEventListener('click', openAiSettings);
    elements.aiForm.addEventListener('submit', (event) => {
      if (event.submitter && event.submitter.value === 'cancel') return;
      event.preventDefault();
      saveAiSettings();
    });
    $('previousAiSectionButton').addEventListener('click', () => commit((draft) => {
      draft.ai.currentSectionIndex = Math.max(0, draft.ai.currentSectionIndex - 1);
    }));
    $('nextAiSectionButton').addEventListener('click', () => commit((draft) => {
      draft.ai.currentSectionIndex = Math.min(draft.ai.sections.length - 1, draft.ai.currentSectionIndex + 1);
    }));
    $('sendAiSuggestionButton').addEventListener('click', () => {
      if (currentAiSuggestionKey) sendStageMessage(i18n.t(currentAiSuggestionKey), undefined, false, currentAiSuggestionKey);
    });

    document.addEventListener('keydown', (event) => {
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (event.code === 'Space') {
        event.preventDefault();
        if (state.timer.status === 'running') elements.pauseButton.click();
        else if (state.timer.status === 'paused') elements.resumeButton.click();
        else elements.startButton.click();
      } else if (key === 'r') {
        event.preventDefault();
        elements.resetButton.click();
      } else if (key === 'f') {
        event.preventDefault();
        openStage('fullscreen');
      } else if (key === 'm') {
        event.preventDefault();
        elements.customMessageInput.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        commit((draft, now) => { draft.timer = StageTimerCore.adjustDuration(draft.timer, 60000, now); });
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        commit((draft, now) => { draft.timer = StageTimerCore.adjustDuration(draft.timer, -60000, now); });
      } else if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    });

    window.addEventListener('beforeunload', () => {
      sync.close();
      remote.disconnect();
      speech.stopBrowserSpeech();
    });
  }

  function init() {
    StageTimerI18n.saveLanguage(state.ui.language);
    bindEvents();
    sync.start();
    sync.requestState();
    reconnectRemote();
    renderAll();
    window.setInterval(updateLive, 100);
    window.setInterval(() => sync.heartbeat({ appRevision: state.revision }), 2000);
    document.documentElement.dataset.ready = 'true';
  }

  init();
})();
