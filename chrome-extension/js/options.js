// ADOC Reliability Metrics - Options Page Script

const DEFAULT_SERVER_URL = 'https://cso-enablement.poc.acceldatasolutions.net';
const STATUS_HIDE_MS = 3000;
const TEST_TIMEOUT_MS = 30000;

class OptionsController {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['adoc_server_url', 'adoc_access_key', 'adoc_secret_key'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('[ADOC] Failed to load settings:', chrome.runtime.lastError.message);
          resolve();
          return;
        }

        const serverUrlEl = document.getElementById('server-url');
        const accessKeyEl = document.getElementById('access-key');
        const secretKeyEl = document.getElementById('secret-key');

        if (serverUrlEl) serverUrlEl.value = result.adoc_server_url || DEFAULT_SERVER_URL;
        if (accessKeyEl) accessKeyEl.value = result.adoc_access_key || '';
        if (secretKeyEl) secretKeyEl.value = result.adoc_secret_key || '';

        resolve();
      });
    });
  }

  setupEventListeners() {
    document.getElementById('save-btn')?.addEventListener('click', () => this.saveSettings());
    document.getElementById('test-btn')?.addEventListener('click', () => this.testConnection());
    document.getElementById('clear-btn')?.addEventListener('click', () => this.clearSettings());

    document.querySelectorAll('input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.saveSettings();
      });
    });
  }

  async saveSettings() {
    const serverUrlEl = document.getElementById('server-url');
    const accessKeyEl = document.getElementById('access-key');
    const secretKeyEl = document.getElementById('secret-key');

    const serverUrl = serverUrlEl?.value.trim() || '';
    const accessKey = accessKeyEl?.value.trim() || '';
    const secretKey = secretKeyEl?.value.trim() || '';

    if (!serverUrl) {
      this.showStatus('Server URL is required', 'error');
      return;
    }
    if (!this.isValidUrl(serverUrl)) {
      this.showStatus('Invalid server URL format', 'error');
      return;
    }

    return new Promise((resolve) => {
      chrome.storage.local.set({
        adoc_server_url: serverUrl,
        adoc_access_key: accessKey,
        adoc_secret_key: secretKey
      }, () => {
        if (chrome.runtime.lastError) {
          this.showStatus(`Save failed: ${chrome.runtime.lastError.message}`, 'error');
          resolve(false);
          return;
        }
        this.showStatus('Settings saved successfully!', 'success');
        if (accessKey && secretKey) {
          chrome.storage.local.set({ adoc_authenticated: true });
        }
        resolve(true);
      });
    });
  }

  async testConnection() {
    const serverUrl = document.getElementById('server-url')?.value.trim();
    if (!serverUrl) {
      this.showStatus('Please enter server URL', 'error');
      return;
    }

    // Save settings first so background uses the latest values
    const saved = await this.saveSettings();
    if (!saved) return;

    this.showStatus('Testing connection...', 'info');

    // Wrap sendMessage with a timeout so it never hangs forever
    const response = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), TEST_TIMEOUT_MS);
      try {
        chrome.runtime.sendMessage({ action: 'testConnection' }, (res) => {
          clearTimeout(timer);
          if (chrome.runtime.lastError) { resolve(null); return; }
          resolve(res);
        });
      } catch {
        clearTimeout(timer);
        resolve(null);
      }
    });

    if (!response) {
      this.showStatus('Connection timed out or extension restarted. Try again.', 'error');
    } else if (response.success) {
      this.showStatus('Connection successful! ✓', 'success');
    } else {
      this.showStatus(`Connection failed: ${response.message || 'Unknown error'}`, 'error');
    }
  }

  clearSettings() {
    if (confirm('Are you sure you want to clear all settings?')) {
      const serverUrlEl = document.getElementById('server-url');
      const accessKeyEl = document.getElementById('access-key');
      const secretKeyEl = document.getElementById('secret-key');

      if (serverUrlEl) serverUrlEl.value = DEFAULT_SERVER_URL;
      if (accessKeyEl) accessKeyEl.value = '';
      if (secretKeyEl) secretKeyEl.value = '';

      chrome.storage.local.remove(
        ['adoc_server_url', 'adoc_access_key', 'adoc_secret_key', 'adoc_authenticated'],
        () => {
          if (chrome.runtime.lastError) {
            this.showStatus(`Clear failed: ${chrome.runtime.lastError.message}`, 'error');
            return;
          }
          this.showStatus('Settings cleared', 'success');
        }
      );
    }
  }

  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  showStatus(message, type) {
    const statusEl = document.getElementById('status-message');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => { statusEl.style.display = 'none'; }, STATUS_HIDE_MS);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
