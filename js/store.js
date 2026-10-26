(function (global) {
  'use strict';

  const STORAGE_KEY = 'stageTimerAI.state.v1';
  const BACKUP_KEY = 'stageTimerAI.state.backup.v1';

  class StageTimerStore {
    constructor(key) {
      this.key = key || STORAGE_KEY;
      this.available = this.checkAvailability();
    }

    checkAvailability() {
      try {
        const testKey = '__stage_timer_storage_test__';
        global.localStorage.setItem(testKey, '1');
        global.localStorage.removeItem(testKey);
        return true;
      } catch (error) {
        return false;
      }
    }

    load() {
      if (!this.available) return StageTimerCore.createInitialState(Date.now());
      try {
        const raw = global.localStorage.getItem(this.key);
        if (!raw) return StageTimerCore.createInitialState(Date.now());
        return StageTimerCore.normalizeState(JSON.parse(raw), Date.now());
      } catch (error) {
        try {
          const backup = global.localStorage.getItem(BACKUP_KEY);
          if (backup) return StageTimerCore.normalizeState(JSON.parse(backup), Date.now());
        } catch (backupError) {
          // Fall through to safe defaults.
        }
        return StageTimerCore.createInitialState(Date.now());
      }
    }

    save(state) {
      const normalized = StageTimerCore.normalizeState(state, Date.now());
      if (!this.available) return normalized;
      try {
        const previous = global.localStorage.getItem(this.key);
        if (previous) global.localStorage.setItem(BACKUP_KEY, previous);
        global.localStorage.setItem(this.key, JSON.stringify(normalized));
      } catch (error) {
        this.available = false;
      }
      return normalized;
    }

    reset() {
      const state = StageTimerCore.createInitialState(Date.now());
      return this.save(state);
    }

    export(state) {
      return JSON.stringify(StageTimerCore.normalizeState(state, Date.now()), null, 2);
    }

    import(raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const state = StageTimerCore.normalizeState(parsed, Date.now());
      return this.save(state);
    }
  }

  global.StageTimerStore = StageTimerStore;
  global.StageTimerStorageKey = STORAGE_KEY;
})(window);
