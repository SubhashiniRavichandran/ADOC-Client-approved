// ADOC Reliability Metrics - Background Service Worker

const DEFAULT_SERVER_URL = 'https://cso-enablement.poc.acceldatasolutions.net';
const API_PREFIX = 'catalog-server/api';
const CATALOG_LIST_PATH = '/ui/torch/namespace/Default/data-reliability/catalog/list?sort=-1:dataQualityPolicyCount';
const ASSET_DETAIL_PATH = '/ui/torch/namespace/Default/data-reliability/catalog/';
const FETCH_TIMEOUT_MS = 30000;

class AdocApiClient {
  constructor() {
    this.apiPrefix = API_PREFIX;
  }

  // Reads credentials AND server URL from storage on every request
  // so options-page changes take effect immediately without restarting.
  async getCredentials() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['adoc_access_key', 'adoc_secret_key', 'adoc_server_url'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('[ADOC] Storage read error:', chrome.runtime.lastError.message);
          resolve({ accessKey: null, secretKey: null, serverUrl: DEFAULT_SERVER_URL });
          return;
        }
        resolve({
          accessKey: result.adoc_access_key || null,
          secretKey: result.adoc_secret_key || null,
          serverUrl: result.adoc_server_url || DEFAULT_SERVER_URL
        });
      });
    });
  }

  async getServerUrl() {
    const creds = await this.getCredentials();
    return creds.serverUrl;
  }

  async makeRequest(endpoint, options = {}) {
    const credentials = await this.getCredentials();
    const url = `${credentials.serverUrl}/${this.apiPrefix}${endpoint}`;

    // Abort the fetch after FETCH_TIMEOUT_MS to prevent indefinite hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (credentials.accessKey && credentials.secretKey) {
        headers['accessKey'] = credentials.accessKey;
        headers['secretKey'] = credentials.secretKey;
      }

      const response = await fetch(url, { ...options, headers, signal: controller.signal });

      if (!response.ok) {
        const msg =
          response.status === 401 ? 'Authentication failed – check your API keys' :
          response.status === 403 ? 'Access denied – insufficient permissions' :
          response.status === 404 ? 'Endpoint not found' :
          `Server error (${response.status})`;
        throw new Error(msg);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
      }
      console.error('[ADOC] API request failed:', url, error.message);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Search assets by name using the ?name= parameter.
  // Endpoint: GET /catalog-server/api/assets/search?name=<name>
  async searchAssets(name, assetType = null) {
    let endpoint = `/assets/search?name=${encodeURIComponent(name)}`;
    if (assetType) endpoint += `&assetType=${encodeURIComponent(assetType)}`;
    try {
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('[ADOC] Asset search failed:', error.message);
      return null;
    }
  }

  // Get asset policy scores (reliability, quality, cadence, etc.)
  // Endpoint: GET /catalog-server/api/assets/{id}/scores
  async getAssetScores(assetId) {
    try {
      return await this.makeRequest(`/assets/${encodeURIComponent(assetId)}/scores`);
    } catch (error) {
      console.error('[ADOC] Failed to get asset scores:', error.message);
      return null;
    }
  }

  // Get child assets of a given asset.
  // Endpoint: GET /catalog-server/api/assets/{id}/childAssets
  async getChildAssets(assetId) {
    try {
      return await this.makeRequest(`/assets/${encodeURIComponent(assetId)}/childAssets`);
    } catch (error) {
      console.error('[ADOC] Failed to get child assets:', error.message);
      return null;
    }
  }
}

const apiClient = new AdocApiClient();

// Normalise search results – handles array, { assets: [] }, or { data: [] } shapes
function normalizeAssets(searchResult) {
  if (!searchResult) return [];
  if (Array.isArray(searchResult)) return searchResult;
  return searchResult.assets || searchResult.data || [];
}

// Normalise child assets response – handles array or { childAssets: [] } or { data: [] }
function normalizeChildAssets(childResult) {
  if (!childResult) return [];
  if (Array.isArray(childResult)) return childResult;
  return childResult.childAssets || childResult.assets || childResult.data || [];
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchReliabilityData') {
    handleFetchReliabilityData(request.reportName, request.context)
      .then(results => sendResponse({ results }))
      .catch(error => {
        console.error('[ADOC] Error fetching reliability data:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (request.action === 'openAdocPlatform') {
    apiClient.getServerUrl().then(serverUrl => {
      chrome.tabs.create({ url: `${serverUrl}${CATALOG_LIST_PATH}` });
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'testConnection') {
    testAdocConnection()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, message: error.message }));
    return true;
  }
});

