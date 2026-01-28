// ADOC Reliability Metrics - Popup Script (Enhanced)
// Features: AES-256 Encryption, Auto-fetch, No Assets Error, Logout

class PopupController {
  constructor() {
    this.currentView = 'login';
    this.encryption = encryptionService; // From encryption.js
    this.init();
  }

  async init() {
    // Check authentication status
    const authStatus = await this.checkAuthStatus();

    if (authStatus.authenticated) {
      // Authenticated - automatically fetch data
      this.autoFetchData();
    } else {
      this.showView('login');
    }

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login button
    document.getElementById('login-btn')?.addEventListener('click', () => {
      this.handleLogin();
    });

    // Fetch Again button (from error view)
    document.getElementById('fetch-again-btn')?.addEventListener('click', () => {
      this.autoFetchData();
    });

    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
      this.handleRefresh();
    });

    // Logout buttons
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.handleLogout();
    });

    document.getElementById('logout-from-error-btn')?.addEventListener('click', () => {
      this.handleLogout();
    });

    // Close buttons
    const closeButtons = ['close-btn', 'close-btn-fetching', 'close-btn-noassets', 'close-btn-results'];
    closeButtons.forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        window.close();
      });
    });
  }

  async checkAuthStatus() {
    // Use encrypted storage
    const authData = await this.encryption.secureRetrieve('adoc_auth');
    return {
      authenticated: authData?.authenticated || false,
      token: authData?.token || null,
      loginTime: authData?.loginTime || null
    };
  }

  showView(viewName) {
    const views = ['login', 'fetching', 'no-assets', 'results'];
    views.forEach(view => {
      const element = document.getElementById(`${view}-view`);
      if (element) {
        element.classList.toggle('hidden', view !== viewName);
      }
    });
    this.currentView = viewName;
  }

  async handleLogin() {
    // Send message to background script to start monitoring
    chrome.runtime.sendMessage({
      action: 'startAuthMonitoring',
      loginUrl: 'https://indiumtech.acceldata.app/'
    });

    // Close the popup
    window.close();
  }

  async handleLogout() {
    // Clear all authentication data
    await this.encryption.secureRemove('adoc_auth');
    await this.encryption.secureRemove('cached_results');

    // Clear regular storage
    chrome.storage.local.clear(() => {
      // Show login view
      this.showView('login');
    });
  }

  async autoFetchData() {
    this.showView('fetching');

    try {
      // Get current Power BI context
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab || !currentTab.url.includes('powerbi.com')) {
        this.showError('Please open a Power BI report to fetch reliability data.');
        this.showView('no-assets');
        return;
      }

      // Send message to content script to extract Power BI assets
      chrome.tabs.sendMessage(currentTab.id, { action: 'extractAssets' }, async (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          this.showView('no-assets');
          return;
        }

        if (response && response.assets && response.assets.length > 0) {
          // Fetch reliability data from ADOC
          const results = await this.fetchReliabilityData(response.assets);

          // Check if any assets were found
          if (results.totalAssets === 0 || !results.assets || results.assets.length === 0) {
            // No assets found in ADOC
            this.showView('no-assets');
            return;
          }

          // Cache results using encryption
          await this.encryption.secureStore('cached_results', results);

          // Display results
          this.displayResults(results);
          this.showView('results');
        } else {
          // No assets found in Power BI
          this.showView('no-assets');
        }
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      this.showView('no-assets');
    }
  }

  async handleRefresh() {
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn?.classList.add('spinning');

    await this.autoFetchData();

    refreshBtn?.classList.remove('spinning');
  }

  async fetchReliabilityData(assets) {
    // Send request to background script to fetch data from ADOC API
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'fetchReliabilityData', assets: assets },
        (response) => {
          if (response && response.results) {
            resolve(response.results);
          } else {
            // Return empty results if API fails
            resolve({
              reportStatus: 'Unknown',
              totalAssets: 0,
              assetsWithAlerts: 0,
              assets: []
            });
          }
        }
      );
    });
  }

  displayResults(results) {
    // Update summary
    const statusBadge = document.getElementById('report-status');
    if (statusBadge) {
      statusBadge.textContent = results.reportStatus;
      statusBadge.className = `badge ${results.reportStatus === 'Healthy' ? 'badge-healthy' : 'badge-risky'}`;
    }

    const totalAssets = document.getElementById('total-assets');
    if (totalAssets) totalAssets.textContent = results.totalAssets;

    const alertCount = document.getElementById('alert-count');
    if (alertCount) alertCount.textContent = results.assetsWithAlerts;

    const alertsLink = document.getElementById('alerts-link');
    if (alertsLink) {
      if (results.assetsWithAlerts > 0) {
        alertsLink.classList.remove('hidden');
        alertsLink.href = 'https://indiumtech.acceldata.app/alerts';
      } else {
        alertsLink.classList.add('hidden');
      }
    }

    // Show/hide no alerts message
    const noAlertsMsg = document.getElementById('no-alerts-message');
    const assetsList = document.getElementById('assets-list');

    if (results.assetsWithAlerts === 0) {
      if (noAlertsMsg) noAlertsMsg.style.display = 'block';
      if (assetsList) assetsList.style.display = 'none';
    } else {
      if (noAlertsMsg) noAlertsMsg.style.display = 'none';
      if (assetsList) assetsList.style.display = 'block';

      // Display asset cards
      this.displayAssets(results.assets.filter(a => a.openAlerts > 0));
    }
  }

  displayAssets(assets) {
    const assetsList = document.getElementById('assets-list');
    if (!assetsList) return;

    assetsList.innerHTML = '';

    assets.forEach(asset => {
      const card = this.createAssetCard(asset);
      assetsList.appendChild(card);
    });
  }

  createAssetCard(asset) {
    const card = document.createElement('div');
    card.className = 'asset-card has-alerts';

    const scoreClass = asset.reliabilityScore >= 90 ? 'score-high' :
                       asset.reliabilityScore >= 70 ? 'score-medium' : 'score-low';

    card.innerHTML = `
      <div class="asset-header">
        <div class="asset-icon ${asset.type === 'TABLE' ? 'table-icon' : 'file-icon'}">
          ${this.getAssetIcon(asset.type)}
        </div>
        <div class="asset-title">
          <div class="asset-name">
            ${asset.name}
            <button class="copy-btn" title="Copy name" data-copy="${asset.name}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="asset-type">${asset.type}</div>
        </div>
      </div>
      <div class="asset-metrics">
        <div class="metric">
          <div class="metric-label">Data Reliability Score:</div>
          <div class="metric-value ${scoreClass}">${asset.reliabilityScore}%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Data Freshness:</div>
          <div class="metric-value">${asset.dataFreshness}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Last Profiled:</div>
          <div class="metric-value">${asset.lastProfiled}</div>
        </div>
      </div>
      <div class="asset-footer">
        <div>
          <div class="alert-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Open Alerts: ${asset.openAlerts}
            <a href="${asset.adocLink}/alerts" target="_blank" class="link-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
          <div class="upstream-info">Upstream Issues: ${asset.upstreamIssues}</div>
        </div>
      </div>
    `;

    // Add copy functionality
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn?.addEventListener('click', (e) => {
      const text = e.currentTarget.getAttribute('data-copy');
      navigator.clipboard.writeText(text);
    });

    return card;
  }

  getAssetIcon(type) {
    if (type === 'TABLE') {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M3 9h18M3 15h18M12 3v18" stroke="currentColor" stroke-width="2"/>
      </svg>`;
    } else {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2"/>
      </svg>`;
    }
  }

  showError(message) {
    console.error(message);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
