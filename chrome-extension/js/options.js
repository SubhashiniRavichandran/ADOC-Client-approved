// ADOC Reliability Metrics - Options Page Script

class OptionsController {
  constructor() {
    this.init();
  }

  async init() {
    // Load saved settings
    await this.loadSettings();

    // Setup event listeners
    this.setupEventListeners();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get([
        'adoc_server_url',
        'adoc_access_key',
        'adoc_secret_key'
      ], (result) => {
        document.getElementById('server-url').value =
          result.adoc_server_url || 'https://indiumtech.acceldata.app';

        document.getElementById('access-key').value =
          result.adoc_access_key || '';

        document.getElementById('secret-key').value =
          result.adoc_secret_key || '';

        resolve();
      });
    });
  }

  setupEventListeners() {
    // Save button
    document.getElementById('save-btn').addEventListener('click', () => {
      this.saveSettings();
    });

    // Test button
    document.getElementById('test-btn').addEventListener('click', () => {
      this.testConnection();
    });

    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
      this.clearSettings();
    });

    // Auto-save on Enter key
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.saveSettings();
        }
      });
    });
  }

  async saveSettings() {
    const serverUrl = document.getElementById('server-url').value.trim();
    const accessKey = document.getElementById('access-key').value.trim();
    const secretKey = document.getElementById('secret-key').value.trim();

    // Validate inputs
    if (!serverUrl) {
      this.showStatus('Server URL is required', 'error');
      return;
    }

    if (!this.isValidUrl(serverUrl)) {
      this.showStatus('Invalid server URL format', 'error');
      return;
    }

    // Save to storage
    chrome.storage.local.set({
      adoc_server_url: serverUrl,
      adoc_access_key: accessKey,
      adoc_secret_key: secretKey
    }, () => {
      this.showStatus('Settings saved successfully!', 'success');

      // If API keys are provided, also mark as authenticated
      if (accessKey && secretKey) {
        chrome.storage.local.set({ adoc_authenticated: true });
      }
    });
  }

  async testConnection() {
    const serverUrl = document.getElementById('server-url').value.trim();
    const accessKey = document.getElementById('access-key').value.trim();
    const secretKey = document.getElementById('secret-key').value.trim();

    if (!serverUrl) {
      this.showStatus('Please enter server URL', 'error');
      return;
    }

    // Save first
    await this.saveSettings();

    // Show testing message
    this.showStatus('Testing connection...', 'info');

    // Send test request to background script
    chrome.runtime.sendMessage(
      { action: 'testConnection' },
      (response) => {
        if (response && response.success) {
          this.showStatus('Connection successful! ✓', 'success');
        } else {
          const errorMsg = response?.message || 'Connection failed';
          this.showStatus(`Connection failed: ${errorMsg}`, 'error');
        }
      }
    );
  }

  clearSettings() {
    if (confirm('Are you sure you want to clear all settings?')) {
      document.getElementById('server-url').value = 'https://indiumtech.acceldata.app';
      document.getElementById('access-key').value = '';
      document.getElementById('secret-key').value = '';

      chrome.storage.local.remove([
        'adoc_server_url',
        'adoc_access_key',
        'adoc_secret_key',
        'adoc_authenticated'
      ], () => {
        this.showStatus('Settings cleared', 'success');
      });
    }
  }

  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  showStatus(message, type) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 3000);
    }
  }
}

// Initialize options page
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