// ---------------------------------------------------------------------------
// Primary entry point.
// Step 1: Search ADOC for the report by name extracted from the PowerBI DOM.
// Step 2: Get the assetId from search results.
// Step 3: Fetch child assets via /childAssets endpoint.
// Step 4: For each child asset, get scores and populate results.
// ---------------------------------------------------------------------------
async function handleFetchReliabilityData(reportName, context) {
  const serverUrl = await apiClient.getServerUrl();

  const results = {
    reportStatus: 'Healthy',
    totalAssets: 0,
    assetsWithAlerts: 0,
    assets: []
  };

  if (!reportName) {
    console.warn('[ADOC] No report name provided — cannot search ADOC');
    return results;
  }

  console.log(`[ADOC] Step 1: Searching for report by name="${reportName}"`);

  // Step 1: Search by report name
  const searchResult = await apiClient.searchAssets(reportName);
  const candidates = normalizeAssets(searchResult);

  if (candidates.length === 0) {
    console.warn(`[ADOC] No assets found matching report name "${reportName}"`);
    return results;
  }

  const reportAsset = candidates[0];
  const assetId = reportAsset.id;

  console.log(`[ADOC] Step 2: Found asset id=${assetId}, name="${reportAsset.name || reportAsset.displayName}"`);

  // Step 3: Fetch child assets
  console.log(`[ADOC] Step 3: Fetching child assets for id=${assetId}`);
  const childResult = await apiClient.getChildAssets(assetId);
  const childAssets = normalizeChildAssets(childResult);

  console.log(`[ADOC] Step 4: Processing ${childAssets.length} child assets`);

  // Step 4: For each child asset, get the name and reliability score from the childAssets response
  for (const child of childAssets) {
    if (!child || !child.id) continue;

    try {
      // Use name and score from child asset directly if available,
      // otherwise fetch scores separately
      const childName = child.name || child.displayName || `Asset_${child.id}`;
      const childType = child.assetType || child.type || 'TABLE';

      let reliabilityScore = 0;
      let dataFreshness = 'N/A';
      let lastProfiled = 'Not profiled';

      // Use scores embedded in the child asset response if available
      if (child.ruleScores && child.ruleScores.reliabilityScore !== undefined) {
        reliabilityScore = Math.round(child.ruleScores.reliabilityScore);
        if (child.ruleScores.dataCadenceScore !== undefined) {
          dataFreshness = `${Math.round(child.ruleScores.dataCadenceScore)}%`;
        }
      } else {
        // Fallback: fetch scores from the scores endpoint
        const scoresData = await apiClient.getAssetScores(child.id);
        if (scoresData) {
          reliabilityScore = Math.round(scoresData?.ruleScores?.reliabilityScore ?? 0);
          const cadence = scoresData?.ruleScores?.dataCadenceScore ?? null;
          dataFreshness = cadence !== null ? `${Math.round(cadence)}%` : 'N/A';
          lastProfiled = scoresData?.lastProfileDateTime
            ? formatDate(scoresData.lastProfileDateTime)
            : 'Not profiled';
        }
      }

      if (child.lastProfileDateTime) {
        lastProfiled = formatDate(child.lastProfileDateTime);
      }

      // Open alerts count from child asset response if provided
      const openAlerts = child.openAlerts ?? child.alertCount ?? 0;
      const upstreamIssues = child.upstreamIssues ?? 0;

      results.assets.push({
        name: childName,
        type: childType,
        reliabilityScore,
        dataFreshness,
        lastProfiled,
        openAlerts,
        upstreamIssues,
        adocLink: `${serverUrl}${ASSET_DETAIL_PATH}${child.id}`
      });

      if (openAlerts > 0) results.assetsWithAlerts++;
    } catch (err) {
      console.error(`[ADOC] Error processing child asset ${child.id}:`, err.message);
    }
  }

  results.totalAssets = results.assets.length;
  results.reportStatus = results.assetsWithAlerts > 0 ? 'Risky' : 'Healthy';
  return results;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

async function testAdocConnection() {
  try {
    await apiClient.searchAssets('test');
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[ADOC] Extension installed');
    apiClient.getServerUrl().then(serverUrl => {
      chrome.tabs.create({ url: `${serverUrl}${CATALOG_LIST_PATH}` });
    });
  } else if (details.reason === 'update') {
    console.log('[ADOC] Extension updated');
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('app.powerbi.com') || tab.url.includes('msit.powerbi.com')) {
      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
});
