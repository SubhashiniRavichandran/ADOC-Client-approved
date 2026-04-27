// ADOC Reliability Metrics - Popup Script

const SERVER_URL = 'https://cso-enablement.poc.acceldatasolutions.net';
const CATALOG_URL = `${SERVER_URL}/ui/torch/namespace/Default/data-reliability/catalog/list`;
const MSG_TIMEOUT = 30000;

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE TYPE ICONS — inline SVG keyed by normalised source-type name.
// Matches the same set as content.js so popup and sidebar are in sync.
// ─────────────────────────────────────────────────────────────────────────────
const ADOC_SOURCE_ICONS = {
  redshift:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><ellipse cx="12" cy="6.5" rx="8" ry="2.5" fill="#FF4B00"/><path d="M4 6.5v11c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5v-11" fill="#FF8C00"/><ellipse cx="12" cy="12" rx="8" ry="2.5" fill="#FF4B00" opacity="0.45"/><ellipse cx="12" cy="17.5" rx="8" ry="2.5" fill="#CC3D00"/><ellipse cx="12" cy="6.5" rx="8" ry="2.5" fill="#FF4B00"/></svg>`,
  bigquery:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L20.5 7v10L12 22 3.5 17V7z" fill="#4285F4"/><rect x="7.5" y="11.5" width="2.5" height="5.5" rx="0.5" fill="white" opacity="0.92"/><rect x="11" y="9" width="2.5" height="8" rx="0.5" fill="white" opacity="0.92"/><rect x="14.5" y="10.5" width="2.5" height="6.5" rx="0.5" fill="white" opacity="0.92"/></svg>`,
  snowflake:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22" stroke="#29B5E8" stroke-width="2" stroke-linecap="round"/><line x1="2" y1="12" x2="22" y2="12" stroke="#29B5E8" stroke-width="2" stroke-linecap="round"/><line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="#29B5E8" stroke-width="2" stroke-linecap="round"/><line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="#29B5E8" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="2.5" fill="#29B5E8"/><circle cx="12" cy="3" r="1.5" fill="#29B5E8"/><circle cx="12" cy="21" r="1.5" fill="#29B5E8"/><circle cx="3" cy="12" r="1.5" fill="#29B5E8"/><circle cx="21" cy="12" r="1.5" fill="#29B5E8"/></svg>`,
  mysql:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#00758F"/><path d="M6.5 15V10l2.5 3 2.5-3v5M14 10v5h3.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  postgres:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#336791"/><path d="M8 16V10a4 4 0 0 1 4-4 4 4 0 0 1 4 4v1a2 2 0 0 1-2 2h-2" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M12 13v3" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  databricks: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L21 7l-9 5-9-5z" fill="#FF3621"/><path d="M3 7v5l9 5 9-5V7" fill="#FF3621" opacity="0.7"/><path d="M3 12v5l9 5 9-5v-5" fill="#FF3621" opacity="0.45"/></svg>`,
  synapse:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4"/><circle cx="7.5" cy="12" r="1.8" fill="white" opacity="0.9"/><circle cx="12" cy="8" r="1.8" fill="white" opacity="0.9"/><circle cx="16.5" cy="12" r="1.8" fill="white" opacity="0.9"/><circle cx="12" cy="16" r="1.8" fill="white" opacity="0.9"/><line x1="7.5" y1="12" x2="12" y2="8" stroke="white" stroke-width="1.2" opacity="0.7"/><line x1="12" y1="8" x2="16.5" y2="12" stroke="white" stroke-width="1.2" opacity="0.7"/><line x1="16.5" y1="12" x2="12" y2="16" stroke="white" stroke-width="1.2" opacity="0.7"/><line x1="12" y1="16" x2="7.5" y2="12" stroke="white" stroke-width="1.2" opacity="0.7"/></svg>`,
  oracle:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="6" fill="#F80000"/><rect x="6" y="8.5" width="12" height="7" rx="3.5" fill="none" stroke="white" stroke-width="2"/></svg>`,
  sqlserver:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#CC2927"/><rect x="5" y="7.5" width="14" height="2.5" rx="1" fill="white" opacity="0.92"/><rect x="5" y="11" width="14" height="2.5" rx="1" fill="white" opacity="0.92"/><rect x="5" y="14" width="9" height="2.5" rx="1" fill="white" opacity="0.92"/><circle cx="17" cy="15.25" r="2" fill="white" opacity="0.92"/></svg>`,
  hive:       `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L19.5 6.5v9L12 20 4.5 15.5v-9z" fill="#FDCC28"/><path d="M8 8v8M12 6v12M16 8v8" stroke="#5C3D11" stroke-width="1.6" stroke-linecap="round"/><path d="M8 12h8" stroke="#5C3D11" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  s3:         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 3L20 7.5v9L12 21 4 16.5v-9z" fill="#E25444"/><path d="M12 8v8M8 10l4 2 4-2" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="1.5" fill="white"/></svg>`,
  teradata:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#F37022"/><path d="M7 12h10M12 7v10" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  default:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#9CA3AF" stroke-width="2"/><path d="M3 9h18M3 15h18M9 3v18" stroke="#9CA3AF" stroke-width="2"/></svg>`,
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSET TYPE ICONS — inline SVG keyed by normalised asset type name.
// Shown alongside the source icon to indicate the asset's structural type.
// ─────────────────────────────────────────────────────────────────────────────
const ADOC_ASSET_TYPE_ICONS = {
  table:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>`,
  view:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  column:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  report:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  default:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>`,
};

function getSourceIcon(sourceType) {
  const key = (sourceType || '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'default';
  if (ADOC_SOURCE_ICONS[key]) return ADOC_SOURCE_ICONS[key];
  if (key.includes('redshift'))   return ADOC_SOURCE_ICONS.redshift;
  if (key.includes('bigquery'))   return ADOC_SOURCE_ICONS.bigquery;
  if (key.includes('snowflake'))  return ADOC_SOURCE_ICONS.snowflake;
  if (key.includes('mysql'))      return ADOC_SOURCE_ICONS.mysql;
  if (key.includes('postgres'))   return ADOC_SOURCE_ICONS.postgres;
  if (key.includes('databricks')) return ADOC_SOURCE_ICONS.databricks;
  if (key.includes('synapse'))    return ADOC_SOURCE_ICONS.synapse;
  if (key.includes('oracle'))     return ADOC_SOURCE_ICONS.oracle;
  if (key.includes('sqlserver') || key.includes('mssql')) return ADOC_SOURCE_ICONS.sqlserver;
  if (key.includes('hive'))       return ADOC_SOURCE_ICONS.hive;
  if (key.includes('s3'))         return ADOC_SOURCE_ICONS.s3;
  if (key.includes('teradata'))   return ADOC_SOURCE_ICONS.teradata;
  return ADOC_SOURCE_ICONS.default;
}

function getAssetTypeIcon(assetType) {
  const key = (assetType || '').toLowerCase().replace(/[^a-z]/g, '') || 'default';
  return ADOC_ASSET_TYPE_ICONS[key] ?? ADOC_ASSET_TYPE_ICONS.default;
}

function fmtDate(dateString) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function safeUrl(url, fallback = '#') {
  try {
    const p = new URL(url);
    return (p.protocol === 'https:' || p.protocol === 'http:') ? url : fallback;
  } catch { return fallback; }
}

function sendMsg(msg, timeoutMs = MSG_TIMEOUT) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), timeoutMs);
    try {
      chrome.runtime.sendMessage(msg, (res) => {
        clearTimeout(t);
        if (chrome.runtime.lastError) { resolve(null); return; }
        resolve(res);
      });
    } catch { clearTimeout(t); resolve(null); }
  });
}

