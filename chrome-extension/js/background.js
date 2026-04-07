// ADOC Reliability Metrics - Background Service Worker

const SERVER_URL = 'https://cso-enablement.poc.acceldatasolutions.net';
const API_PREFIX = 'catalog-server/api';
const ASSET_DETAIL_PATH = '/ui/torch/namespace/Default/data-reliability/catalog/';
const FETCH_TIMEOUT_MS = 30000;

// Tab ID of the currently open SSO login tab (null if not open)
let loginTabId = null;

// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT  (SSO session-based — no API keys)
// All requests use credentials:'include' so the browser sends the ADOC session
// cookies that were set when the user logged in via SSO.
// ─────────────────────────────────────────────────────────────────────────────
class AdocApiClient {
  getServerUrl() {
    return SERVER_URL;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${SERVER_URL}/${API_PREFIX}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',   // send SSO session cookies
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        signal: controller.signal
      });

      if (!response.ok) {
        const msg =
          response.status === 401 ? 'Not authenticated – please log in again' :
          response.status === 403 ? 'Access denied – insufficient permissions' :
          response.status === 404 ? 'API endpoint not found' :
          `Server error (${response.status})`;
        throw new Error(msg);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Request timed out after 30 seconds');
      console.error('[ADOC] Request failed:', url, error.message);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // GET /catalog-server/api/assets/search?name=<name>
  async searchAssets(name) {
    try {
      return await this.makeRequest(`/assets/search?name=${encodeURIComponent(name)}`);
    } catch (e) {
      console.error('[ADOC] searchAssets failed:', e.message);
      return null;
    }
  }

  // GET /catalog-server/api/assets/:id/childAssets
  async getChildAssets(assetId) {
    try {
      return await this.makeRequest(`/assets/${encodeURIComponent(assetId)}/childAssets`);
    } catch (e) {
      console.error('[ADOC] getChildAssets failed:', e.message);
      return null;
    }
  }

  // GET /catalog-server/api/assets/:id/scores  (fallback if scores not in childAssets)
  async getAssetScores(assetId) {
    try {
      return await this.makeRequest(`/assets/${encodeURIComponent(assetId)}/scores`);
    } catch (e) {
      console.error('[ADOC] getAssetScores failed:', e.message);
      return null;
    }
  }
}

const api = new AdocApiClient();

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — SSO LOGIN FLOW
// ─────────────────────────────────────────────────────────────────────────────

// Open the ADOC SSO login page in a new tab.
// Watches the tab URL until the user lands on the dashboard (post-login),
// then confirms auth with a test API call.
function openSsoLoginTab() {
  if (loginTabId !== null) {
    // Bring existing login tab to focus instead of opening another
    chrome.tabs.update(loginTabId, { active: true });
    return;
  }

  chrome.tabs.create({ url: SERVER_URL }, (tab) => {
    loginTabId = tab.id;
    watchSsoTab(tab.id);
  });
}

function watchSsoTab(tabId) {
  const onUpdated = (id, changeInfo, tab) => {
    if (id !== tabId) return;
    if (changeInfo.status !== 'complete') return;

    const url = tab.url || '';
    // Detect successful login: user is on ADOC but past the login/register page
    const onAdocDomain = url.startsWith(SERVER_URL);
    const pastLoginScreen = url.includes('/ui/torch') ||
                            url.includes('/namespace/') ||
                            url.includes('/home');

    if (onAdocDomain && pastLoginScreen) {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      confirmSsoSession(tabId);
    }
  };

  const onRemoved = (id) => {
    if (id === tabId) {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      loginTabId = null;
    }
  };

  chrome.tabs.onUpdated.addListener(onUpdated);
  chrome.tabs.onRemoved.addListener(onRemoved);
}

// Mark authenticated as soon as the user reaches the post-login dashboard.
// We do NOT gate this on the API test call, because credentials:'include'
// may fail at the CORS pre-flight stage in some deployments.
// The actual data fetch will show an error if the session is invalid.
async function confirmSsoSession(tabId) {
  // Set auth immediately based on successful navigation
  await chrome.storage.local.set({ adoc_authenticated: true });

  // Close the login tab
  try { chrome.tabs.remove(tabId, () => { loginTabId = null; }); } catch (_) {}

  // Broadcast to popup → popup will auto-fetch if on a PowerBI tab
  chrome.runtime.sendMessage({ action: 'authStateChanged', authenticated: true }).catch(() => {});

  console.log('[ADOC] SSO login detected — session marked as authenticated');
}

