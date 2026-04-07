// ADOC Reliability Metrics - Popup Script

const SERVER_URL = 'https://cso-enablement.poc.acceldatasolutions.net';
const CATALOG_URL = `${SERVER_URL}/ui/torch/namespace/Default/data-reliability/catalog/list`;
const MSG_TIMEOUT = 30000;

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

    if (cached) {
      this.renderResults(cached);
      this.showView('results');
    } else if (authStatus) {
      // Authenticated — auto-fetch if already on a PowerBI tab, else show button
      await this.autoFetchOrShowFetch();
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
        this.showView('fetch');     // not on PowerBI yet
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
    document.getElementById('pin-btn')?.addEventListener('click', () => this.handlePin());
    document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());
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
    chrome.storage.local.remove(['adoc_authenticated', 'cached_results']);
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
    const btn = document.getElementById('pin-btn');
    if (!btn) return;
    btn.title = this.sidebarPinned ? 'Unpin sidebar from page' : 'Pin sidebar to page';
    btn.classList.toggle('active', this.sidebarPinned);
    btn.querySelector('.pin-label').textContent = this.sidebarPinned ? 'Unpin' : 'Pin to page';
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
      alertsLink.href = CATALOG_URL;
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
        this.renderAssets(results.assets.filter(a => a.openAlerts > 0), assetsList);
      }
    }
  }

  renderAssets(assets, container) {
    const frag = document.createDocumentFragment();
    container.innerHTML = '';
    assets.forEach(a => frag.appendChild(this.buildCard(a)));
    container.appendChild(frag);
  }

  buildCard(asset) {
    const card = document.createElement('div');
    card.className = 'asset-card has-alerts';

    const scoreClass = asset.reliabilityScore >= 90 ? 'score-high' :
                       asset.reliabilityScore >= 70 ? 'score-medium' : 'score-low';

    card.innerHTML = `
      <div class="asset-header">
        <div class="asset-title">
          <div class="asset-name"><span class="js-name"></span></div>
          <div class="asset-type js-type"></div>
        </div>
        <div class="score-badge js-score ${scoreClass}"></div>
      </div>
      <div class="asset-metrics">
        <div class="metric"><span class="metric-label">Reliability:</span> <span class="metric-value js-score-val"></span></div>
        <div class="metric"><span class="metric-label">Freshness:</span> <span class="metric-value js-fresh"></span></div>
        <div class="metric"><span class="metric-label">Last Profiled:</span> <span class="metric-value js-prof"></span></div>
      </div>
      <div class="asset-footer">
        <span class="alert-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg>
          <span class="js-alerts"></span>
        </span>
        <a class="js-link link-icon" target="_blank" rel="noopener noreferrer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </a>
      </div>
    `;

    card.querySelector('.js-name').textContent = asset.name;
    card.querySelector('.js-type').textContent = asset.type;
    card.querySelector('.js-score').textContent = `${asset.reliabilityScore}%`;
    card.querySelector('.js-score-val').textContent = `${asset.reliabilityScore}%`;
    card.querySelector('.js-fresh').textContent = asset.dataFreshness;
    card.querySelector('.js-prof').textContent = asset.lastProfiled;
    card.querySelector('.js-alerts').textContent = `${asset.openAlerts} open alert${asset.openAlerts !== 1 ? 's' : ''}`;
    card.querySelector('.js-link').href = safeUrl(asset.adocLink);

    return card;
  }

  // ── Mock / demo data (shown when API unreachable) ─────────────────────────
  mockResults(reportName) {
    const assets = ['Orders_Fact', 'Customer_Dim', 'Product_Dim'].map((n, i) => {
      const alerts = i === 0 ? 2 : 0;
      return {
        name: n, type: 'TABLE',
        reliabilityScore: alerts ? 72 : 96,
        dataFreshness: '100%',
        lastProfiled: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        openAlerts: alerts, upstreamIssues: 0,
        adocLink: CATALOG_URL
      };
    });
    return {
      reportName,
      reportStatus: 'Risky',
      totalAssets: assets.length,
      assetsWithAlerts: 1,
      assets
    };
  }
}

document.addEventListener('DOMContentLoaded', () => new PopupController());
