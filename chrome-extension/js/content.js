// ADOC Reliability Metrics - Content Script (injected into Power BI pages)
// Responsibilities:
//  1. Extract the report name from the DOM
//  2. Inject the pin/unpin sidebar panel
//  3. Respond to popup/background messages

// ─────────────────────────────────────────────────────────────────────────────
// REPORT NAME EXTRACTION
// Reads the Power BI report name directly from the page.
// Step 1: document.title (always present, format: "Report Name - Power BI")
// Step 2: visible DOM element if title doesn't contain "Power BI"
// ─────────────────────────────────────────────────────────────────────────────
function getPowerBIReportName() {
  // Step 1: document.title is the simplest and most reliable source
  if (document.title) {
    return document.title.replace(' - Power BI', '').trim();
  }

  // Step 2: fallback to a visible DOM element
  const el = document.querySelector(
    '[data-testid="report-name"], .logoBarContent h1, .headerText'
  );
  return el ? el.innerText.trim() : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR — injected directly into the Power BI page
// ─────────────────────────────────────────────────────────────────────────────
class AdocSidebar {
  constructor() {
    this.pinned = false;
    this.visible = false;
    this.container = null;
    this.toggleBtn = null;
    this.data = null;
    this.inject();
  }

  inject() {
    // ── Toggle button (floating tab on the right edge) ──────────────────────
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'adoc-toggle-btn';
    this.toggleBtn.title = 'Open ADOC Reliability Panel';
    this.toggleBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3V21H21" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 14L11 10L15 14L21 8" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>ADOC</span>
    `;
    this.toggleBtn.addEventListener('click', () => this.toggle());
    document.body.appendChild(this.toggleBtn);

    // ── Sidebar panel ────────────────────────────────────────────────────────
    this.container = document.createElement('div');
    this.container.id = 'adoc-sidebar';
    this.container.className = 'adoc-sidebar-container hidden';
    this.container.innerHTML = `
      <div class="adoc-sidebar-header">
        <div class="adoc-sidebar-logo">
          <div class="adoc-logo-mark">a</div>
          <span>ADOC Metrics</span>
        </div>
        <div class="adoc-sidebar-actions">
          <button id="adoc-pin-btn" class="adoc-icon-btn" title="Pin panel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </button>
          <button id="adoc-close-btn" class="adoc-icon-btn" title="Close panel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="adoc-sidebar-content" id="adoc-sidebar-body">
        <div class="adoc-loading" id="adoc-loading">
          <div class="adoc-spinner"></div>
          <p>Fetching reliability data…</p>
        </div>
        <div id="adoc-results" class="adoc-results hidden"></div>
        <div id="adoc-error" class="adoc-error hidden"></div>
      </div>
      <div class="adoc-sidebar-footer">
        <a id="adoc-open-adoc" href="https://cso-enablement.poc.acceldatasolutions.net/ui/torch/namespace/Default/data-reliability/catalog/list" target="_blank" rel="noopener noreferrer">
          Open in ADOC
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    `;
    document.body.appendChild(this.container);

    document.getElementById('adoc-pin-btn').addEventListener('click', () => this.togglePin());
    document.getElementById('adoc-close-btn').addEventListener('click', () => this.hide());
  }

  show() {
    this.container.classList.remove('hidden');
    this.visible = true;
    this.toggleBtn.classList.add('active');
    if (!this.data) this.loadData();
  }

  hide() {
    if (this.pinned) return;  // don't hide if pinned
    this.container.classList.add('hidden');
    this.visible = false;
    this.toggleBtn.classList.remove('active');
  }

  toggle() {
    if (this.visible) {
      this.pinned = false;
      this.updatePinVisual();
      this.hide();
    } else {
      this.show();
    }
  }

  togglePin() {
    this.pinned = !this.pinned;
    this.updatePinVisual();
    if (this.pinned) {
      document.body.classList.add('adoc-body-pushed');
    } else {
      document.body.classList.remove('adoc-body-pushed');
    }
  }

  updatePinVisual() {
    const pinBtn = document.getElementById('adoc-pin-btn');
    if (pinBtn) {
      pinBtn.classList.toggle('active', this.pinned);
      pinBtn.title = this.pinned ? 'Unpin panel' : 'Pin panel';
    }
  }

  async loadData() {
    const loadingEl = document.getElementById('adoc-loading');
    const resultsEl = document.getElementById('adoc-results');
    const errorEl = document.getElementById('adoc-error');

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (resultsEl) resultsEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');

    const reportName = getPowerBIReportName();
    if (!reportName) {
      this.showError('Could not detect the Power BI report name. Please ensure a report is fully loaded.');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'fetchReliabilityData',
        reportName
      });

      if (response && response.results) {
        this.data = response.results;
        this.renderResults(response.results);
      } else {
        this.showError(response?.error || 'Failed to fetch reliability data.');
      }
    } catch (e) {
      this.showError('Extension error: ' + e.message);
    } finally {
      if (loadingEl) loadingEl.classList.add('hidden');
    }
  }

  renderResults(results) {
    const resultsEl = document.getElementById('adoc-results');
    if (!resultsEl) return;

    resultsEl.innerHTML = '';

    // Summary block
    const summary = document.createElement('div');
    summary.className = 'adoc-summary';

    const statusClass = results.reportStatus === 'Healthy' ? 'adoc-badge-healthy' : 'adoc-badge-risky';
    const statusBadge = document.createElement('span');
    statusBadge.className = `adoc-badge ${statusClass}`;
    statusBadge.textContent = results.reportStatus;

    const reportNameEl = document.createElement('div');
    reportNameEl.className = 'adoc-report-name';
    reportNameEl.textContent = results.reportName || getPowerBIReportName() || '';

    const statsEl = document.createElement('div');
    statsEl.className = 'adoc-stats';
    statsEl.innerHTML = `
      <div class="adoc-stat">
        <span class="adoc-stat-val">${results.totalAssets}</span>
        <span class="adoc-stat-label">Assets</span>
      </div>
      <div class="adoc-stat">
        <span class="adoc-stat-val ${results.assetsWithAlerts > 0 ? 'adoc-risky-text' : ''}">${results.assetsWithAlerts}</span>
        <span class="adoc-stat-label">With Alerts</span>
      </div>
    `;

    summary.appendChild(reportNameEl);
    summary.appendChild(statusBadge);
    summary.appendChild(statsEl);
    resultsEl.appendChild(summary);

    // No alerts message
    if (results.assetsWithAlerts === 0) {
      const noAlerts = document.createElement('div');
      noAlerts.className = 'adoc-no-alerts';
      noAlerts.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10b981" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>No assets with open alerts</p>
      `;
      resultsEl.appendChild(noAlerts);
    }

    // Asset cards — show ALL assets, highlight those with alerts
    const fragment = document.createDocumentFragment();
    for (const asset of results.assets) {
      fragment.appendChild(this.buildAssetCard(asset));
    }

    const listEl = document.createElement('div');
    listEl.className = 'adoc-asset-list';
    listEl.appendChild(fragment);
    resultsEl.appendChild(listEl);

    // Refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'adoc-refresh-btn';
    refreshBtn.textContent = 'Refresh';
    refreshBtn.addEventListener('click', () => {
      this.data = null;
      this.loadData();
    });
    resultsEl.appendChild(refreshBtn);

    resultsEl.classList.remove('hidden');
  }

  buildAssetCard(asset) {
    const card = document.createElement('div');
    card.className = `adoc-asset-card${asset.openAlerts > 0 ? ' adoc-has-alerts' : ''}`;

    const scoreClass = asset.reliabilityScore >= 90 ? 'adoc-score-high' :
                       asset.reliabilityScore >= 70 ? 'adoc-score-med' : 'adoc-score-low';

    // Static skeleton, dynamic values set via textContent
    card.innerHTML = `
      <div class="adoc-card-header">
        <div class="adoc-card-title">
          <span class="adoc-card-name"></span>
          <span class="adoc-card-type"></span>
        </div>
        <div class="adoc-score-pill ${scoreClass}"></div>
      </div>
      ${asset.openAlerts > 0 ? `
      <div class="adoc-card-alerts">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span class="js-alerts"></span>
        <a class="adoc-card-link js-link" target="_blank" rel="noopener noreferrer">View ↗</a>
      </div>` : ''}
    `;

    card.querySelector('.adoc-card-name').textContent = asset.name;
    card.querySelector('.adoc-card-type').textContent = asset.type;
    card.querySelector('.adoc-score-pill').textContent = `${asset.reliabilityScore}%`;

    if (asset.openAlerts > 0) {
      card.querySelector('.js-alerts').textContent = `${asset.openAlerts} open alert${asset.openAlerts > 1 ? 's' : ''}`;
      const link = card.querySelector('.js-link');
      if (link) link.href = asset.adocLink;
    }

    return card;
  }

  showError(msg) {
    const errorEl = document.getElementById('adoc-error');
    const loadingEl = document.getElementById('adoc-loading');
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISE
// ─────────────────────────────────────────────────────────────────────────────
let sidebar = null;

function isOnReportPage() {
  return window.location.href.includes('/reports/') ||
         window.location.href.includes('/dashboards/');
}

function init() {
  if (isOnReportPage()) {
    injectSidebarIfNeeded();
  } else {
    // Not on a report page yet — watch for SPA navigation
    watchNavigation();
  }
}

function injectSidebarIfNeeded() {
  if (sidebar) return;
  sidebar = new AdocSidebar();

  // Auto-show and load data if user is already authenticated
  chrome.storage.local.get(['adoc_authenticated'], (result) => {
    if (chrome.runtime.lastError) return;
    if (result.adoc_authenticated) {
      // Small delay to let the PowerBI page DOM settle before reading report name
      setTimeout(() => sidebar.show(), 800);
    }
  });
}

// Watch SPA navigation and re-initialise when user opens a report
function watchNavigation() {
  let lastUrl = window.location.href;
  const interval = setInterval(() => {
    const current = window.location.href;
    if (current !== lastUrl) {
      lastUrl = current;
      if (isOnReportPage()) {
        clearInterval(interval);
        injectSidebarIfNeeded();
      }
    }
  }, 1000);
}

// Also listen for auth state changes broadcast from background.
// If user just logged in and is already on a PowerBI report → auto-show.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'authStateChanged' && msg.authenticated && isOnReportPage()) {
    setTimeout(() => {
      if (!sidebar) sidebar = new AdocSidebar();
      sidebar.show();
    }, 400);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE LISTENER (from popup / background)
// ─────────────────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.action) return;

  switch (request.action) {
    case 'extractAssets':
      sendResponse({
        context: detectContext(),
        reportName: getPowerBIReportName()
      });
      return true;

    case 'showSidebar':
      if (!sidebar) sidebar = new AdocSidebar();
      sidebar.show();
      sendResponse({ success: true });
      return false;

    case 'hideSidebar':
      if (sidebar) { sidebar.pinned = false; sidebar.hide(); }
      sendResponse({ success: true });
      return false;

    case 'togglePin':
      if (sidebar) sidebar.togglePin();
      sendResponse({ pinned: sidebar ? sidebar.pinned : false });
      return false;
  }
});

function detectContext() {
  try {
    const url = window.location.href;
    let m = url.match(/\/groups\/([^/]+)\/reports\/([^/]+)/);
    if (m) return { type: 'REPORT', workspaceId: m[1], reportId: m[2] };
    m = url.match(/\/groups\/([^/]+)\/dashboards\/([^/]+)/);
    if (m) return { type: 'DASHBOARD', workspaceId: m[1], dashboardId: m[2] };
  } catch (_) {}
  return null;
}

// Notify background that this PowerBI tab is active
chrome.runtime.sendMessage({ action: 'contentScriptReady', context: detectContext() }).catch(() => {});

init();
