// ADOC Reliability Metrics - Popup Script (DEMO VERSION with Mock Data)
// Features: AES-256 Encryption, Auto-fetch, No Assets Error, Logout, Mock Data for Demo

class PopupController {
  constructor() {
    this.currentView = 'login';
    this.encryption = encryptionService; // From encryption.js
    this.mockDataScenarios = this.generateMockScenarios();
    this.init();
  }

  async init() {
    // Check authentication status
    const authStatus = await this.checkAuthStatus();

    if (authStatus.authenticated) {
      // Authenticated - automatically fetch data with mock
      this.autoFetchData();
    } else {
      this.showView('login');
    }

    // Setup event listeners
    this.setupEventListeners();
  }

  // Generate mock data scenarios for demo
  generateMockScenarios() {
    return {
      // Scenario 1: Healthy - No alerts
      healthy: {
        reportStatus: 'Healthy',
        totalAssets: 175,
        assetsWithAlerts: 0,
        assets: []
      },

      // Scenario 2: No assets found (handled by error view)
      noAssets: null,

      // Scenario 3: Risky - With open alerts
      risky: {
        reportStatus: 'Risky',
        totalAssets: 175,
        assetsWithAlerts: 25,
        assets: [
          {
            name: 'TRANSACTIONS_DATA',
            type: 'TABLE',
            reliabilityScore: 92.12,
            dataFreshness: '100%',
            lastProfiled: '25 Jun 2024, 14:24 PM',
            openAlerts: 2,
            upstreamIssues: 5,
            adocLink: 'https://indiumtech.acceldata.app/assets/trans-001'
          },
          {
            name: 'PharmaSalesbyDistributor',
            type: 'TABLE',
            reliabilityScore: 92.12,
            dataFreshness: '100%',
            lastProfiled: '15 Feb 2024, 14:24 PM',
            openAlerts: 1,
            upstreamIssues: 0,
            adocLink: 'https://indiumtech.acceldata.app/assets/pharma-002'
          },
          {
            name: 'Customer_details',
            type: 'TABLE',
            reliabilityScore: 76.3,
            dataFreshness: '98%',
            lastProfiled: '22 Jun 2024, 10:15 AM',
            openAlerts: 3,
            upstreamIssues: 2,
            adocLink: 'https://indiumtech.acceldata.app/assets/cust-003'
          },
          {
            name: 'Sales_Summary',
            type: 'TABLE',
            reliabilityScore: 88.5,
            dataFreshness: '100%',
            lastProfiled: '28 Jun 2024, 09:30 AM',
            openAlerts: 1,
            upstreamIssues: 1,
            adocLink: 'https://indiumtech.acceldata.app/assets/sales-004'
          },
          {
            name: 'Inventory_Master',
            type: 'TABLE',
            reliabilityScore: 94.7,
            dataFreshness: '100%',
            lastProfiled: '30 Jun 2024, 16:45 PM',
            openAlerts: 2,
            upstreamIssues: 3,
            adocLink: 'https://indiumtech.acceldata.app/assets/inv-005'
          },
          {
            name: 'Product_Catalog',
            type: 'TABLE',
            reliabilityScore: 82.1,
            dataFreshness: '95%',
            lastProfiled: '20 Jun 2024, 11:20 AM',
            openAlerts: 1,
            upstreamIssues: 0,
            adocLink: 'https://indiumtech.acceldata.app/assets/prod-006'
          },
          {
            name: 'Order_Details',
            type: 'TABLE',
            reliabilityScore: 79.3,
            dataFreshness: '97%',
            lastProfiled: '24 Jun 2024, 13:15 PM',
            openAlerts: 2,
            upstreamIssues: 4,
            adocLink: 'https://indiumtech.acceldata.app/assets/order-007'
          },
          {
            name: 'Shipping_Info',
            type: 'TABLE',
            reliabilityScore: 91.8,
            dataFreshness: '100%',
            lastProfiled: '29 Jun 2024, 08:50 AM',
            openAlerts: 1,
            upstreamIssues: 1,
            adocLink: 'https://indiumtech.acceldata.app/assets/ship-008'
          }
        ]
      }
    };
  }

  // Get random mock scenario
  getRandomScenario() {
    const scenarios = ['healthy', 'noAssets', 'risky'];
    const randomIndex = Math.floor(Math.random() * scenarios.length);
    return scenarios[randomIndex];
  }

  setupEventListeners() {
    // Login button
    document.getElementById('login-btn')?.addEventListener('click', () => {
      this.handleLogin();
    });

    // Fetch Again button (from error view) - randomly select scenario
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

    // Simulate fetching delay for realistic demo
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // DEMO MODE: Use random mock scenario instead of real API
      const scenario = this.getRandomScenario();

      if (scenario === 'noAssets') {
        // Show no assets error
        this.showView('no-assets');
        return;
      }

      // Get mock data for the scenario
      const results = this.mockDataScenarios[scenario];

      // Cache results using encryption
      await this.encryption.secureStore('cached_results', results);

      // Display results
      this.displayResults(results);
      this.showView('results');

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
      if (noAlertsMsg) noAlertsMsg.style.display = 'flex';
      if (assetsList) assetsList.style.display = 'none';
    } else {
      if (noAlertsMsg) noAlertsMsg.style.display = 'none';
      if (assetsList) assetsList.style.display = 'block';

      // Display asset cards (only show assets with alerts)
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
    card.className = asset.openAlerts > 0 ? 'asset-card has-alerts' : 'asset-card';

    const scoreClass = asset.reliabilityScore >= 90 ? 'score-high' :
                       asset.reliabilityScore >= 70 ? 'score-medium' : 'score-low';

    card.innerHTML = `
      <div class="asset-header">
        <div class="asset-icon">
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
        <div class="footer-row">
          <span>Open Alerts:</span>
          <span class="footer-value">
            ${asset.openAlerts}
            <a href="${asset.adocLink}/alerts" target="_blank" class="link-icon" title="View alerts in ADOC">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </span>
        </div>
        <div class="footer-row">
          <span>Upstream Issues:</span>
          <span class="footer-value">
            ${asset.upstreamIssues}
            <a href="${asset.adocLink}/lineage" target="_blank" class="link-icon" title="View lineage in ADOC">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </span>
        </div>
      </div>
    `;

    // Add copy functionality
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn?.addEventListener('click', (e) => {
      const text = e.currentTarget.getAttribute('data-copy');
      navigator.clipboard.writeText(text);

      // Visual feedback
      const btn = e.currentTarget;
      btn.style.color = '#10b981';
      setTimeout(() => {
        btn.style.color = '';
      }, 500);
    });

    return card;
  }

  getAssetIcon(type) {
    // Table icon
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
      <path d="M3 9h18M3 15h18M12 3v18" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  showError(message) {
    console.error(message);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
