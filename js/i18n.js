(function (global) {
  'use strict';

  const PREFERENCE_KEY = 'stageTimerAI.language.v1';
  const SUPPORTED_LANGUAGES = ['en', 'it'];

  const translations = {
    en: {
      'meta.controlTitle': 'STAGE TIMER AI — Control',
      'meta.controlDescription': 'STAGE TIMER AI — professional live event timer control.',
      'meta.stageTitle': 'STAGE TIMER AI — Stage',
      'meta.stageDescription': 'STAGE TIMER AI — fullscreen stage display.',
      'language.label': 'Language',
      'language.en': 'EN',
      'language.it': 'IT',
      'top.liveEventControl': 'LIVE EVENT CONTROL',
      'top.stageWindow': 'STAGE WINDOW',
      'top.fullscreenStage': 'FULLSCREEN STAGE',
      'top.openStage': 'OPEN STAGE DISPLAY',
      'top.openSettings': 'Open settings',
      'top.stageLabel': 'STAGE',
      'timer.master': 'MASTER TIMER',
      'timer.control': 'Control',
      'timer.current': 'CURRENT',
      'timer.next': 'NEXT',
      'timer.schedule': 'SCHEDULE',
      'timer.noActiveSession': 'NO ACTIVE SESSION',
      'timer.hours': 'HOURS',
      'timer.minutesShort': 'MIN',
      'timer.secondsShort': 'SEC',
      'timer.mode': 'MODE',
      'timer.overtime': 'OVERTIME',
      'timer.applyTime': 'APPLY TIME',
      'timer.controls': 'Timer controls',
      'timer.adjustDuration': 'Adjust timer duration',
      'timer.start': 'START',
      'timer.pause': 'PAUSE',
      'timer.resume': 'RESUME',
      'timer.stop': 'STOP',
      'timer.reset': 'RESET',
      'timer.plusOne': '+1 MIN',
      'timer.plusFive': '+5 MIN',
      'timer.minusOne': '−1 MIN',
      'timer.setTime': 'SET TIME',
      'timer.remaining': 'REMAINING',
      'timer.elapsed': 'ELAPSED',
      'timer.stageDisplay': 'STAGE DISPLAY',
      'mode.countdown': 'COUNTDOWN',
      'mode.countup': 'COUNT-UP',
      'status.idle': 'IDLE',
      'status.running': 'RUNNING',
      'status.paused': 'PAUSED',
      'status.stopped': 'STOPPED',
      'status.completed': 'COMPLETED',
      'status.pending': 'PENDING',
      'status.current': 'CURRENT',
      'status.skipped': 'SKIPPED',
      'connection.connected': 'CONNECTED',
      'connection.reconnecting': 'RECONNECTING',
      'connection.offline': 'OFFLINE',
      'band.normal': 'NORMAL',
      'band.warning': 'WARNING',
      'band.critical': 'CRITICAL',
      'band.overtime': 'OVERTIME',
      'preset.fastSetup': 'FAST SETUP',
      'preset.title': 'Presets',
      'preset.preset': 'PRESET',
      'preset.new': 'NEW',
      'preset.load': 'LOAD',
      'preset.edit': 'EDIT',
      'preset.duplicate': 'DUPLICATE',
      'preset.delete': 'DELETE',
      'preset.newTitle': 'New preset',
      'preset.editTitle': 'Edit preset',
      'preset.duplicateTitle': 'Duplicate preset',
      'preset.name': 'NAME',
      'preset.minutes': 'MINUTES',
      'preset.seconds': 'SECONDS',
      'preset.overtimeEnabled': 'OVERTIME ENABLED',
      'preset.warningBelow': 'WARNING BELOW (%)',
      'preset.criticalLastSec': 'CRITICAL LAST (SEC)',
      'preset.save': 'SAVE PRESET',
      'preset.nameRequired': 'Preset name is required.',
      'preset.keepOne': 'Keep at least one preset.',
      'preset.loaded': 'Preset loaded: {name}',
      'preset.saved': 'Preset saved: {name}',
      'preset.deleted': 'Preset deleted',
      'preset.deleteConfirm': 'Delete preset “{name}”?',
      'preset.copySuffix': 'Copy',
      'defaultPreset.pitch': 'Pitch',
      'defaultPreset.lightning': 'Lightning Talk',
      'defaultPreset.presentation': 'Presentation',
      'defaultPreset.keynote': 'Keynote',
      'defaultPreset.qa': 'Q&A',
      'message.speakerComms': 'SPEAKER COMMS',
      'message.stageMessage': 'Stage message',
      'message.clear': 'CLEAR',
      'message.custom': 'Custom message',
      'message.customAria': 'Custom stage message',
      'message.send': 'SEND',
      'message.expires': 'EXPIRES',
      'message.seconds': 'sec',
      'message.untilCleared': 'UNTIL CLEARED',
      'message.onStage': 'ON STAGE',
      'message.sent': 'Sent to Stage: {message}',
      'speaker.twoMinutes': '2 MIN LEFT',
      'speaker.oneMinute': '1 MIN LEFT',
      'speaker.wrapUp': 'WRAP UP',
      'speaker.slowDown': 'SLOW DOWN',
      'speaker.speedUp': 'SPEED UP',
      'speaker.conclusion': 'MOVE TO CONCLUSION',
      'speaker.qa': 'Q&A',
      'speaker.time': 'TIME',
      'speaker.thankYou': 'THANK YOU',
      'ai.optionalSafe': 'OPTIONAL / SAFE BY DEFAULT',
      'ai.title': 'AI Pace Assistant',
      'ai.off': 'OFF',
      'ai.suggest': 'SUGGEST',
      'ai.auto': 'AUTO MESSAGES',
      'ai.currentSection': 'CURRENT SECTION',
      'ai.expectedSection': 'EXPECTED SECTION',
      'ai.timeLeft': 'TIME LEFT',
      'ai.pace': 'PACE',
      'ai.estimatedFinish': 'EST. FINISH',
      'ai.suggestedMessage': 'SUGGESTED MESSAGE',
      'ai.previousSection': 'PREVIOUS SECTION',
      'ai.nextSection': 'NEXT SECTION',
      'ai.configure': 'CONFIGURE',
      'ai.ahead': 'AHEAD',
      'ai.behind': 'BEHIND',
      'ai.onPace': 'ON PACE',
      'ai.optionalIntegration': 'OPTIONAL INTEGRATION',
      'ai.mode': 'MODE',
      'ai.externalEndpoint': 'EXTERNAL AI ENDPOINT (OPTIONAL)',
      'ai.autoConfirm': 'I EXPLICITLY ENABLE AUTOMATIC STAGE MESSAGES',
      'ai.sectionsHelp': 'SECTIONS — ONE PER LINE: NAME | MINUTES',
      'ai.speechHelp': 'SPEECH / AGENDA / KEY POINTS',
      'ai.speechPlaceholder': 'Paste the speech outline or agenda. It stays in this browser unless an external service is explicitly configured.',
      'ai.security': 'SECURITY',
      'ai.securityNote': 'The timer works without AI. API keys must stay in a separate secure service; never put them in this repository or browser storage.',
      'ai.save': 'SAVE AI SETTINGS',
      'ai.confirmAuto': 'Confirm automatic messages or choose SUGGEST mode.',
      'ai.addSection': 'Add at least one AI section.',
      'ai.saved': 'AI settings saved',
      'ros.eventFlow': 'EVENT FLOW',
      'ros.title': 'Run of Show',
      'ros.defaultTitle': 'EVENT RUN OF SHOW',
      'ros.titleAria': 'Run of Show title',
      'ros.previous': 'PREVIOUS',
      'ros.skip': 'SKIP',
      'ros.startNext': 'START NEXT',
      'ros.addItem': 'ADD ITEM',
      'ros.time': 'TIME',
      'ros.session': 'SESSION',
      'ros.speaker': 'SPEAKER',
      'ros.duration': 'DURATION',
      'ros.notes': 'NOTES',
      'ros.status': 'STATUS',
      'ros.actions': 'Actions',
      'ros.start': 'START',
      'ros.edit': 'EDIT',
      'ros.delete': 'DELETE',
      'ros.noSpeaker': 'No speaker',
      'ros.newItem': 'Add item',
      'ros.editItem': 'Edit item',
      'ros.plannedTime': 'PLANNED TIME',
      'ros.itemTitle': 'TITLE',
      'ros.speakerOptional': 'SPEAKER (OPTIONAL)',
      'ros.durationMinutes': 'DURATION (MINUTES)',
      'ros.saveItem': 'SAVE ITEM',
      'ros.timeTitleRequired': 'Time and title are required.',
      'ros.saved': 'Run of Show saved: {title}',
      'ros.started': 'Session started',
      'ros.noNext': 'No next session.',
      'ros.noPrevious': 'No previous session.',
      'ros.noActiveToSkip': 'No active session to skip.',
      'ros.deleteConfirm': 'Delete “{title}”?',
      'ros.deleted': 'Run of Show item deleted',
      'ros.notStarted': 'NOT STARTED',
      'ros.onTime': 'ON TIME',
      'ros.late': '+{time} LATE',
      'ros.ahead': '−{time} AHEAD',
      'defaultRos.opening': 'Opening',
      'defaultRos.keynote': 'Keynote',
      'defaultRos.qa': 'Q&A',
      'defaultRos.break': 'Break',
      'defaultRos.panel': 'Panel',
      'defaultRos.closing': 'Closing',
      'settings.application': 'APPLICATION',
      'settings.title': 'Settings',
      'settings.timerThresholds': 'Timer thresholds',
      'settings.criticalLastSeconds': 'CRITICAL LAST (SECONDS)',
      'settings.normalColor': 'NORMAL COLOR',
      'settings.white': 'WHITE',
      'settings.green': 'GREEN',
      'settings.stageDisplay': 'Stage display',
      'settings.showCurrentNext': 'SHOW CURRENT / NEXT',
      'settings.showStatusLine': 'SHOW STATUS LINE',
      'settings.alwaysShowHours': 'ALWAYS SHOW HOURS',
      'settings.openFullscreenStage': 'OPEN FULLSCREEN STAGE',
      'settings.remoteOptional': 'Remote Stage (optional)',
      'settings.enableRealtime': 'ENABLE EXTERNAL REALTIME',
      'settings.endpoint': 'WSS ENDPOINT',
      'settings.sessionCode': 'SESSION CODE',
      'settings.remoteNote': 'Optional adapter only. No secret is stored in this app.',
      'settings.resetLocalData': 'RESET LOCAL DATA',
      'settings.cancel': 'CANCEL',
      'settings.save': 'SAVE SETTINGS',
      'settings.saved': 'Settings saved',
      'settings.resetConfirm': 'Reset all local settings, presets and Run of Show data?',
      'settings.resetDone': 'Local application data reset',
      'settings.close': 'Close',
      'timer.applied': 'Timer configuration applied',
      'popup.blocked': 'Popup blocked. Allow popups and try again.',
      'footer.localFirst': 'STAGE TIMER AI · LOCAL-FIRST · NO BACKEND REQUIRED',
      'footer.shortcuts': 'SPACE Start/Pause · R Reset · ↑ +1m · ↓ −1m · M Message · F Stage',
      'stage.message': 'MESSAGE',
      'stage.timerAria': 'Stage timer',
      'stage.pressFullscreen': 'PRESS F FOR FULLSCREEN'
    },
    it: {
      'meta.controlTitle': 'STAGE TIMER AI — Regia',
      'meta.controlDescription': 'STAGE TIMER AI — timer professionale per la regia di eventi live.',
      'meta.stageTitle': 'STAGE TIMER AI — Palco',
      'meta.stageDescription': 'STAGE TIMER AI — display palco a schermo intero.',
      'language.label': 'Lingua',
      'language.en': 'EN',
      'language.it': 'IT',
      'top.liveEventControl': 'REGIA EVENTO LIVE',
      'top.stageWindow': 'FINESTRA PALCO',
      'top.fullscreenStage': 'PALCO FULLSCREEN',
      'top.openStage': 'APRI DISPLAY PALCO',
      'top.openSettings': 'Apri impostazioni',
      'top.stageLabel': 'PALCO',
      'timer.master': 'TIMER PRINCIPALE',
      'timer.control': 'Regia',
      'timer.current': 'IN CORSO',
      'timer.next': 'SUCCESSIVO',
      'timer.schedule': 'SCALETTA',
      'timer.noActiveSession': 'NESSUNA SESSIONE ATTIVA',
      'timer.hours': 'ORE',
      'timer.minutesShort': 'MIN',
      'timer.secondsShort': 'SEC',
      'timer.mode': 'MODALITÀ',
      'timer.overtime': 'EXTRATEMPO',
      'timer.applyTime': 'APPLICA TEMPO',
      'timer.controls': 'Controlli timer',
      'timer.adjustDuration': 'Modifica durata timer',
      'timer.start': 'AVVIA',
      'timer.pause': 'PAUSA',
      'timer.resume': 'RIPRENDI',
      'timer.stop': 'FERMA',
      'timer.reset': 'AZZERA',
      'timer.plusOne': '+1 MIN',
      'timer.plusFive': '+5 MIN',
      'timer.minusOne': '−1 MIN',
      'timer.setTime': 'TEMPO IMPOSTATO',
      'timer.remaining': 'RIMANENTE',
      'timer.elapsed': 'TRASCORSO',
      'timer.stageDisplay': 'DISPLAY PALCO',
      'mode.countdown': 'CONTO ALLA ROVESCIA',
      'mode.countup': 'CONTEGGIO IN AVANTI',
      'status.idle': 'PRONTO',
      'status.running': 'IN CORSO',
      'status.paused': 'IN PAUSA',
      'status.stopped': 'FERMATO',
      'status.completed': 'COMPLETATO',
      'status.pending': 'IN ATTESA',
      'status.current': 'IN CORSO',
      'status.skipped': 'SALTATO',
      'connection.connected': 'CONNESSO',
      'connection.reconnecting': 'RICONNESSIONE',
      'connection.offline': 'OFFLINE',
      'band.normal': 'NORMALE',
      'band.warning': 'ATTENZIONE',
      'band.critical': 'CRITICO',
      'band.overtime': 'EXTRATEMPO',
      'preset.fastSetup': 'IMPOSTAZIONE RAPIDA',
      'preset.title': 'Preset',
      'preset.preset': 'PRESET',
      'preset.new': 'NUOVO',
      'preset.load': 'CARICA',
      'preset.edit': 'MODIFICA',
      'preset.duplicate': 'DUPLICA',
      'preset.delete': 'ELIMINA',
      'preset.newTitle': 'Nuovo preset',
      'preset.editTitle': 'Modifica preset',
      'preset.duplicateTitle': 'Duplica preset',
      'preset.name': 'NOME',
      'preset.minutes': 'MINUTI',
      'preset.seconds': 'SECONDI',
      'preset.overtimeEnabled': 'EXTRATEMPO ATTIVO',
      'preset.warningBelow': 'ATTENZIONE SOTTO (%)',
      'preset.criticalLastSec': 'CRITICO ULTIMI (SEC)',
      'preset.save': 'SALVA PRESET',
      'preset.nameRequired': 'Il nome del preset è obbligatorio.',
      'preset.keepOne': 'Mantieni almeno un preset.',
      'preset.loaded': 'Preset caricato: {name}',
      'preset.saved': 'Preset salvato: {name}',
      'preset.deleted': 'Preset eliminato',
      'preset.deleteConfirm': 'Eliminare il preset “{name}”?',
      'preset.copySuffix': 'Copia',
      'defaultPreset.pitch': 'Pitch',
      'defaultPreset.lightning': 'Intervento lampo',
      'defaultPreset.presentation': 'Presentazione',
      'defaultPreset.keynote': 'Keynote',
      'defaultPreset.qa': 'Domande e risposte',
      'message.speakerComms': 'COMUNICAZIONI SPEAKER',
      'message.stageMessage': 'Messaggio al palco',
      'message.clear': 'RIMUOVI',
      'message.custom': 'Messaggio personalizzato',
      'message.customAria': 'Messaggio personalizzato al palco',
      'message.send': 'INVIA',
      'message.expires': 'SCADENZA',
      'message.seconds': 'sec',
      'message.untilCleared': 'FINO A RIMOZIONE',
      'message.onStage': 'SUL PALCO',
      'message.sent': 'Inviato al palco: {message}',
      'speaker.twoMinutes': 'MANCANO 2 MIN',
      'speaker.oneMinute': 'MANCA 1 MIN',
      'speaker.wrapUp': 'CHIUDI',
      'speaker.slowDown': 'RALLENTA',
      'speaker.speedUp': 'ACCELERA',
      'speaker.conclusion': 'VAI ALLA CONCLUSIONE',
      'speaker.qa': 'DOMANDE E RISPOSTE',
      'speaker.time': 'TEMPO SCADUTO',
      'speaker.thankYou': 'GRAZIE',
      'ai.optionalSafe': 'OPZIONALE / SICURO DI DEFAULT',
      'ai.title': 'Assistente AI al ritmo',
      'ai.off': 'DISATTIVATO',
      'ai.suggest': 'SUGGERISCI',
      'ai.auto': 'MESSAGGI AUTOMATICI',
      'ai.currentSection': 'SEZIONE CORRENTE',
      'ai.expectedSection': 'SEZIONE PREVISTA',
      'ai.timeLeft': 'TEMPO RIMANENTE',
      'ai.pace': 'RITMO',
      'ai.estimatedFinish': 'FINE STIMATA',
      'ai.suggestedMessage': 'MESSAGGIO SUGGERITO',
      'ai.previousSection': 'SEZIONE PRECEDENTE',
      'ai.nextSection': 'SEZIONE SUCCESSIVA',
      'ai.configure': 'CONFIGURA',
      'ai.ahead': 'IN ANTICIPO',
      'ai.behind': 'IN RITARDO',
      'ai.onPace': 'IN LINEA',
      'ai.optionalIntegration': 'INTEGRAZIONE OPZIONALE',
      'ai.mode': 'MODALITÀ',
      'ai.externalEndpoint': 'ENDPOINT AI ESTERNO (OPZIONALE)',
      'ai.autoConfirm': 'ABILITO ESPLICITAMENTE I MESSAGGI AUTOMATICI AL PALCO',
      'ai.sectionsHelp': 'SEZIONI — UNA PER RIGA: NOME | MINUTI',
      'ai.speechHelp': 'DISCORSO / AGENDA / PUNTI CHIAVE',
      'ai.speechPlaceholder': 'Incolla la scaletta o il testo del discorso. Resta nel browser salvo configurazione esplicita di un servizio esterno.',
      'ai.security': 'SICUREZZA',
      'ai.securityNote': 'Il timer funziona senza AI. Le chiavi API devono restare in un servizio sicuro separato; non inserirle nel repository o nello storage del browser.',
      'ai.save': 'SALVA IMPOSTAZIONI AI',
      'ai.confirmAuto': 'Conferma i messaggi automatici oppure scegli la modalità SUGGERISCI.',
      'ai.addSection': 'Aggiungi almeno una sezione AI.',
      'ai.saved': 'Impostazioni AI salvate',
      'ros.eventFlow': 'FLUSSO EVENTO',
      'ros.title': 'Scaletta',
      'ros.defaultTitle': 'SCALETTA EVENTO',
      'ros.titleAria': 'Titolo della scaletta',
      'ros.previous': 'PRECEDENTE',
      'ros.skip': 'SALTA',
      'ros.startNext': 'AVVIA SUCCESSIVO',
      'ros.addItem': 'AGGIUNGI VOCE',
      'ros.time': 'ORARIO',
      'ros.session': 'SESSIONE',
      'ros.speaker': 'SPEAKER',
      'ros.duration': 'DURATA',
      'ros.notes': 'NOTE',
      'ros.status': 'STATO',
      'ros.actions': 'Azioni',
      'ros.start': 'AVVIA',
      'ros.edit': 'MODIFICA',
      'ros.delete': 'ELIMINA',
      'ros.noSpeaker': 'Nessuno speaker',
      'ros.newItem': 'Aggiungi voce',
      'ros.editItem': 'Modifica voce',
      'ros.plannedTime': 'ORARIO PREVISTO',
      'ros.itemTitle': 'TITOLO',
      'ros.speakerOptional': 'SPEAKER (OPZIONALE)',
      'ros.durationMinutes': 'DURATA (MINUTI)',
      'ros.saveItem': 'SALVA VOCE',
      'ros.timeTitleRequired': 'Orario e titolo sono obbligatori.',
      'ros.saved': 'Scaletta salvata: {title}',
      'ros.started': 'Sessione avviata',
      'ros.noNext': 'Nessuna sessione successiva.',
      'ros.noPrevious': 'Nessuna sessione precedente.',
      'ros.noActiveToSkip': 'Nessuna sessione attiva da saltare.',
      'ros.deleteConfirm': 'Eliminare “{title}”?',
      'ros.deleted': 'Voce della scaletta eliminata',
      'ros.notStarted': 'NON AVVIATA',
      'ros.onTime': 'IN ORARIO',
      'ros.late': '+{time} RITARDO',
      'ros.ahead': '−{time} ANTICIPO',
      'defaultRos.opening': 'Apertura',
      'defaultRos.keynote': 'Keynote',
      'defaultRos.qa': 'Domande e risposte',
      'defaultRos.break': 'Pausa',
      'defaultRos.panel': 'Panel',
      'defaultRos.closing': 'Chiusura',
      'settings.application': 'APPLICAZIONE',
      'settings.title': 'Impostazioni',
      'settings.timerThresholds': 'Soglie timer',
      'settings.criticalLastSeconds': 'CRITICO ULTIMI (SECONDI)',
      'settings.normalColor': 'COLORE NORMALE',
      'settings.white': 'BIANCO',
      'settings.green': 'VERDE',
      'settings.stageDisplay': 'Display palco',
      'settings.showCurrentNext': 'MOSTRA IN CORSO / SUCCESSIVO',
      'settings.showStatusLine': 'MOSTRA STATO TIMER',
      'settings.alwaysShowHours': 'MOSTRA SEMPRE LE ORE',
      'settings.openFullscreenStage': 'APRI PALCO FULLSCREEN',
      'settings.remoteOptional': 'Palco remoto (opzionale)',
      'settings.enableRealtime': 'ABILITA REALTIME ESTERNO',
      'settings.endpoint': 'ENDPOINT WSS',
      'settings.sessionCode': 'CODICE SESSIONE',
      'settings.remoteNote': 'Solo adapter opzionale. Nessun segreto viene salvato nell’app.',
      'settings.resetLocalData': 'AZZERA DATI LOCALI',
      'settings.cancel': 'ANNULLA',
      'settings.save': 'SALVA IMPOSTAZIONI',
      'settings.saved': 'Impostazioni salvate',
      'settings.resetConfirm': 'Azzerare tutte le impostazioni locali, i preset e la scaletta?',
      'settings.resetDone': 'Dati locali dell’applicazione azzerati',
      'settings.close': 'Chiudi',
      'timer.applied': 'Configurazione timer applicata',
      'popup.blocked': 'Popup bloccato. Consenti i popup e riprova.',
      'footer.localFirst': 'STAGE TIMER AI · LOCALE · NESSUN BACKEND RICHIESTO',
      'footer.shortcuts': 'SPAZIO Avvia/Pausa · R Azzera · ↑ +1m · ↓ −1m · M Messaggio · F Palco',
      'stage.message': 'MESSAGGIO',
      'stage.timerAria': 'Timer palco',
      'stage.pressFullscreen': 'PREMI F PER LO SCHERMO INTERO'
    }
  };

  const speakerMessageKeys = [
    'speaker.twoMinutes',
    'speaker.oneMinute',
    'speaker.wrapUp',
    'speaker.slowDown',
    'speaker.speedUp',
    'speaker.conclusion',
    'speaker.qa',
    'speaker.time',
    'speaker.thankYou'
  ];

  function normalizeLanguage(value) {
    const short = String(value || '').toLowerCase().split('-')[0];
    return SUPPORTED_LANGUAGES.includes(short) ? short : 'en';
  }

  function detectLanguage() {
    try {
      const stored = global.localStorage && global.localStorage.getItem(PREFERENCE_KEY);
      if (stored) return normalizeLanguage(stored);
    } catch (error) {
      // Browser storage can be unavailable in private or restricted contexts.
    }
    return normalizeLanguage(global.navigator && global.navigator.language);
  }

  function saveLanguage(language) {
    const normalized = normalizeLanguage(language);
    try {
      if (global.localStorage) global.localStorage.setItem(PREFERENCE_KEY, normalized);
    } catch (error) {
      // The application still works for the current session.
    }
    return normalized;
  }

  function interpolate(template, variables) {
    return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) =>
      variables && Object.prototype.hasOwnProperty.call(variables, name) ? String(variables[name]) : match
    );
  }

  function create(language) {
    let current = normalizeLanguage(language || detectLanguage());

    function t(key, variables) {
      const value = translations[current][key] || translations.en[key] || key;
      return interpolate(value, variables);
    }

    function setLanguage(languageValue) {
      current = saveLanguage(languageValue);
      return current;
    }

    function apply(root) {
      const scope = root || global.document;
      if (!scope) return;
      scope.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
      scope.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
      scope.querySelectorAll('[data-i18n-aria]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });
      scope.querySelectorAll('[data-i18n-title]').forEach((node) => { node.title = t(node.dataset.i18nTitle); });
      if (global.document) {
        global.document.documentElement.lang = current;
        const page = global.document.body && global.document.body.classList.contains('stage-page') ? 'stage' : 'control';
        global.document.title = t(`meta.${page}Title`);
        const description = global.document.querySelector('meta[name="description"]');
        if (description) description.content = t(`meta.${page}Description`);
      }
    }

    function formatDuration(ms) {
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

    function formatVariance(value) {
      if (value === null || !Number.isFinite(value)) return t('ros.notStarted');
      if (Math.abs(value) < 15000) return t('ros.onTime');
      const formatted = StageTimerCore.formatClock(Math.abs(value), { alwaysHours: Math.abs(value) >= 3600000 });
      return value > 0 ? t('ros.late', { time: formatted }) : t('ros.ahead', { time: formatted });
    }

    function localizeDefaultPreset(preset) {
      const keys = {
        'preset-pitch': 'defaultPreset.pitch',
        'preset-lightning': 'defaultPreset.lightning',
        'preset-presentation': 'defaultPreset.presentation',
        'preset-keynote': 'defaultPreset.keynote',
        'preset-qa': 'defaultPreset.qa'
      };
      const original = StageTimerCore.DEFAULT_PRESETS.find((item) => item.id === preset.id);
      return keys[preset.id] && original && preset.name === original.name ? t(keys[preset.id]) : preset.name;
    }

    function localizeDefaultRunItem(item) {
      const keys = {
        'ros-opening': 'defaultRos.opening',
        'ros-keynote': 'defaultRos.keynote',
        'ros-qa': 'defaultRos.qa',
        'ros-break': 'defaultRos.break',
        'ros-panel': 'defaultRos.panel',
        'ros-closing': 'defaultRos.closing'
      };
      const original = StageTimerCore.DEFAULT_RUN_OF_SHOW.find((candidate) => candidate.id === item.id);
      return keys[item.id] && original && item.title === original.title ? t(keys[item.id]) : item.title;
    }

    function localizeDefaultAiSection(section) {
      const keys = {
        'ai-intro': 'INTRO',
        'ai-context': current === 'it' ? 'CONTESTO' : 'CONTEXT',
        'ai-demo': 'DEMO',
        'ai-results': current === 'it' ? 'RISULTATI' : 'RESULTS',
        'ai-conclusion': current === 'it' ? 'CONCLUSIONE' : 'CONCLUSION'
      };
      const original = StageTimerCore.DEFAULT_AI_SECTIONS.find((candidate) => candidate.id === section.id);
      return original && section.name === original.name ? keys[section.id] : section.name;
    }

    return {
      t,
      apply,
      setLanguage,
      formatDuration,
      formatVariance,
      localizeDefaultPreset,
      localizeDefaultRunItem,
      localizeDefaultAiSection,
      get language() { return current; },
      get locale() { return current === 'it' ? 'it-IT' : 'en-GB'; }
    };
  }

  global.StageTimerI18n = {
    PREFERENCE_KEY,
    SUPPORTED_LANGUAGES,
    translations,
    speakerMessageKeys,
    normalizeLanguage,
    detectLanguage,
    saveLanguage,
    create
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.StageTimerI18n;
  }
})(typeof window !== 'undefined' ? window : globalThis);