function logout() {
  chrome.storage.local.remove(['adoc_authenticated', 'cached_results'], () => {
    chrome.runtime.sendMessage({ action: 'authStateChanged', authenticated: false }).catch(() => {});
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.action) return;

  switch (request.action) {
    case 'startSsoLogin':
      openSsoLoginTab();
      sendResponse({ success: true });
      return false;

    case 'logout':
      logout();
      sendResponse({ success: true });
      return false;

    case 'fetchReliabilityData':
      fetchReliabilityData(request.reportName)
        .then(results => sendResponse({ results }))
        .catch(err => sendResponse({ error: err.message }));
      return true;  // async

    case 'testConnection':
      api.searchAssets('test')
        .then(r => sendResponse({ success: r !== null, message: r !== null ? 'Connected' : 'Failed' }))
        .catch(e => sendResponse({ success: false, message: e.message }));
      return true;  // async
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CORE DATA FLOW
// Step 1: extract report name from PowerBI DOM (done in content.js)
// Step 2: GET /assets/search?name=<reportName>  → assetId
// Step 3: GET /assets/:id/childAssets           → child assets list
// Step 4: use name + reliabilityScore from each child asset
// ─────────────────────────────────────────────────────────────────────────────
async function fetchReliabilityData(reportName) {
  const results = {
    reportName: reportName || 'Unknown Report',
    reportStatus: 'Healthy',
    totalAssets: 0,
    assetsWithAlerts: 0,
    assets: []
  };

  if (!reportName) {
    console.warn('[ADOC] No report name provided');
    return results;
  }

  // Step 1: search by report name
  console.log(`[ADOC] Searching for: "${reportName}"`);
  const searchResult = await api.searchAssets(reportName);
  const candidates = normalizeList(searchResult, ['assets', 'data']);

  if (!candidates.length) {
    console.warn(`[ADOC] No ADOC assets matched "${reportName}"`);
    return results;
  }

  const reportAsset = candidates[0];
  const assetId = reportAsset.id;
  console.log(`[ADOC] Found assetId=${assetId} for "${reportAsset.name || reportAsset.displayName}"`);

  // Step 2: fetch child assets
  const childResult = await api.getChildAssets(assetId);
  const children = normalizeList(childResult, ['childAssets', 'assets', 'data']);
  console.log(`[ADOC] ${children.length} child assets`);

  // Step 3: build results from each child
  for (const child of children) {
    if (!child || !child.id) continue;
    try {
      const name = child.name || child.displayName || `Asset_${child.id}`;
      const type = child.assetType || child.type || 'TABLE';

      let reliabilityScore = 0;
      let dataFreshness = 'N/A';
      let lastProfiled = 'Not profiled';

      // Use scores embedded in the child asset response if present
      if (child.ruleScores && child.ruleScores.reliabilityScore !== undefined) {
        reliabilityScore = Math.round(child.ruleScores.reliabilityScore);
        if (child.ruleScores.dataCadenceScore !== undefined) {
          dataFreshness = `${Math.round(child.ruleScores.dataCadenceScore)}%`;
        }
      } else {
        // Fallback: separate scores call
        const scores = await api.getAssetScores(child.id);
        if (scores) {
          reliabilityScore = Math.round(scores?.ruleScores?.reliabilityScore ?? 0);
          const cadence = scores?.ruleScores?.dataCadenceScore;
          if (cadence !== undefined && cadence !== null) {
            dataFreshness = `${Math.round(cadence)}%`;
          }
          if (scores.lastProfileDateTime) {
            lastProfiled = fmtDate(scores.lastProfileDateTime);
          }
        }
      }

      if (child.lastProfileDateTime) lastProfiled = fmtDate(child.lastProfileDateTime);

      const openAlerts = child.openAlerts ?? child.alertCount ?? 0;
      const upstreamIssues = child.upstreamIssues ?? 0;

      results.assets.push({
        name,
        type,
        reliabilityScore,
        dataFreshness,
        lastProfiled,
        openAlerts,
        upstreamIssues,
        adocLink: `${SERVER_URL}${ASSET_DETAIL_PATH}${child.id}`
      });

      if (openAlerts > 0) results.assetsWithAlerts++;
    } catch (e) {
      console.error(`[ADOC] Error processing child ${child.id}:`, e.message);
    }
  }

  results.totalAssets = results.assets.length;
  results.reportStatus = results.assetsWithAlerts > 0 ? 'Risky' : 'Healthy';
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function normalizeList(data, keys) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const k of keys) {
    if (Array.isArray(data[k])) return data[k];
  }
  return [];
}

function fmtDate(dateString) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[ADOC] Extension installed');
  }
});

// Show badge on PowerBI tabs so user knows extension is active
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  const isPowerBI = tab.url.includes('app.powerbi.com') || tab.url.includes('msit.powerbi.com');
  if (isPowerBI) {
    chrome.action.setBadgeText({ text: '●', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#0ea5e9', tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
