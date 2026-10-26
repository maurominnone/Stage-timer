'use strict';

const assert = require('node:assert/strict');
require('../js/core.js');
const i18nApi = require('../js/i18n.js');

function test(name, callback) {
  try {
    callback();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('supports only normalized English and Italian language codes', () => {
  assert.equal(i18nApi.normalizeLanguage('it-IT'), 'it');
  assert.equal(i18nApi.normalizeLanguage('en-US'), 'en');
  assert.equal(i18nApi.normalizeLanguage('fr-FR'), 'en');
});

test('translates timer states and controls to Italian', () => {
  const it = i18nApi.create('it');
  assert.equal(it.t('timer.start'), 'AVVIA');
  assert.equal(it.t('status.running'), 'IN CORSO');
  assert.equal(it.t('mode.countdown'), 'CONTO ALLA ROVESCIA');
  assert.equal(it.t('connection.reconnecting'), 'RICONNESSIONE');
});

test('keeps English as the existing complete locale', () => {
  const en = i18nApi.create('en');
  assert.equal(en.t('timer.start'), 'START');
  assert.equal(en.t('status.running'), 'RUNNING');
  assert.equal(en.t('speaker.conclusion'), 'MOVE TO CONCLUSION');
});

test('localizes quick speaker messages without changing custom text', () => {
  const it = i18nApi.create('it');
  assert.equal(it.t('speaker.twoMinutes'), 'MANCANO 2 MIN');
  assert.equal(it.t('speaker.time'), 'TEMPO SCADUTO');
  const custom = 'Sponsor cue B';
  assert.equal(custom, 'Sponsor cue B');
});

test('localizes schedule variance', () => {
  const it = i18nApi.create('it');
  const en = i18nApi.create('en');
  assert.equal(it.formatVariance(null), 'NON AVVIATA');
  assert.equal(it.formatVariance(60_000), '+01:00 RITARDO');
  assert.equal(it.formatVariance(-60_000), '−01:00 ANTICIPO');
  assert.equal(en.formatVariance(60_000), '+01:00 LATE');
});

test('does not translate user-renamed presets or Run of Show items', () => {
  const it = i18nApi.create('it');
  assert.equal(it.localizeDefaultPreset({ id: 'preset-presentation', name: 'Presentation' }), 'Presentazione');
  assert.equal(it.localizeDefaultPreset({ id: 'preset-presentation', name: 'My custom presentation' }), 'My custom presentation');
  assert.equal(it.localizeDefaultRunItem({ id: 'ros-opening', title: 'Opening' }), 'Apertura');
  assert.equal(it.localizeDefaultRunItem({ id: 'ros-opening', title: 'Welcome by CEO' }), 'Welcome by CEO');
});

test('normalizing an old state adds language without altering custom content', () => {
  const oldState = {
    timer: { mode: 'countdown', durationMs: 300000, elapsedMs: 0, startedAt: null, status: 'idle', overtimeEnabled: true },
    presets: [{ id: 'custom', name: 'Cliente Alpha', durationMs: 420000, mode: 'countdown', warningPercent: 20, criticalSeconds: 60, overtimeEnabled: true }],
    selectedPresetId: 'custom',
    runOfShow: { title: 'Evento Cliente', items: [{ id: 'custom-item', startTime: '10:00', title: 'Intervento AD', speaker: 'Mario Rossi', durationMs: 600000, notes: 'Non modificare', status: 'pending', actualStartedAt: null }] },
    ui: { compactRunOfShow: true, activePanel: 'timer' }
  };
  const normalized = global.StageTimerCore.normalizeState(oldState, 1000);
  assert.equal(normalized.presets[0].name, 'Cliente Alpha');
  assert.equal(normalized.runOfShow.items[0].title, 'Intervento AD');
  assert.equal(normalized.runOfShow.items[0].notes, 'Non modificare');
  assert.ok(['en', 'it'].includes(normalized.ui.language));
});

console.log('\nAll localization tests passed.');