function sendToTab(tabId, msg, timeoutMs = MSG_TIMEOUT) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), timeoutMs);
    try {
      chrome.tabs.sendMessage(tabId, msg, (res) => {
        clearTimeout(t);
        if (chrome.runtime.lastError) { resolve(null); return; }
        resolve(res);
      });
    } catch { clearTimeout(t); resolve(null); }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POPUP CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
class PopupController {
  constructor() {
    this.sidebarPinned = false;
    this.init();
  }

  async init() {
    const [authStatus, cached] = await Promise.all([
      this.checkAuth(),
      this.getCached()
    ]);

    if (authStatus) {
      // Always auto-fetch when authenticated so the popup stays in sync with
      // the sidebar. If not on a PowerBI tab, autoFetchOrShowFetch falls back
      // to cached data or the fetch button.
      await this.autoFetchOrShowFetch();
    } else if (cached) {
      this.renderResults(cached);
      this.showView('results');
    } else {
      this.showView('login');
    }

    this.bindEvents();

    // Background fires authStateChanged when SSO login completes.
    // Auto-fetch immediately if on a PowerBI tab — no extra click needed.
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'authStateChanged') {
        if (msg.authenticated) {
          this.autoFetchOrShowFetch();
        } else {
          this.showView('login');
          const btn = document.getElementById('login-btn');
          if (btn) { btn.textContent = 'Login to Acceldata'; btn.disabled = false; }
          const hint = document.getElementById('login-hint');
          if (hint) hint.textContent = '';
        }
      }
    });
  }

  // If the active tab is a Power BI report → kick off the fetch automatically.
  // Otherwise just show the fetch button so the user can navigate first.
  async autoFetchOrShowFetch() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs && tabs[0];
      if (tab && tab.url && tab.url.includes('powerbi.com')) {
        await this.handleFetch();   // auto-fetch — no button click required
      } else {
        // Not on a PowerBI page — show cached results if available so the
        // popup doesn't appear empty.
        const cached = await this.getCached();
        if (cached) {
          this.renderResults(cached);
          this.showView('results');
        } else {
          this.showView('fetch');
        }
      }
    } catch (_) {
      this.showView('fetch');
    }
  }

  async checkAuth() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['adoc_authenticated'], (r) => {
        if (chrome.runtime.lastError) { resolve(false); return; }
        resolve(!!r.adoc_authenticated);
      });
    });
  }

  async getCached() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['cached_results'], (r) => {
        if (chrome.runtime.lastError) { resolve(null); return; }
        resolve(r.cached_results || null);
      });
    });
  }

  showView(name) {
    ['login', 'fetch', 'fetching', 'results'].forEach(v => {
      const el = document.getElementById(`${v}-view`);
      if (el) el.classList.toggle('hidden', v !== name);
    });
  }

  bindEvents() {
    document.getElementById('login-btn')?.addEventListener('click', () => this.handleLogin());
    document.getElementById('fetch-btn')?.addEventListener('click', () => this.handleFetch());
    document.getElementById('refresh-btn')?.addEventListener('click', () => this.handleFetch());
    // Use querySelectorAll — pin-btn and logout-btn appear in both fetch-view and results-view
    document.querySelectorAll('.pin-btn').forEach(b => b.addEventListener('click', () => this.handlePin()));
    document.querySelectorAll('.logout-btn').forEach(b => b.addEventListener('click', () => this.handleLogout()));
    document.querySelectorAll('.close-btn').forEach(b => b.addEventListener('click', () => window.close()));
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async handleLogin() {
    const btn  = document.getElementById('login-btn');
    const hint = document.getElementById('login-hint');

    if (btn)  { btn.textContent = 'Opening login…'; btn.disabled = true; }
    if (hint) hint.textContent = 'Complete sign-in in the new tab — this popup will update automatically.';

    await sendMsg({ action: 'startSsoLogin' });

    if (btn) btn.textContent = 'Waiting for login…';

    // Poll storage every 2 s so the popup advances even if the
    // authStateChanged message was missed (popup closed & re-opened).
    this._loginPoll = setInterval(async () => {
      const authenticated = await this.checkAuth();
      if (authenticated) {
        clearInterval(this._loginPoll);
        this._loginPoll = null;
        await this.autoFetchOrShowFetch();
      }
    }, 2000);
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async handleLogout() {
    await sendMsg({ action: 'logout' });
    // Background clears storage and broadcasts authStateChanged — don't duplicate here
    this.showView('login');
    const btn = document.getElementById('login-btn');
    if (btn) { btn.textContent = 'Login to Acceldata'; btn.disabled = false; }
    const hint = document.getElementById('login-hint');
    if (hint) hint.textContent = '';
  }

  // ── Fetch reliability data ─────────────────────────────────────────────────
  async handleFetch() {
    this.showView('fetching');

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs && tabs[0];

    if (!tab || !tab.url || !tab.url.includes('powerbi.com')) {
      alert('Please open a Power BI report first, then click Fetch.');
      this.showView('fetch');
      return;
    }

    // Ask content script for the report name from the DOM
    const csResponse = await sendToTab(tab.id, { action: 'extractAssets' });

    if (!csResponse || !csResponse.reportName) {
      alert('Could not detect the Power BI report name. Please refresh the report page and try again.');
      this.showView('fetch');
      return;
    }

    const { reportName } = csResponse;
    console.log('[ADOC] Report name:', reportName);

    // Ask background to run the API flow
    const bgResponse = await sendMsg({ action: 'fetchReliabilityData', reportName });

    if (!bgResponse || !bgResponse.results) {
      // Show demo/mock data with warning
      document.getElementById('mock-warning')?.classList.remove('hidden');
      const mock = this.mockResults(reportName);
      chrome.storage.local.set({ cached_results: mock });
      this.renderResults(mock);
      this.showView('results');
      return;
    }

    document.getElementById('mock-warning')?.classList.add('hidden');
    chrome.storage.local.set({ cached_results: bgResponse.results });
    this.renderResults(bgResponse.results);
    this.showView('results');
  }

  // ── Pin / unpin sidebar on the PowerBI page ────────────────────────────────
  async handlePin() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs && tabs[0];
    if (!tab || !tab.url || !tab.url.includes('powerbi.com')) {
      alert('Please open a Power BI report first.');
      return;
    }

    const res = await sendToTab(tab.id, { action: 'togglePin' });
    this.sidebarPinned = res ? res.pinned : !this.sidebarPinned;
    this.updatePinBtn();
  }

  updatePinBtn() {
    const title = this.sidebarPinned ? 'Unpin sidebar from page' : 'Pin sidebar to page';
    document.querySelectorAll('.pin-btn').forEach(btn => {
      btn.title = title;
      btn.classList.toggle('active', this.sidebarPinned);
    });
  }

  // ── Render results ─────────────────────────────────────────────────────────
  renderResults(results) {
    const statusEl = document.getElementById('report-status');
    if (statusEl) {
      statusEl.textContent = results.reportStatus;
      statusEl.className = `badge ${results.reportStatus === 'Healthy' ? 'badge-healthy' : 'badge-risky'}`;
    }

    const totalEl = document.getElementById('total-assets');
    if (totalEl) totalEl.textContent = results.totalAssets;

    const alertEl = document.getElementById('alert-count');
    if (alertEl) alertEl.textContent = results.assetsWithAlerts;

    const alertsLink = document.getElementById('alerts-link');
    if (alertsLink) {
      alertsLink.classList.toggle('hidden', results.assetsWithAlerts === 0);
      alertsLink.href = results.allIncidentsUrl || CATALOG_URL;
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
        this.renderAssets(results.assets.filter(a => (a.totalAlertsCount ?? a.openAlerts ?? 0) > 0), assetsList);
      }
    }
  }

  renderAssets(assets, container) {
    const frag = document.createDocumentFragment();
    container.innerHTML = '';
    assets.forEach(a => frag.appendChild(this.buildCard(a)));
    container.appendChild(frag);
  }

  // ── Asset card — synced with sidebar buildAssetCard() layout ──────────────
  buildCard(asset) {
    const card = document.createElement('div');
    card.className = `asset-card${asset.hasCriticalAlert || (asset.totalAlertsCount ?? asset.openAlerts ?? 0) > 0 ? ' has-alerts' : ''}`;

    const name        = asset.assetName   ?? asset.name  ?? '—';
    const sourceType  = asset.sourceType  ?? asset.type  ?? null;
    const assetType   = asset.type        ?? null;
    const score       = asset.reliabilityScore ?? null;
    const freshness   = asset.freshness   ?? null;
    const profDate    = asset.lastProfileDateTime ?? null;
    const alertCount  = asset.totalAlertsCount ?? asset.openAlerts ?? 0;

    const scoreText   = score   != null ? `${parseFloat(score).toFixed(2)}%`   : '—';
    const freshText   = freshness != null ? `${parseFloat(freshness).toFixed(0)}%` : '—';
    const profText    = profDate ? fmtDate(profDate) : '—';
    const alertText   = String(alertCount);
    const scoreClass  = score == null ? '' :
                        score >= 90  ? 'score-high' :
                        score >= 70  ? 'score-medium' : 'score-low';
    const alertStyle  = alertCount > 0 ? 'color:#ef4444;font-weight:700' : '';

    const extIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    card.innerHTML = `
      <div class="card-header">
        <span class="card-source-icon" title="${sourceType || 'Unknown source'}">${getSourceIcon(sourceType)}</span>
        <span class="card-type-icon" title="${assetType || 'Asset'}">${getAssetTypeIcon(assetType)}</span>
        <span class="card-name js-name"></span>
        <button class="card-copy-btn" title="Copy asset name">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
      <div class="card-body">
        <div class="card-row">
          <span class="card-label">Data Reliability Score:</span>
          <span class="score-pill js-score ${scoreClass}"></span>
        </div>
        <div class="card-row">
          <span class="card-label">Data Freshness:</span>
          <span class="card-value js-freshness"></span>
        </div>
        <div class="card-row">
          <span class="card-label">Last Profiled:</span>
          <span class="card-value js-profiled"></span>
        </div>
        <div class="card-row card-row-sep">
          <span class="card-label">Open Alerts:</span>
          <span class="card-value js-alerts" style="${alertStyle}"></span>
          <a class="card-ext-link js-alerts-link" target="_blank" rel="noopener noreferrer"
             style="${alertCount > 0 ? '' : 'visibility:hidden'}">${extIcon}</a>
        </div>
      </div>
    `;

    card.querySelector('.js-name').textContent      = name;
    card.querySelector('.js-score').textContent     = scoreText;
    card.querySelector('.js-freshness').textContent = freshText;
    card.querySelector('.js-profiled').textContent  = profText;
    card.querySelector('.js-alerts').textContent    = alertText;
    card.querySelector('.js-alerts-link').href      = safeUrl(asset.quickLink || asset.adocLink || '#');

    card.querySelector('.card-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(name).catch(() => {});
    });

    return card;
  }

  // ── Mock / demo data (shown when API unreachable) ─────────────────────────
  mockResults(reportName) {
    const assets = ['Orders_Fact', 'Customer_Dim', 'Product_Dim'].map((n, i) => {
      const alerts = i === 0 ? 2 : 0;
      return {
        assetName: n, type: 'TABLE', sourceType: 'SNOWFLAKE',
        reliabilityScore: alerts ? 72 : 96,
        freshness: 100,
        lastProfileDateTime: new Date().toISOString(),
        totalAlertsCount: alerts,
        adocLink: CATALOG_URL,
        quickLink: CATALOG_URL
      };
    });
    return {
      reportName,
      reportStatus: 'Risky',
      totalAssets: assets.length,
      assetsWithAlerts: 1,
      allIncidentsUrl: CATALOG_URL,
      assets
    };
  }
}

document.addEventListener('DOMContentLoaded', () => new PopupController());
