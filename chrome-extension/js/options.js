// ADOC Reliability Metrics - Options Page

const DEFAULT_SERVER_URL = 'https://cso-enablement.poc.acceldatasolutions.net';
const TEST_TIMEOUT_MS = 30000;

class OptionsController {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.renderAuthStatus();
    this.bindEvents();
  }

  // ── Load saved settings ───────────────────────────────────────────────────
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['adoc_server_url', 'adoc_access_key', 'adoc_secret_key'], (result) => {
        if (chrome.runtime.lastError) { resolve(); return; }
        const urlEl = document.getElementById('server-url');
        if (urlEl) urlEl.value = result.adoc_server_url || DEFAULT_SERVER_URL;
        const akEl = document.getElementById('access-key');
        if (akEl) akEl.value = result.adoc_access_key || '';
        const skEl = document.getElementById('secret-key');
        if (skEl) skEl.value = result.adoc_secret_key || '';
        resolve();
      });
    });
  }

  // ── Show connected / not-connected state ─────────────────────────────────
  async renderAuthStatus() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['adoc_authenticated', 'adoc_access_key', 'adoc_secret_key'], (result) => {
        if (chrome.runtime.lastError) { resolve(); return; }
        const hasApiKeys = !!result.adoc_access_key && !!result.adoc_secret_key;
        const loggedIn   = !!result.adoc_authenticated || hasApiKeys;

        const card      = document.getElementById('auth-card');
        const dot       = document.getElementById('auth-dot');
        const label     = document.getElementById('auth-label');
        const loginBtn  = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (loggedIn) {
          if (card)  card.classList.remove('logged-out');
          if (dot)   dot.style.background = '#10b981';
          if (label) label.textContent = hasApiKeys ? 'Connected via API keys' : 'Logged in to Acceldata';
          if (loginBtn)  loginBtn.classList.add('hidden');
          if (logoutBtn) logoutBtn.classList.remove('hidden');
        } else {
          if (card)  card.classList.add('logged-out');
          if (dot)   dot.style.background = '#ef4444';
          if (label) label.textContent = 'Not connected — enter API credentials below';
          if (loginBtn)  loginBtn.classList.remove('hidden');
          if (logoutBtn) logoutBtn.classList.add('hidden');
        }
        resolve();
      });
    });
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  bindEvents() {
    document.getElementById('save-credentials-btn')?.addEventListener('click', () => this.saveCredentials());
    document.getElementById('save-btn')?.addEventListener('click', () => this.saveUrl());
    document.getElementById('test-btn')?.addEventListener('click', () => this.testConnection());
    document.getElementById('login-btn')?.addEventListener('click', () => this.startLogin());
    document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());

    document.getElementById('server-url')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveUrl();
    });
  }

  // ── Save server URL ───────────────────────────────────────────────────────
  saveUrl() {
    const el  = document.getElementById('server-url');
    const url = el?.value.trim() || '';

    if (!url) { this.showStatus('Server URL is required', 'error'); return; }

    try { new URL(url); } catch {
      this.showStatus('Invalid URL format', 'error');
      return;
    }

    chrome.storage.local.set({ adoc_server_url: url }, () => {
      if (chrome.runtime.lastError) {
        this.showStatus(`Save failed: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }
      this.showStatus('Server URL saved ✓', 'success');
    });
  }

  // ── Save API credentials ──────────────────────────────────────────────────
  saveCredentials() {
    const ak = document.getElementById('access-key')?.value.trim() || '';
    const sk = document.getElementById('secret-key')?.value.trim() || '';

    if (!ak || !sk) {
      this.showCredentialsStatus('Both Access Key and Secret Key are required', 'error');
      return;
    }

    chrome.storage.local.set({ adoc_access_key: ak, adoc_secret_key: sk, adoc_authenticated: true }, () => {
      if (chrome.runtime.lastError) {
        this.showCredentialsStatus(`Save failed: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }
      this.renderAuthStatus();
      this.showCredentialsStatus('API credentials saved ✓', 'success');
    });
  }

  // ── Test connection ───────────────────────────────────────────────────────
  async testConnection() {
    this.showStatus('Testing connection…', 'info');

    const response = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), TEST_TIMEOUT_MS);
      try {
        chrome.runtime.sendMessage({ action: 'testConnection' }, (res) => {
          clearTimeout(timer);
          if (chrome.runtime.lastError) { resolve(null); return; }
          resolve(res);
        });
      } catch { clearTimeout(timer); resolve(null); }
    });

    if (!response) {
      this.showStatus('Connection timed out. Try again.', 'error');
    } else if (response.success) {
      this.showStatus('Connection successful ✓', 'success');
    } else {
      this.showStatus(`Connection failed: ${response.message || 'Unknown error'}`, 'error');
    }
  }

  // ── SSO login: ask background to open login tab ───────────────────────────
  startLogin() {
    chrome.runtime.sendMessage({ action: 'startSsoLogin' }, () => {
      if (chrome.runtime.lastError) {
        this.showStatus('Could not open login tab', 'error');
        return;
      }
      this.showStatus('Login tab opened — complete sign-in there, then return here.', 'info');
    });

    // Re-check auth status after a short delay (user may have already logged in)
    setTimeout(() => this.renderAuthStatus(), 3000);
  }

  // ── Logout: clear session, API keys, and cached data ─────────────────────
  logout() {
    chrome.storage.local.remove(
      ['adoc_authenticated', 'cached_results', 'adoc_access_key', 'adoc_secret_key'],
      () => {
        if (chrome.runtime.lastError) {
          this.showStatus(`Logout failed: ${chrome.runtime.lastError.message}`, 'error');
          return;
        }
        // Clear the key fields in the UI
        const akEl = document.getElementById('access-key');
        const skEl = document.getElementById('secret-key');
        if (akEl) akEl.value = '';
        if (skEl) skEl.value = '';
        chrome.runtime.sendMessage({ action: 'logout' }).catch(() => {});
        this.renderAuthStatus();
        this.showStatus('Logged out successfully', 'success');
      }
    );
  }

  // ── Status messages ───────────────────────────────────────────────────────
  showStatus(message, type) {
    this._setStatus('status-message', message, type);
  }

  showCredentialsStatus(message, type) {
    this._setStatus('credentials-status', message, type);
  }

  _setStatus(id, message, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.className = type;
    if (type === 'success') {
      setTimeout(() => { el.className = ''; el.style.display = 'none'; }, 3000);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new OptionsController());
