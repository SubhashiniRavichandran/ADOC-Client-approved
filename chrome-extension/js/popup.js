// ADOC Reliability Metrics - Popup Script

const ADOC_DEFAULT_URL = 'https://cso-enablement.poc.acceldatasolutions.net';
const CATALOG_LIST_URL = `${ADOC_DEFAULT_URL}/ui/torch/namespace/Default/data-reliability/catalog/list?sort=-1:dataQualityPolicyCount`;
const MSG_TIMEOUT_MS = 30000;

// Escape HTML special characters to prevent XSS when setting innerHTML
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

// Validate a URL is safe (https/http) before using in href
function safeUrl(url, fallback = '#') {
  try {
    const p = new URL(url);
    return (p.protocol === 'https:' || p.protocol === 'http:') ? url : fallback;
  } catch {
    return fallback;
  }
}

// Send a message to background with a timeout; resolves null on timeout or error
function sendMessageWithTimeout(msg, timeoutMs = MSG_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    try {
      chrome.runtime.sendMessage(msg, (response) => {
        clearTimeout(timer);
        if (chrome.runtime.lastError) {
          console.warn('[ADOC] sendMessage error:', chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        resolve(response);
      });
    } catch (e) {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

class PopupController {
  constructor() {
    this.currentView = 'login';
    this.init();
  }

  async init() {
    // Fetch auth status and cached results in parallel to avoid race condition
    const [authStatus, cachedResults] = await Promise.all([
      this.checkAuthStatus(),
      this.getCachedResults()
    ]);

    if (cachedResults) {
      this.displayResults(cachedResults);
      this.showView('results');
    } else if (authStatus.authenticated) {
      this.showView('fetch');
    } else {
      this.showView('login');
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('login-btn')?.addEventListener('click', () => this.handleLogin());

    document.getElementById('toggle-secret')?.addEventListener('click', () => {
      const input = document.getElementById('login-secret-key');
      if (input) input.type = input.type === 'password' ? 'text' : 'password';
    });

    ['login-access-key', 'login-secret-key'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleLogin();
      });
    });

    document.getElementById('fetch-btn')?.addEventListener('click', () => this.handleFetch());
    document.getElementById('refresh-btn')?.addEventListener('click', () => this.handleRefresh());

    // Query all close buttons by class instead of fragile numbered IDs
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', () => window.close());
    });
  }

  async checkAuthStatus() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['adoc_access_key', 'adoc_secret_key'], (result) => {
        if (chrome.runtime.lastError) { resolve({ authenticated: false }); return; }
        resolve({ authenticated: !!(result.adoc_access_key && result.adoc_secret_key) });
      });
    });
  }

  async getCachedResults() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['cached_results'], (result) => {
        if (chrome.runtime.lastError) { resolve(null); return; }
        resolve(result.cached_results || null);
      });
    });
  }

  showView(viewName) {
    ['login', 'fetch', 'fetching', 'results'].forEach(view => {
      const el = document.getElementById(`${view}-view`);
      if (el) el.classList.toggle('hidden', view !== viewName);
    });
    this.currentView = viewName;
  }

  async handleLogin() {
    const accessKey = document.getElementById('login-access-key')?.value.trim();
    const secretKey = document.getElementById('login-secret-key')?.value.trim();
    const errorEl = document.getElementById('login-error');
    if (!errorEl) return;

    errorEl.textContent = '';
    errorEl.classList.add('hidden');

    if (!accessKey || !secretKey) {
      errorEl.textContent = 'Both Access Key and Secret Key are required.';
      errorEl.classList.remove('hidden');
      return;
    }

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) { loginBtn.textContent = 'Connecting...'; loginBtn.disabled = true; }

    // Save keys so background can use them for the connection test
    await new Promise((resolve) => {
      chrome.storage.local.set({
        adoc_access_key: accessKey,
        adoc_secret_key: secretKey,
        adoc_server_url: ADOC_DEFAULT_URL
      }, () => {
        if (chrome.runtime.lastError) console.error('[ADOC] Storage error:', chrome.runtime.lastError.message);
        resolve();
      });
    });

    const response = await sendMessageWithTimeout({ action: 'testConnection' });

    if (loginBtn) { loginBtn.textContent = 'Connect to Acceldata'; loginBtn.disabled = false; }

    if (response && response.success) {
      this.showView('fetch');
    } else {
      chrome.storage.local.remove(['adoc_access_key', 'adoc_secret_key']);
      errorEl.textContent = response?.message || 'Connection failed. Please check your keys.';
      errorEl.classList.remove('hidden');
    }
  }

  async handleFetch() {
    this.showView('fetching');

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs && tabs[0];

      if (!currentTab || !currentTab.url) {
        this.showError('Unable to detect the current tab.');
        this.showView('fetch');
        return;
      }

      if (!currentTab.url.includes('powerbi.com')) {
        this.showError('Please open a Power BI report to fetch reliability data.');
        this.showView('fetch');
        return;
      }

      // Send to content script with timeout
      const response = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), MSG_TIMEOUT_MS);
        chrome.tabs.sendMessage(currentTab.id, { action: 'extractAssets' }, (res) => {
          clearTimeout(timer);
          if (chrome.runtime.lastError) {
            console.warn('[ADOC] Content script error:', chrome.runtime.lastError.message);
            resolve(null);
            return;
          }
          resolve(res);
        });
      });

      if (!response) {
        this.showError('Unable to access Power BI report. Please refresh the page.');
        this.showView('fetch');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const results = await this.fetchReliabilityData(response.assets, response.context);
        chrome.storage.local.set({ cached_results: results }, () => {
          if (chrome.runtime.lastError) console.error('[ADOC] Cache error:', chrome.runtime.lastError.message);
        });
        this.displayResults(results);
        this.showView('results');
      } else {
        this.showError('No data assets were detected in this Power BI report.');
        this.showView('fetch');
      }
    } catch (error) {
      console.error('[ADOC] Error fetching data:', error);
      this.showError('Failed to fetch reliability data. Please try again.');
      this.showView('fetch');
    }
  }

  async handleRefresh() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.classList.add('spinning');
    await this.handleFetch();
    if (refreshBtn) refreshBtn.classList.remove('spinning');
  }

  async fetchReliabilityData(assets, context = null) {
    const response = await sendMessageWithTimeout(
      { action: 'fetchReliabilityData', assets, context }
    );

    if (response && response.results) {
      return response.results;
    }

    // API failed — show warning and fall back to demo data
    const warning = document.getElementById('mock-warning');
    if (warning) warning.classList.remove('hidden');
    return this.generateMockResults(assets);
  }

  generateMockResults(assets) {
    const mockAssets = assets.map((asset, index) => {
      const hasAlerts = Math.random() > 0.7;
      const score = hasAlerts
        ? Math.floor(Math.random() * 30) + 70
        : Math.floor(Math.random() * 10) + 90;
      return {
        name: asset.name || `Asset_${index + 1}`,
        type: asset.type || 'TABLE',
        reliabilityScore: score,
        dataFreshness: '100%',
        lastProfiled: new Date().toLocaleDateString('en-US', {
          day: 'numeric', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        openAlerts: hasAlerts ? Math.floor(Math.random() * 5) + 1 : 0,
        upstreamIssues: hasAlerts ? Math.floor(Math.random() * 3) + 1 : 0,
        adocLink: CATALOG_LIST_URL
      };
    });

    const totalAlerts = mockAssets.filter(a => a.openAlerts > 0).length;
    return {
      reportStatus: totalAlerts > 0 ? 'Risky' : 'Healthy',
      totalAssets: mockAssets.length,
      assetsWithAlerts: totalAlerts,
      assets: mockAssets
    };
  }

  displayResults(results) {
    const statusBadge = document.getElementById('report-status');
    if (statusBadge) {
      statusBadge.textContent = results.reportStatus;
      statusBadge.className = `badge ${results.reportStatus === 'Healthy' ? 'badge-healthy' : 'badge-risky'}`;
    }

    const totalAssetsEl = document.getElementById('total-assets');
    if (totalAssetsEl) totalAssetsEl.textContent = results.totalAssets;

    const alertCountEl = document.getElementById('alert-count');
    if (alertCountEl) alertCountEl.textContent = results.assetsWithAlerts;

    const alertsLink = document.getElementById('alerts-link');
    if (alertsLink) {
      if (results.assetsWithAlerts > 0) {
        alertsLink.classList.remove('hidden');
        alertsLink.href = CATALOG_LIST_URL;
      } else {
        alertsLink.classList.add('hidden');
      }
    }

    const noAlertsMsg = document.getElementById('no-alerts-message');
    const assetsList = document.getElementById('assets-list');

    if (results.assetsWithAlerts === 0) {
      if (noAlertsMsg) noAlertsMsg.style.display = 'block';
      if (assetsList) assetsList.style.display = 'none';
    } else {
      if (noAlertsMsg) noAlertsMsg.style.display = 'none';
      if (assetsList) {
        assetsList.style.display = 'block';
        this.displayAssets(results.assets.filter(a => a.openAlerts > 0));
      }
    }
  }

  displayAssets(assets) {
    const assetsList = document.getElementById('assets-list');
    if (!assetsList) return;
    // Use DocumentFragment for efficient batch DOM insertion
    const fragment = document.createDocumentFragment();
    assetsList.innerHTML = '';
    assets.forEach(asset => fragment.appendChild(this.createAssetCard(asset)));
    assetsList.appendChild(fragment);
  }

  createAssetCard(asset) {
    const card = document.createElement('div');
    card.className = 'asset-card has-alerts';

    const scoreClass = asset.reliabilityScore >= 90 ? 'score-high' :
                       asset.reliabilityScore >= 70 ? 'score-medium' : 'score-low';
    const iconClass = asset.type === 'TABLE' ? 'table-icon' : 'file-icon';
    const alertHref = safeUrl(`${asset.adocLink}/alerts`);

    // Static structure only in innerHTML — all dynamic values set via textContent below
    card.innerHTML = `
      <div class="asset-header">
        <div class="asset-icon ${iconClass}">
          ${this.getAssetIcon(asset.type)}
        </div>
        <div class="asset-title">
          <div class="asset-name">
            <span class="js-asset-name"></span>
            <button class="copy-btn" title="Copy name">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="js-asset-type asset-type"></div>
        </div>
      </div>
      <div class="asset-metrics">
        <div class="metric">
          <div class="metric-label">Data Reliability Score:</div>
          <div class="metric-value js-score"></div>
        </div>
        <div class="metric">
          <div class="metric-label">Data Freshness:</div>
          <div class="metric-value js-freshness"></div>
        </div>
        <div class="metric">
          <div class="metric-label">Last Profiled:</div>
          <div class="metric-value js-profiled"></div>
        </div>
      </div>
      <div class="asset-footer">
        <div>
          <div class="alert-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="js-alert-count"></span>
            <a class="link-icon js-alert-link" target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
          <div class="js-upstream upstream-info"></div>
        </div>
      </div>
    `;

    // Set all dynamic values using textContent (safe from XSS)
    card.querySelector('.js-asset-name').textContent = asset.name;
    card.querySelector('.js-asset-type').textContent = asset.type;

    const scoreEl = card.querySelector('.js-score');
    scoreEl.textContent = `${asset.reliabilityScore}%`;
    scoreEl.classList.add(scoreClass);

    card.querySelector('.js-freshness').textContent = asset.dataFreshness;
    card.querySelector('.js-profiled').textContent = asset.lastProfiled;
    card.querySelector('.js-alert-count').textContent = `Open Alerts: ${asset.openAlerts}`;
    card.querySelector('.js-alert-link').href = alertHref;
    card.querySelector('.js-upstream').textContent = `Upstream Issues: ${asset.upstreamIssues}`;

    card.querySelector('.copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(asset.name).catch(console.error);
    });

    return card;
  }

  getAssetIcon(type) {
    if (type === 'TABLE') {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M3 9h18M3 15h18M12 3v18" stroke="currentColor" stroke-width="2"/>
      </svg>`;
    }
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  showError(message) {
    alert(message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
