// ADOC Reliability Metrics - Background Service Worker
try {
  importScripts('config.js');
} catch (e) {
  console.error('[ADOC] importScripts("config.js") failed — API keys will be missing:', e.message);
  self.CONFIG = self.CONFIG || {};
}

const SERVER_URL        = CONFIG.serverUrl        || '';
const API_PREFIX        = CONFIG.apiPrefix        || 'catalog-server/api';
const PIPELINE_PREFIX   = 'torch-pipeline/api';
const ASSET_DETAIL_PATH = CONFIG.assetDetailPath  || '';
const FETCH_TIMEOUT_MS  = CONFIG.fetchTimeoutMs   || 30000;
const ACCESS_KEY        = CONFIG.accessKey        || '';
const SECRET_KEY        = CONFIG.secretKey        || '';

console.log('[ADOC] Config loaded — server:', SERVER_URL,
            '| apiKeysConfigured:', !!(ACCESS_KEY && SECRET_KEY));

let loginTabId = null;

// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────────────────────
class AdocApiClient {

  // options.apiPrefix overrides the default catalog-server prefix (e.g. for
  // torch-pipeline endpoints).
  async makeRequest(endpoint, options = {}) {
    const prefix = options.apiPrefix ?? API_PREFIX;
    const url    = `${SERVER_URL}/${prefix}${endpoint}`;
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const method  = (options.method || 'GET').toUpperCase();
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);

