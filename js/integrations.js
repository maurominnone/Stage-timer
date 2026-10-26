(function (global) {
  'use strict';

  class RemoteStageAdapter extends EventTarget {
    constructor() {
      super();
      this.socket = null;
      this.status = 'offline';
      this.config = null;
      this.retryCount = 0;
      this.retryTimer = null;
      this.manuallyClosed = false;
    }

    setStatus(status) {
      this.status = status;
      this.dispatchEvent(new CustomEvent('status', { detail: { status } }));
    }

    connect(config) {
      this.disconnect();
      this.config = Object.assign({}, config);
      if (!this.config.enabled || !this.config.endpoint || !this.config.sessionCode) {
        this.setStatus('offline');
        return;
      }
      this.manuallyClosed = false;
      this.openSocket();
    }

    openSocket() {
      this.setStatus(this.retryCount ? 'reconnecting' : 'offline');
      try {
        const url = new URL(this.config.endpoint);
        url.searchParams.set('session', this.config.sessionCode);
        url.searchParams.set('role', this.config.role || 'control');
        const token = this.config.token || '';
        if (token) url.searchParams.set('access_token', token);
        this.socket = new WebSocket(url.toString());
        this.socket.addEventListener('open', () => {
          this.retryCount = 0;
          this.setStatus('connected');
        });
        this.socket.addEventListener('message', (event) => {
          try {
            this.dispatchEvent(new CustomEvent('message', { detail: JSON.parse(event.data) }));
          } catch (error) {
            // The external service must send JSON messages.
          }
        });
        this.socket.addEventListener('close', () => this.handleDisconnect());
        this.socket.addEventListener('error', () => this.handleDisconnect());
      } catch (error) {
        this.handleDisconnect();
      }
    }

    handleDisconnect() {
      if (this.manuallyClosed || !this.config || !this.config.enabled) {
        this.setStatus('offline');
        return;
      }
      if (this.retryTimer) return;
      this.setStatus('reconnecting');
      const delay = Math.min(30000, 1000 * Math.pow(2, this.retryCount));
      this.retryCount += 1;
      this.retryTimer = global.setTimeout(() => {
        this.retryTimer = null;
        this.openSocket();
      }, delay);
    }

    send(type, payload) {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
      this.socket.send(JSON.stringify({ type, payload, sentAt: Date.now(), session: this.config.sessionCode }));
      return true;
    }

    disconnect() {
      this.manuallyClosed = true;
      if (this.retryTimer) global.clearTimeout(this.retryTimer);
      this.retryTimer = null;
      if (this.socket) {
        this.socket.onclose = null;
        this.socket.close();
      }
      this.socket = null;
      this.retryCount = 0;
      this.setStatus('offline');
    }
  }

  class SpeechTrackingAdapter extends EventTarget {
    constructor() {
      super();
      this.recognition = null;
      this.listening = false;
    }

    isBrowserSpeechAvailable() {
      return Boolean(global.SpeechRecognition || global.webkitSpeechRecognition);
    }

    startBrowserSpeech(language) {
      if (!this.isBrowserSpeechAvailable() || this.listening) return false;
      const Recognition = global.SpeechRecognition || global.webkitSpeechRecognition;
      this.recognition = new Recognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = language || 'en-US';
      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          transcript += event.results[index][0].transcript;
        }
        this.dispatchEvent(new CustomEvent('transcript', { detail: { transcript } }));
      };
      this.recognition.onend = () => {
        this.listening = false;
        this.dispatchEvent(new CustomEvent('status', { detail: { listening: false } }));
      };
      this.recognition.start();
      this.listening = true;
      this.dispatchEvent(new CustomEvent('status', { detail: { listening: true } }));
      return true;
    }

    stopBrowserSpeech() {
      if (this.recognition) this.recognition.stop();
      this.listening = false;
    }

    async analyzeWithExternalService(config, payload) {
      if (!config || !config.endpoint) throw new Error('AI endpoint not configured');
      const headers = { 'Content-Type': 'application/json' };
      if (config.token) headers.Authorization = `Bearer ${config.token}`;
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`AI service error: ${response.status}`);
      return response.json();
    }
  }

  global.StageTimerRemoteAdapter = RemoteStageAdapter;
  global.StageTimerSpeechAdapter = SpeechTrackingAdapter;
})(window);
