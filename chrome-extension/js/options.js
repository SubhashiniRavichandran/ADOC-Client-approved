// ADOC Reliability Metrics - Options Page (SSO-based, no API keys)

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

  // ── Load saved server URL ─────────────────────────────────────────────────
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['adoc_server_url'], (result) => {
        if (chrome.runtime.lastError) { resolve(); return; }
        const el = document.getElementById('server-url');
        if (el) el.value = result.adoc_server_url || DEFAULT_SERVER_URL;
        resolve();
      });
    });
  }

  // ── Show logged-in / logged-out state ────────────────────────────────────
  async renderAuthStatus() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['adoc_authenticated'], (result) => {
        if (chrome.runtime.lastError) { resolve(); return; }
        const loggedIn = !!result.adoc_authenticated;

        const card      = document.getElementById('auth-card');
        const dot       = document.getElementById('auth-dot');
        const label     = document.getElementById('auth-label');
        const loginBtn  = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (loggedIn) {
          if (card)  card.classList.remove('logged-out');
          if (dot)   dot.style.background = '#10b981';
          if (label) label.textContent = 'Logged in to Acceldata';
          if (loginBtn)  loginBtn.classList.add('hidden');
          if (logoutBtn) logoutBtn.classList.remove('hidden');
        } else {
          if (card)  card.classList.add('logged-out');
          if (dot)   dot.style.background = '#ef4444';
          if (label) label.textContent = 'Not logged in';
          if (loginBtn)  loginBtn.classList.remove('hidden');
          if (logoutBtn) logoutBtn.classList.add('hidden');
        }
        resolve();
      });
    });
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  bindEvents() {
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

  // ── Logout: clear session and cached data ─────────────────────────────────
  logout() {
    chrome.storage.local.remove(['adoc_authenticated', 'cached_results'], () => {
      if (chrome.runtime.lastError) {
        this.showStatus(`Logout failed: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }
      // Also notify background so popup reflects the change
      chrome.runtime.sendMessage({ action: 'logout' }).catch(() => {});
      this.renderAuthStatus();
      this.showStatus('Logged out successfully', 'success');
    });
  }

  // ── Status message ────────────────────────────────────────────────────────
  showStatus(message, type) {
    const el = document.getElementById('status-message');
    if (!el) return;
    el.textContent = message;
    el.className = type;
    if (type === 'success') {
      setTimeout(() => { el.className = ''; el.style.display = 'none'; }, 3000);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new OptionsController());