    console.log(`[ADOC] ▶ ${method} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Accept': 'application/json, */*;q=0.9',
          ...(ACCESS_KEY ? { 'accessKey': ACCESS_KEY } : {}),
          ...(SECRET_KEY ? { 'secretKey': SECRET_KEY } : {}),
          ...(hasBody    ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {})
        },
        signal: controller.signal
      });

      console.log(`[ADOC] ◀ ${response.status} ${response.statusText} — ${url}`);

      if (!response.ok) {
        const msg =
          response.status === 401 ? 'Not authenticated – please log in again' :
          response.status === 403 ? 'Access denied – insufficient permissions' :
          response.status === 404 ? 'API endpoint not found' :
          `Server error (${response.status})`;
        throw new Error(msg);
      }

      const data = await response.json();
      console.log(`[ADOC] ✔ Response from ${url}:`, JSON.stringify(data).slice(0, 500));
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Request timed out after 30 seconds');
      console.error(`[ADOC] ✘ Request failed: ${url}`, error.message);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Step 1: GET /catalog-server/api/assets/search?name=<reportName>
  async searchAssets(name) {
    try {
      const result = await this.makeRequest(`/assets/search?name=${encodeURIComponent(name)}`);
      const assets = Array.isArray(result?.assets) ? result.assets : [];
      console.log(`[ADOC] searchAssets("${name}") → ${assets.length} asset(s):`,
        assets.map(a => `[${a.id}] ${a.name} (${a.assetType?.name})`));
      return result;
    } catch (e) {
      return { __error: e.message };
    }
  }

  // Step 2: GET /catalog-server/api/assets/:id/childAssets
  async getChildAssets(assetId) {
    try {
      const result = await this.makeRequest(`/assets/${encodeURIComponent(assetId)}/childAssets`);
      const assets = Array.isArray(result?.assets) ? result.assets : [];
      console.log(`[ADOC] getChildAssets(${assetId}) → ${assets.length} child asset(s):`,
        assets.map(a => `[${a.id}] ${a.name} (${a.assetType?.name})`));
      return result;
    } catch (e) {
      return { __error: e.message };
    }
  }

  // Step 3: GET /torch-pipeline/api/assets/:id/lineage?sublevellineage=true
  async getLineage(assetId) {
    try {
      const result = await this.makeRequest(
        `/assets/${encodeURIComponent(assetId)}/lineage?sublevellineage=true`,
        { apiPrefix: PIPELINE_PREFIX }
      );
      console.log(`[ADOC] getLineage(${assetId}) →`, JSON.stringify(result).slice(0, 500));
      return result;
    } catch (e) {
      console.error(`[ADOC] getLineage(${assetId}) failed:`, e.message);
      return { __error: e.message };
    }
  }

  // Step 4: GET /catalog-server/api/assets/:id/scores
  async getAssetScores(assetId) {
    try {
      const result = await this.makeRequest(`/assets/${encodeURIComponent(assetId)}/scores`);
      console.log(`[ADOC] getAssetScores(${assetId}) →`, JSON.stringify(result).slice(0, 500));
      return result;
    } catch (e) {
      console.error(`[ADOC] getAssetScores(${assetId}) failed:`, e.message);
      return { __error: e.message };
    }
  }

  // Step 5: GET /catalog-server/api/assets/:id/rulesWithLatestExecution
  async getAssetRules(assetId) {
    try {
      const result = await this.makeRequest(
        `/assets/${encodeURIComponent(assetId)}/rulesWithLatestExecution`
      );
      console.log(`[ADOC] getAssetRules(${assetId}) →`, JSON.stringify(result).slice(0, 500));
      return result;
    } catch (e) {
      console.error(`[ADOC] getAssetRules(${assetId}) failed:`, e.message);
      return { __error: e.message };
    }
  }
}

const api = new AdocApiClient();

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — SSO LOGIN FLOW
// ─────────────────────────────────────────────────────────────────────────────
function openSsoLoginTab() {
  if (loginTabId !== null) {
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
    const onAdocDomain   = url.startsWith(SERVER_URL);
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

async function confirmSsoSession(tabId) {
  await chrome.storage.local.set({ adoc_authenticated: true });
  try { chrome.tabs.remove(tabId, () => { loginTabId = null; }); } catch (_) {}
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
        .catch(err  => sendResponse({ error: err.message }));
      return true;

    case 'testConnection':
      api.searchAssets('test')
        .then(r => sendResponse({ success: r !== null, message: r !== null ? 'Connected' : 'Failed' }))
        .catch(e => sendResponse({ success: false, message: e.message }));
      return true;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CORE DATA FLOW
//
// Step 1: GET /catalog-server/api/assets/search?name=<reportName>
//         → find asset where name === "<reportName>::POWERBI_SEMANTIC_MODEL"
//         → semanticModelAssetId = assets[].id
//
// Step 2: GET /catalog-server/api/assets/:semanticModelAssetId/childAssets
//         → collect childAssetIds[], totalChildAssets = count
//
// Step 3: For each childAssetId:
//         GET /torch-pipeline/api/assets/:childAssetId/lineage?sublevellineage=true
//         → filter: assetType != "POWERBI_SEMANTIC_MODEL_TABLE" AND lineage == "UPSTREAM"
//         → upstreamSourceAssetId
//
// Step 4: GET /catalog-server/api/assets/:upstreamSourceAssetId/scores
//         → reliabilityScore, dataCadenceScore (freshness), lastProfileDateTime
//
// Step 5: GET /catalog-server/api/assets/:upstreamSourceAssetId/rulesWithLatestExecution
//         → any rule status == "CRITICAL" → hasCriticalAlert = true
// ─────────────────────────────────────────────────────────────────────────────
async function fetchReliabilityData(reportName) {
  const results = {
    reportName:        reportName || 'Unknown Report',
    reportStatus:      'Healthy',
    totalAssets:       0,
    assetsWithAlerts:  0,
    assets:            [],
    debug:             {}
  };

  if (!reportName) return results;

  const name = reportName.trim();

  // ── Step 1: Find POWERBI_SEMANTIC_MODEL ──────────────────────────────────
  const searchResult = await api.searchAssets(name);
  const searchError  = searchResult?.__error ?? null;
  const searchAssets = !searchError
    ? (Array.isArray(searchResult?.assets)
        ? searchResult.assets
        : normalizeList(searchResult, ['assets', 'content', 'data', 'items']))
    : [];

  const semanticName  = `${name}::POWERBI_SEMANTIC_MODEL`;
  const semanticAsset = searchAssets.find(
    a => a.name?.trim().toLowerCase() === semanticName.toLowerCase()
  );

  results.debug = {
    apiKeysConfigured:   !!(ACCESS_KEY && SECRET_KEY),
    reportName:          name,
    semanticName,
    searchEndpoint:      `${SERVER_URL}/${API_PREFIX}/assets/search?name=${encodeURIComponent(name)}`,
    searchError,
    searchAssetsCount:   searchAssets.length,
    searchAssets:        searchAssets.map(a => ({ id: a.id, name: a.name, type: a.assetType?.name })),
    semanticAssetFound:  !!semanticAsset,
    semanticModelAssetId: semanticAsset?.id ?? null
  };

  if (searchError || !semanticAsset) return results;

  const semanticModelAssetId = semanticAsset.id;

  // ── Step 2: Get child assets ──────────────────────────────────────────────
  const childResult  = await api.getChildAssets(semanticModelAssetId);
  const childError   = childResult?.__error ?? null;
  const childAssets  = !childError
    ? normalizeList(childResult, ['assets', 'content', 'data', 'items'])
    : [];

  const totalChildAssets = childAssets.length;
  results.totalAssets    = totalChildAssets;

  results.debug.childAssetsEndpoint = `${SERVER_URL}/${API_PREFIX}/assets/${semanticModelAssetId}/childAssets`;
  results.debug.childError          = childError;
  results.debug.totalChildAssets    = totalChildAssets;
  results.debug.rawChildAssets      = childError ? [] : childAssets;

  if (childError) return results;

  const childAssetIds = childAssets.map(a => a.id).filter(Boolean);
  console.log(`[ADOC] childAssetIds (${childAssetIds.length}):`, childAssetIds);

  // ── Steps 3‑5: Per child asset ────────────────────────────────────────────
  for (const childAssetId of childAssetIds) {

    // Step 3: Lineage → find upstream source asset
    const lineageResult = await api.getLineage(childAssetId);
    const lineageError  = lineageResult?.__error ?? null;

    if (lineageError) {
      results.assets.push({
        childAssetId,
        upstreamSourceAssetId: null,
        name:                  null,
        type:                  null,
        reliabilityScore:      null,
        freshness:             null,
        lastProfileDateTime:   null,
        openAlerts:            0,
        hasCriticalAlert:      false,
        adocLink:              `${SERVER_URL}${ASSET_DETAIL_PATH}${childAssetId}`,
        lineageError
      });
      continue;
    }

    // Lineage responses vary in shape — try known keys then scan for arrays.
    const lineageItems = normalizeList(
      lineageResult,
      ['assets', 'lineage', 'nodes', 'content', 'data', 'items']
    );

    console.log(`[ADOC] lineage for child ${childAssetId} → ${lineageItems.length} item(s):`,
      lineageItems.map(a => `[${a.id ?? a.assetId}] ${a.name} type=${a.assetType?.name} dir=${a.lineage ?? a.direction ?? a.lineageDirection}`));

    // Filter: assetType != POWERBI_SEMANTIC_MODEL_TABLE AND direction == UPSTREAM
    const upstreamAsset = lineageItems.find(a => {
      const type = a.assetType?.name ?? a.assetTypeName ?? '';
      const dir  = a.lineage ?? a.direction ?? a.lineageDirection ?? '';
      return type !== 'POWERBI_SEMANTIC_MODEL_TABLE' && dir === 'UPSTREAM';
    });

    if (!upstreamAsset) {
      console.log(`[ADOC] No upstream source asset found for child ${childAssetId}`);
      results.assets.push({
        childAssetId,
        upstreamSourceAssetId: null,
        name:                  null,
        type:                  null,
        reliabilityScore:      null,
        freshness:             null,
        lastProfileDateTime:   null,
        openAlerts:            0,
        hasCriticalAlert:      false,
        adocLink:              `${SERVER_URL}${ASSET_DETAIL_PATH}${childAssetId}`,
        lineageError:          'No upstream source asset found in lineage'
      });
      continue;
    }

    const upstreamSourceAssetId = upstreamAsset.id ?? upstreamAsset.assetId;
    console.log(`[ADOC] upstreamSourceAssetId for child ${childAssetId}:`, upstreamSourceAssetId,
      upstreamAsset.name, upstreamAsset.assetType?.name);

    // Step 4: Scores (reliabilityScore, dataCadenceScore, lastProfileDateTime)
    const scoresResult = await api.getAssetScores(upstreamSourceAssetId);
    const scoresError  = scoresResult?.__error ?? null;

    let reliabilityScore    = null;
    let freshness           = null;
    let lastProfileDateTime = null;

    if (!scoresError) {
      // Server may return scores nested under ruleScores or flat at the top level.
      const s         = scoresResult?.ruleScores ?? scoresResult ?? {};
      reliabilityScore    = s.reliabilityScore    ?? null;
      freshness           = s.dataCadenceScore    ?? s.freshnessScore ?? null;
      lastProfileDateTime = s.lastProfileDateTime ?? scoresResult?.lastProfileDateTime ?? null;
    }

    // Step 5: Rules with latest execution → CRITICAL = alert
    const rulesResult = await api.getAssetRules(upstreamSourceAssetId);
    const rulesError  = rulesResult?.__error ?? null;
    let hasCriticalAlert = false;
    let openAlerts       = 0;

    if (!rulesError) {
      const rules = normalizeList(rulesResult, ['rules', 'content', 'data', 'items']);
      const criticals = rules.filter(r => {
        const status = r.latestExecution?.status ?? r.status ?? r.executionStatus ?? '';
        return status === 'CRITICAL';
      });
      openAlerts       = criticals.length;
      hasCriticalAlert = openAlerts > 0;
    }

    if (hasCriticalAlert) results.assetsWithAlerts++;

    results.assets.push({
      childAssetId,
      upstreamSourceAssetId,
      name:                upstreamAsset.name    ?? null,
      type:                upstreamAsset.assetType?.name ?? null,
      reliabilityScore,
      freshness,
      lastProfileDateTime,
      openAlerts,
      hasCriticalAlert,
      adocLink:            `${SERVER_URL}${ASSET_DETAIL_PATH}${upstreamSourceAssetId}`
    });
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
  for (const k of keys) {
    if (Array.isArray(data[k])) return data[k];
  }
  for (const v of Object.values(data)) {
    if (Array.isArray(v) && v.length > 0) return v;
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[ADOC] Extension installed');
  }
});

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
