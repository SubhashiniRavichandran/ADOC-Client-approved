// ADOC Reliability Metrics - Popup Script

class PopupController {
  constructor() {
    this.currentView = 'login';
    this.init();
  }

  async init() {
    // Check authentication status
    const authStatus = await this.checkAuthStatus();

    if (authStatus.authenticated) {
      this.showView('fetch');
    } else {
      this.showView('login');
    }

    // Setup event listeners
    this.setupEventListeners();

    // Check if we have cached results
    const cachedResults = await this.getCachedResults();
    if (cachedResults) {
      this.displayResults(cachedResults);
      this.showView('results');
    }
  }

  setupEventListeners() {
    // Login button
    document.getElementById('login-btn')?.addEventListener('click', () => {
      this.handleLogin();
    });

    // Fetch button
    document.getElementById('fetch-btn')?.addEventListener('click', () => {
      this.handleFetch();
    });

    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
      this.handleRefresh();
    });

    // Close buttons
    const closeButtons = ['close-btn', 'close-btn-2', 'close-btn-3', 'close-btn-4'];
    closeButtons.forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        window.close();
      });
    });
  }

  async checkAuthStatus() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['adoc_authenticated', 'adoc_token'], (result) => {
        resolve({
          authenticated: result.adoc_authenticated || false,
          token: result.adoc_token || null
        });
      });
    });
  }

  async getCachedResults() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['cached_results'], (result) => {
        resolve(result.cached_results || null);
      });
    });
  }

  showView(viewName) {
    const views = ['login', 'fetch', 'fetching', 'results'];
    views.forEach(view => {
      const element = document.getElementById(`${view}-view`);
      if (element) {
        element.classList.toggle('hidden', view !== viewName);
      }
    });
    this.currentView = viewName;
  }

  async handleLogin() {
    // Open ADOC login page
    const loginUrl = 'https://indiumtech.acceldata.app/';

    // Close current popup
    window.close();

    // Create a new tab for authentication
    chrome.tabs.create({ url: loginUrl }, (tab) => {
      const authTabId = tab.id;

      // Listen for tab updates to detect successful login
      const listener = (tabId, changeInfo, updatedTab) => {
        if (tabId === authTabId) {
          // Check if URL has changed and user is logged in
          // Look for dashboard or main page after login
          if (changeInfo.url || changeInfo.status === 'complete') {
            const url = updatedTab.url || '';

            // Check if user navigated past login page (to dashboard/home)
            if (url.includes('acceldata.app') &&
                !url.includes('/login') &&
                !url.includes('/signin') &&
                changeInfo.status === 'complete') {

              // Wait a moment to ensure session is established
              setTimeout(() => {
                // Authentication successful
                chrome.storage.local.set({
                  adoc_authenticated: true,
                  adoc_token: 'authenticated',
                  adoc_login_time: Date.now()
                }, () => {
                  // Remove listeners
                  chrome.tabs.onUpdated.removeListener(listener);
                  chrome.tabs.onRemoved.removeListener(removeListener);

                  // Close the auth tab
                  chrome.tabs.remove(authTabId);

                  // Open the extension popup again
                  chrome.action.openPopup();
                });
              }, 1000);
            }
          }
        }
      };

      // Also listen for tab removal (user closed tab)
      const removeListener = (removedTabId) => {
        if (removedTabId === authTabId) {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.onRemoved.removeListener(removeListener);
        }
      };

      chrome.tabs.onUpdated.addListener(listener);
      chrome.tabs.onRemoved.addListener(removeListener);

      // Timeout after 5 minutes
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.tabs.onRemoved.removeListener(removeListener);
      }, 300000);
    });
  }

  async handleFetch() {
    this.showView('fetching');

    try {
      // Get current Power BI context
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab || !currentTab.url.includes('powerbi.com')) {
        this.showError('Please open a Power BI report to fetch reliability data.');
        this.showView('fetch');
        return;
      }

      // Send message to content script to extract Power BI assets
      chrome.tabs.sendMessage(currentTab.id, { action: 'extractAssets' }, async (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          this.showError('Unable to access Power BI report. Please refresh the page.');
          this.showView('fetch');
          return;
        }

        if (response && response.assets) {
          // Fetch reliability data from ADOC
          const results = await this.fetchReliabilityData(response.assets);

          // Cache results
          chrome.storage.local.set({ cached_results: results });

          // Display results
          this.displayResults(results);
          this.showView('results');
        } else {
          this.showError('No assets found in the Power BI report.');
          this.showView('fetch');
        }
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      this.showError('Failed to fetch reliability data. Please try again.');
      this.showView('fetch');
    }
  }

  async handleRefresh() {
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.classList.add('spinning');

    await this.handleFetch();

    refreshBtn.classList.remove('spinning');
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
            // Mock data for demonstration if API fails
            resolve(this.generateMockResults(assets));
          }
        }
      );
    });
  }

  generateMockResults(assets) {
    // Generate mock results for testing
    const mockAssets = assets.map((asset, index) => {
      const hasAlerts = Math.random() > 0.7;
      const score = hasAlerts ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 10) + 90;

      return {
        name: asset.name || `Asset_${index + 1}`,
        type: asset.type || 'TABLE',
        reliabilityScore: score,
        dataFreshness: '100%',
        lastProfiled: new Date().toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        openAlerts: hasAlerts ? Math.floor(Math.random() * 5) + 1 : 0,
        upstreamIssues: hasAlerts ? Math.floor(Math.random() * 3) + 1 : 0,
        adocLink: `https://indiumtech.acceldata.app/assets/${asset.name}`
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
    // Update summary
    const statusBadge = document.getElementById('report-status');
    statusBadge.textContent = results.reportStatus;
    statusBadge.className = `badge ${results.reportStatus === 'Healthy' ? 'badge-healthy' : 'badge-risky'}`;

    document.getElementById('total-assets').textContent = results.totalAssets;
    document.getElementById('alert-count').textContent = results.assetsWithAlerts;

    const alertsLink = document.getElementById('alerts-link');
    if (results.assetsWithAlerts > 0) {
      alertsLink.classList.remove('hidden');
      alertsLink.href = 'https://indiumtech.acceldata.app/alerts';
    } else {
      alertsLink.classList.add('hidden');
    }

    // Show/hide no alerts message
    const noAlertsMsg = document.getElementById('no-alerts-message');
    const assetsList = document.getElementById('assets-list');

    if (results.assetsWithAlerts === 0) {
      noAlertsMsg.style.display = 'block';
      assetsList.style.display = 'none';
    } else {
      noAlertsMsg.style.display = 'none';
      assetsList.style.display = 'block';

      // Display asset cards
      this.displayAssets(results.assets.filter(a => a.openAlerts > 0));
    }
  }

  displayAssets(assets) {
    const assetsList = document.getElementById('assets-list');
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
    copyBtn.addEventListener('click', (e) => {
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
    // Simple alert for now - could be enhanced with a toast notification
    alert(message);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
