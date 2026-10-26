(function (global) {
  'use strict';

  const CHANNEL_NAME = 'stage-timer-ai-v1';
  const PULSE_KEY = 'stageTimerAI.sync.pulse.v1';

  class LocalSync {
    constructor(role, onMessage) {
      this.role = role;
      this.onMessage = onMessage;
      this.sourceId = StageTimerCore.createId(role || 'client');
      this.channel = null;
      this.storageHandler = this.handleStorage.bind(this);
      this.started = false;
    }

    start() {
      if (this.started) return;
      this.started = true;
      if ('BroadcastChannel' in global) {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => this.receive(event.data);
      }
      global.addEventListener('storage', this.storageHandler);
      this.send({ type: 'HELLO', role: this.role, sentAt: Date.now() });
    }

    handleStorage(event) {
      if (event.key === PULSE_KEY && event.newValue) {
        try {
          this.receive(JSON.parse(event.newValue));
        } catch (error) {
          // Ignore malformed cross-tab messages.
        }
      }
      if (event.key === global.StageTimerStorageKey && event.newValue) {
        try {
          this.receive({
            type: 'STATE',
            state: JSON.parse(event.newValue),
            sourceId: 'storage-event',
            role: 'storage',
            sentAt: Date.now()
          });
        } catch (error) {
          // Ignore malformed stored state.
        }
      }
    }

    receive(message) {
      if (!message || message.sourceId === this.sourceId) return;
      if (typeof this.onMessage === 'function') this.onMessage(message);
    }

    send(payload) {
      const message = Object.assign({}, payload, {
        sourceId: this.sourceId,
        role: this.role,
        sentAt: payload.sentAt || Date.now()
      });
      if (this.channel) this.channel.postMessage(message);
      try {
        global.localStorage.setItem(PULSE_KEY, JSON.stringify(message));
      } catch (error) {
        // BroadcastChannel may still be available; no action needed.
      }
    }

    sendState(state) {
      this.send({ type: 'STATE', state });
    }

    heartbeat(extra) {
      this.send(Object.assign({ type: 'HEARTBEAT' }, extra || {}));
    }

    requestState() {
      this.send({ type: 'REQUEST_STATE' });
    }

    close() {
      global.removeEventListener('storage', this.storageHandler);
      if (this.channel) this.channel.close();
      this.started = false;
    }
  }

  global.StageTimerLocalSync = LocalSync;
})(window);
