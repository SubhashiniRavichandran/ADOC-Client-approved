// ADOC Reliability Metrics - Content Script (injected into Power BI pages)
// Responsibilities:
//  1. Extract the report name from the DOM
//  2. Inject the pin/unpin sidebar panel
//  3. Respond to popup/background messages

// ─────────────────────────────────────────────────────────────────────────────
// REPORT NAME EXTRACTION
// Reads the Power BI report name directly from the page.
// Step 1: visible DOM elements rendered by Power BI
// Step 2: document.title fallback (format: "Report Name - Power BI")
// ─────────────────────────────────────────────────────────────────────────────
function getPowerBIReportName() {
  // Step 1: query visible DOM elements used by Power BI to render the report name
  const el = document.querySelector(
    '[data-testid="report-name"], ' +
    '.logoBarContent h1, ' +
    '.headerText, ' +
    '.report-name'
  );
  if (el) {
    const name = el.innerText.trim();
    if (name) {
      console.log('[ADOC] getPowerBIReportName (DOM):', name);
      return name;
    }
  }

  // Step 2: fallback — document.title formats used by Power BI:
  //   "Report Name - Power BI"  (most common)
  //   "Power BI - Report Name"  (less common)
  if (document.title) {
    if (document.title.includes(' - Power BI')) {
      const name = document.title.replace(' - Power BI', '').trim();
      if (name) {
        console.log('[ADOC] getPowerBIReportName (title):', name);
        return name;
      }
    }
    if (document.title.startsWith('Power BI - ')) {
      const name = document.title.replace('Power BI - ', '').trim();
      if (name) {
        console.log('[ADOC] getPowerBIReportName (title):', name);
        return name;
      }
    }
  }

  console.log('[ADOC] getPowerBIReportName: null — no report name found');
  return null;
}

console.log('[ADOC] Report name:', getPowerBIReportName());

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
              <path d="M12 17v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1v3.76z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
    console.log('[ADOC] Report name sent to background:', reportName);

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
        const dbg = response.results.debug || {};
        console.log('=== ADOC DEBUG START ===');
        console.log('[ADOC] 1. reportName sent         :', dbg.reportName);
        console.log('[ADOC] 2. semanticName looked up  :', dbg.semanticName);
        console.log('[ADOC] 3. search API error        :', dbg.searchError ?? 'none');
        console.log('[ADOC] 4. raw search response     :', JSON.stringify(dbg.rawSearchResult));
        console.log('[ADOC] 5. assets[] from search    :', JSON.stringify(dbg.searchAssets));
        console.log('[ADOC] 6. semanticAsset found?    :', dbg.semanticAssetFound);
        console.log('[ADOC] 7. parentId (assets[].id)  :', dbg.parentId);
        console.log('[ADOC] 7b. childAssets URL         :', dbg.childAssetsUrl);
        console.log('[ADOC] 8. childAssets API error    :', dbg.childError ?? 'none');
        console.log('[ADOC] 9. raw childAssets response:', JSON.stringify(dbg.rawChildResult));
        console.log('[ADOC] 10. children parsed count  :', dbg.childrenLength);
        console.log('[ADOC] 10. Total Assets           :', response.results.totalAssets);
        console.log('[ADOC] 11. Assets with Alerts     :', response.results.assetsWithAlerts);
        console.log('[ADOC] 12. asset list             :', JSON.stringify(response.results.assets));
        console.log('[ADOC] 13. extracted assets       :', JSON.stringify(response.results.extractedAssets || []));
        console.log('[ADOC] 14. Total Assets label     :', `Total Assets: ${response.results.totalAssets}`);
        console.log('=== ADOC DEBUG END ===');
        this.data = response.results;
        this.renderResults(response.results);
      } else {
        this.showError(response?.error || 'Failed to fetch reliability data.');
      }
    } catch (e) {
      console.error('[ADOC] loadData error:', e.message);
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
      <div class="adoc-stat-row">
        <span class="adoc-stat-label">Total Assets:</span>
        <span class="adoc-stat-val">${results.totalAssets}</span>
      </div>
      <div class="adoc-stat-row">
        <span class="adoc-stat-label">Assets with Alerts:</span>
        <span class="adoc-stat-val ${results.assetsWithAlerts > 0 ? 'adoc-risky-text' : ''}">${results.assetsWithAlerts}</span>
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

    const score      = asset.reliabilityScore;
    const scoreClass = score >= 90 ? 'adoc-score-high' : score >= 70 ? 'adoc-score-med' : 'adoc-score-low';
    const scoreText  = score != null ? `${parseFloat(score).toFixed(2)}%` : '—';
    const freshText  = asset.freshness != null ? `${parseFloat(asset.freshness).toFixed(0)}%` : '—';
    const profText   = asset.lastProfiled ? fmtDate(asset.lastProfiled) : '—';

    const extIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const typeIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" class="adoc-type-icon">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
      <path d="M3 9h18M3 15h18M9 3v18" stroke="currentColor" stroke-width="2"/>
    </svg>`;

    card.innerHTML = `
      <div class="adoc-card-header">
        ${typeIcon}
        <span class="adoc-card-name"></span>
        <button class="adoc-copy-btn" title="Copy asset name">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
      <div class="adoc-card-body">
        <div class="adoc-card-row">
          <span class="adoc-card-label">Data Reliability Score:</span>
          <span class="adoc-score-pill ${scoreClass} js-score"></span>
        </div>
        <div class="adoc-card-row">
          <span class="adoc-card-label">Data Freshness:</span>
          <span class="adoc-card-value js-freshness"></span>
        </div>
        <div class="adoc-card-row">
          <span class="adoc-card-label">Last Profiled:</span>
          <strong class="adoc-card-value js-profiled"></strong>
        </div>
        <div class="adoc-card-row adoc-card-row-sep">
          <span class="adoc-card-label">Open Alerts:</span>
          <span class="adoc-card-value js-alerts"></span>
          <a class="adoc-ext-link js-alerts-link" target="_blank" rel="noopener noreferrer"
             style="${asset.openAlerts > 0 ? '' : 'visibility:hidden'}">${extIcon}</a>
        </div>
        <div class="adoc-card-row">
          <span class="adoc-card-label">Upstream Issues:</span>
          <span class="adoc-card-value js-upstream"></span>
          <a class="adoc-ext-link js-upstream-link" target="_blank" rel="noopener noreferrer"
             style="${asset.upstreamIssues > 0 ? '' : 'visibility:hidden'}">${extIcon}</a>
        </div>
      </div>
    `;

    card.querySelector('.adoc-card-name').textContent  = asset.name;
    card.querySelector('.js-score').textContent        = scoreText;
    card.querySelector('.js-freshness').textContent    = freshText;
    card.querySelector('.js-profiled').textContent     = profText;
    card.querySelector('.js-alerts').textContent       = asset.openAlerts;
    card.querySelector('.js-upstream').textContent     = asset.upstreamIssues;
    card.querySelector('.js-alerts-link').href         = asset.adocLink;
    card.querySelector('.js-upstream-link').href       = asset.adocLink;

    card.querySelector('.adoc-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(asset.name).catch(() => {});
    });

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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmtDate(dateString) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Notify background that this PowerBI tab is active
chrome.runtime.sendMessage({ action: 'contentScriptReady', context: detectContext() }).catch(() => {});

init();
