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
          'Accept': 'application/json',
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

  // Step 1: GET /catalog-server/api/assets/search?name=<reportName>
  async searchAssets(name) {
    try {
      return await this.makeRequest(`/assets/search?name=${encodeURIComponent(name)}`);
    } catch (e) {
      return { __error: e.message };
    }
  }

  // Step 2: GET /catalog-server/api/assets/:id/childAssets
  async getChildAssets(assetId) {
    try {
      return await this.makeRequest(`/assets/${encodeURIComponent(assetId)}/childAssets`);
    } catch (e) {
      return { __error: e.message };
    }
  }

  // Step 3: GET /catalog-server/api/rules/data-cadence/byAsset/:id
  async getDataCadence(assetId) {
    try {
      return await this.makeRequest(`/rules/data-cadence/byAsset/${encodeURIComponent(assetId)}`);
    } catch (e) {
      console.error('[ADOC] getDataCadence failed:', e.message);
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
//
// Step 1: GET /assets/search?name=<reportName>
//         response.assets[] only → find name === "<reportName>::POWERBI_SEMANTIC_MODEL"
//         → use assets[].id (NOT assetType.id)
//
// Step 2: GET /assets/:id/childAssets
//         response.assets[] only → extract name, id, reliabilityScore, updatedAt
//         → totalAssets = response.assets.length
// ─────────────────────────────────────────────────────────────────────────────
async function fetchReliabilityData(reportName) {
  const results = {
    reportName: reportName || 'Unknown Report',
    reportStatus: 'Healthy',
    totalAssets: 0,
    assetsWithAlerts: 0,
    assets: [],
    debug: {}
  };

  if (!reportName) return results;

  const name = reportName.trim();

  // ── Step 1: Search API ────────────────────────────────────────────────────
  const searchResult  = await api.searchAssets(name);
  const searchError   = searchResult?.__error ?? null;
  const searchAssets  = !searchError && Array.isArray(searchResult?.assets) ? searchResult.assets : [];

  // Only assets[].id considered — assetType.id ignored
  const semanticName  = `${name}::POWERBI_SEMANTIC_MODEL`;
  const semanticAsset = searchAssets.find(a => a.name?.trim() === semanticName);

  results.debug = {
    reportName:         name,
    semanticName,
    searchError,                                                   // API error if any
    rawSearchResult:    searchError ? null : searchResult,
    searchAssets:       searchAssets.map(a => ({ id: a.id, name: a.name })),
    semanticAssetFound: !!semanticAsset,
    parentId:           semanticAsset?.id ?? null
  };

  if (searchError) return results;
  if (!semanticAsset) return results;

  // id from search response.assets[] — passed directly to childAssets
  const parentId        = semanticAsset.id;
  const childAssetsUrl  = `${SERVER_URL}/${API_PREFIX}/assets/${parentId}/childAssets`;
  results.debug.childAssetsUrl = childAssetsUrl;

  // ── Step 2: GET /assets/:id/childAssets ──────────────────────────────────
  const childResult  = await api.getChildAssets(parentId);
  const childError   = childResult?.__error ?? null;
  const childAssets  = !childError && Array.isArray(childResult?.assets) ? childResult.assets : [];

  results.totalAssets           = childAssets.length;
  results.debug.childError      = childError;
  results.debug.rawChildResult  = childError ? null : childResult;
  results.debug.childrenLength  = childAssets.length;

  if (childError) return results;

  // ── Step 3: Extract per spec ──────────────────────────────────────────────
  // name             → name
  // id               → assetId           (assets[].id only, NOT assetType.id)
  // reliabilityScore → reliabilityScore   (direct field)
  // updatedAt        → lastProfiled       (direct field)
  for (const child of childAssets) {
    if (!child?.id) continue;

    const openAlerts     = child.openAlerts    ?? child.alertCount    ?? 0;
    const upstreamIssues = child.upstreamIssues ?? child.upstreamAlerts ?? 0;

    const cadenceData = await api.getDataCadence(child.id);
    const freshness   = cadenceData?.freshnessScore ?? cadenceData?.score ?? cadenceData?.freshness ?? null;

    results.assets.push({
      name:             child.name,
      assetId:          child.id,
      reliabilityScore: child.reliabilityScore ?? null,
      lastProfiled:     child.updatedAt        ?? null,
      freshness,
      type:             child.assetType?.name  || 'TABLE',
      openAlerts,
      upstreamIssues,
      adocLink: `${SERVER_URL}${ASSET_DETAIL_PATH}${child.id}`
    });

    if (openAlerts > 0) results.assetsWithAlerts++;
  }

  results.reportStatus = results.assetsWithAlerts > 0 ? 'Risky' : 'Healthy';
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function normalizeList(data, keys) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  // Try known keys first
  for (const k of keys) {
    if (Array.isArray(data[k])) return data[k];
  }
  // Fallback: scan all object values for the first array
  for (const v of Object.values(data)) {
    if (Array.isArray(v) && v.length > 0) return v;
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
