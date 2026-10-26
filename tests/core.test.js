'use strict';

const assert = require('node:assert/strict');
const core = require('../js/core.js');

function test(name, callback) {
  try {
    callback();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const thresholds = { warningPercent: 20, criticalSeconds: 60 };

function timer(overrides) {
  return Object.assign({
    mode: 'countdown',
    durationMs: 5 * 60 * 1000,
    elapsedMs: 0,
    startedAt: null,
    status: 'idle',
    overtimeEnabled: true
  }, overrides || {});
}

test('uses real timestamp differences instead of tick counts', () => {
  const started = core.startTimer(timer(), 1000);
  const view = core.deriveTimer(started, thresholds, 121000);
  assert.equal(view.elapsedMs, 120000);
  assert.equal(view.remainingMs, 180000);
  assert.equal(core.formatClock(view.displayMs), '03:00');
});

test('survives a long suspended-tab jump without drift', () => {
  const started = core.startTimer(timer({ durationMs: 60 * 60 * 1000 }), 10_000);
  const view = core.deriveTimer(started, thresholds, 10_000 + 37 * 60 * 1000 + 4321);
  assert.equal(view.elapsedMs, 37 * 60 * 1000 + 4321);
  assert.equal(view.remainingMs, 23 * 60 * 1000 - 4321);
});

test('pause freezes elapsed time and resume continues from the reference timestamp', () => {
  const started = core.startTimer(timer(), 1000);
  const paused = core.pauseTimer(started, 61_000);
  assert.equal(paused.elapsedMs, 60_000);
  assert.equal(core.deriveTimer(paused, thresholds, 500_000).elapsedMs, 60_000);
  const resumed = core.resumeTimer(paused, 500_000);
  assert.equal(core.deriveTimer(resumed, thresholds, 530_000).elapsedMs, 90_000);
});

test('reset clears elapsed time and returns to idle', () => {
  const reset = core.resetTimer(timer({ elapsedMs: 123456, status: 'paused' }));
  assert.equal(reset.elapsedMs, 0);
  assert.equal(reset.startedAt, null);
  assert.equal(reset.status, 'idle');
});

test('adding time while running preserves elapsed time and increases remaining time', () => {
  const started = core.startTimer(timer(), 0);
  const adjusted = core.adjustDuration(started, 60_000, 120_000);
  const view = core.deriveTimer(adjusted, thresholds, 120_000);
  assert.equal(adjusted.durationMs, 360_000);
  assert.equal(view.elapsedMs, 120_000);
  assert.equal(view.remainingMs, 240_000);
});

test('subtracting time during a run enters overtime when enabled', () => {
  const started = core.startTimer(timer({ durationMs: 120_000 }), 0);
  const adjusted = core.adjustDuration(started, -60_000, 90_000);
  const view = core.deriveTimer(adjusted, thresholds, 90_000);
  assert.equal(view.isOvertime, true);
  assert.equal(view.displayPrefix, '+');
  assert.equal(core.formatClock(view.displayMs, { prefix: view.displayPrefix }), '+00:30');
  assert.equal(view.band, 'overtime');
});

test('STOP-at-zero mode completes and clamps exactly to target', () => {
  const started = core.startTimer(timer({ durationMs: 60_000, overtimeEnabled: false }), 5000);
  const completed = core.completeIfNeeded(started, 80_000);
  assert.equal(completed.status, 'completed');
  assert.equal(completed.elapsedMs, 60_000);
  assert.equal(core.deriveTimer(completed, thresholds, 900_000).displayMs, 0);
});

test('count-up shows elapsed time then overtime relative to target', () => {
  const started = core.startTimer(timer({ mode: 'countup', durationMs: 60_000 }), 0);
  assert.equal(core.formatClock(core.deriveTimer(started, thresholds, 45_000).displayMs), '00:45');
  const overtime = core.deriveTimer(started, thresholds, 75_000);
  assert.equal(core.formatClock(overtime.displayMs, { prefix: overtime.displayPrefix }), '+00:15');
});

test('warning and critical thresholds are applied in the correct order', () => {
  assert.equal(core.evaluateBand(121_000, 600_000, thresholds, false), 'normal');
  assert.equal(core.evaluateBand(119_000, 600_000, thresholds, false), 'warning');
  assert.equal(core.evaluateBand(60_000, 600_000, thresholds, false), 'critical');
  assert.equal(core.evaluateBand(-1, 600_000, thresholds, true), 'overtime');
});

test('Run of Show variance compares actual start with planned offset', () => {
  const runOfShow = {
    items: [
      { id: 'a', startTime: '09:00' },
      { id: 'b', startTime: '09:10', actualStartedAt: 1_660_000 }
    ],
    showStartedAt: 1_000_000,
    baseItemId: 'a'
  };
  assert.equal(core.scheduleVariance(runOfShow, runOfShow.items[1], 0), 60_000);
  assert.equal(core.formatVariance(60_000), '+01:00 LATE');
});

test('state normalization restores required persisted collections', () => {
  const normalized = core.normalizeState({ timer: timer(), presets: [], runOfShow: { items: [] } }, 123);
  assert.ok(normalized.presets.length >= 1);
  assert.ok(Array.isArray(normalized.runOfShow.items));
  assert.equal(normalized.version, core.APP_VERSION);
});

console.log('\nAll core timer tests passed.');
