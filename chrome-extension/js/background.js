// ADOC Reliability Metrics - Background Service Worker

const DEFAULT_SERVER_URL = 'https://cso-enablement.poc.acceldatasolutions.net';
const API_PREFIX = 'catalog-server/api';
const CATALOG_LIST_PATH = '/ui/torch/namespace/Default/data-reliability/catalog/list?sort=-1:dataQualityPolicyCount';
const ASSET_DETAIL_PATH = '/ui/torch/namespace/Default/data-reliability/catalog/';
const FETCH_TIMEOUT_MS = 30000;
const MAX_DATASET_TABLES = 10;

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

  // Search assets by query string with optional assetType filter.
  // Confirmed endpoint: GET /catalog-server/api/assets/search
  async searchAssets(query, assetType = null) {
    let endpoint = `/assets/search?query=${encodeURIComponent(query)}`;
    if (assetType) endpoint += `&assetType=${encodeURIComponent(assetType)}`;
    try {
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('[ADOC] Asset search failed:', error.message);
      return null;
    }
  }

  // Get asset policy scores (reliability, quality, cadence, etc.)
  // Confirmed endpoint: GET /catalog-server/api/assets/{id}/scores
  async getAssetScores(assetId) {
    try {
      return await this.makeRequest(`/assets/${encodeURIComponent(assetId)}/scores`);
    } catch (error) {
      console.error('[ADOC] Failed to get asset scores:', error.message);
      return null;
    }
  }

  // Get asset metadata key-value properties.
  // Confirmed endpoint: GET /catalog-server/api/assets/{id}/metadata
  async getAssetMetadata(assetId) {
    try {
      return await this.makeRequest(`/assets/${encodeURIComponent(assetId)}/metadata`);
    } catch (error) {
      console.error('[ADOC] Failed to get asset metadata:', error.message);
      return null;
    }
  }

  async getAlerts(assetIds, status = 'OPEN') {
    if (!assetIds || assetIds.length === 0) return null;
    const ids = assetIds.map(id => encodeURIComponent(id)).join(',');
    try {
      return await this.makeRequest(`/alerts?assetIds=${ids}&status=${encodeURIComponent(status)}`);
    } catch (error) {
      console.error('[ADOC] Failed to get alerts:', error.message);
      return null;
    }
  }

  async getLineage(assetId, direction = 'BOTH', depth = 2) {
    try {
      return await this.makeRequest(
        `/assets/${encodeURIComponent(assetId)}/lineage?direction=${encodeURIComponent(direction)}&depth=${depth}`
      );
    } catch (error) {
      console.error('[ADOC] Failed to get lineage:', error.message);
      return null;
    }
  }
}

const apiClient = new AdocApiClient();

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchReliabilityData') {
    handleFetchReliabilityData(request.assets, request.context)
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

// Normalise search results – handles array, { assets: [] }, or { data: [] } shapes
function normalizeAssets(searchResult) {
  if (!searchResult) return [];
  if (Array.isArray(searchResult)) return searchResult;
  return searchResult.assets || searchResult.data || [];
}

// ---------------------------------------------------------------------------
// Primary entry point.
// Strategy 1 (PowerBI context): search ADOC for POWERBI_REPORT by reportId.
// Strategy 2 (fallback): search ADOC by DOM-scraped asset names.
// ---------------------------------------------------------------------------
async function handleFetchReliabilityData(assets, context) {
  if (
    context &&
    context.toolType === 'POWERBI' &&
    context.workspaceId &&
    (context.reportId || context.dashboardId)
  ) {
    const reportId = context.reportId || context.dashboardId;
    const assetType = context.reportId ? 'POWERBI_REPORT' : 'POWERBI_DASHBOARD';

    console.log(`[ADOC] Searching for ${assetType} with reportId=${reportId}`);

    const searchResult = await apiClient.searchAssets(reportId, assetType);
    const candidates = normalizeAssets(searchResult);
    const matchedAsset = candidates.length > 0 ? candidates[0] : null;

    if (matchedAsset && matchedAsset.id) {
      console.log(`[ADOC] Found ${assetType} asset id=${matchedAsset.id} – fetching scores`);
      const serverUrl = await apiClient.getServerUrl();
      return await processPowerBIReportAsset(matchedAsset, context, serverUrl);
    }

    console.warn('[ADOC] PowerBI asset not found in ADOC – falling back to name-based search');
  }

  console.log(`[ADOC] Using name-based search for ${assets.length} DOM-scraped assets`);
  const serverUrl = await apiClient.getServerUrl();
  return await processAssetsByName(assets, serverUrl);
}

// ---------------------------------------------------------------------------
// Fetch scores for the POWERBI_REPORT asset and its related DATASET_TABLE
// assets (searched by workspaceId). Caps at MAX_DATASET_TABLES API calls.
// ---------------------------------------------------------------------------
async function processPowerBIReportAsset(reportAsset, context, serverUrl) {
  const results = {
    reportStatus: 'Healthy',
    totalAssets: 0,
    assetsWithAlerts: 0,
    assets: []
  };

  if (!reportAsset || !reportAsset.id) {
    console.error('[ADOC] Invalid reportAsset – missing id');
    return results;
  }

  try {
    const reportScores = await apiClient.getAssetScores(reportAsset.id);
    const reportReliability = reportScores?.ruleScores?.reliabilityScore ?? null;
    const dataCadenceScore = reportScores?.ruleScores?.dataCadenceScore ?? null;
    const lastProfiled = reportScores?.lastProfileDateTime
      ? formatDate(reportScores.lastProfileDateTime)
      : 'Not profiled';

    if (reportReliability !== null) {
      results.assets.push({
        name: reportAsset.name || reportAsset.displayName || 'PowerBI Report',
        type: 'POWERBI_REPORT',
        reliabilityScore: Math.round(reportReliability),
        dataFreshness: dataCadenceScore !== null ? `${Math.round(dataCadenceScore)}%` : 'N/A',
        lastProfiled,
        openAlerts: 0,
        upstreamIssues: 0,
        adocLink: `${serverUrl}${ASSET_DETAIL_PATH}${reportAsset.id}`
      });
    }

    const datasetSearch = await apiClient.searchAssets(context.workspaceId, 'POWERBI_DATASET_TABLE');
    const datasetTables = normalizeAssets(datasetSearch);

    for (const table of datasetTables.slice(0, MAX_DATASET_TABLES)) {
      if (!table || !table.id) continue;
      try {
        const tableScores = await apiClient.getAssetScores(table.id);
        const reliability = tableScores?.ruleScores?.reliabilityScore ?? 0;
        const cadence = tableScores?.ruleScores?.dataCadenceScore ?? null;
        const tableLastProfiled = tableScores?.lastProfileDateTime
          ? formatDate(tableScores.lastProfileDateTime)
          : 'Not profiled';

        const alertsData = await apiClient.getAlerts([table.id]);
        const openAlerts = (alertsData?.alerts || []).filter(a => a.status === 'OPEN').length;
        const upstreamIssues = await getUpstreamIssues(table.id);

        results.assets.push({
          name: table.name || table.displayName || `Table_${table.id}`,
          type: 'POWERBI_DATASET_TABLE',
          reliabilityScore: Math.round(reliability),
          dataFreshness: cadence !== null ? `${Math.round(cadence)}%` : 'N/A',
          lastProfiled: tableLastProfiled,
          openAlerts,
          upstreamIssues,
          adocLink: `${serverUrl}${ASSET_DETAIL_PATH}${table.id}`
        });

        if (openAlerts > 0) results.assetsWithAlerts++;
      } catch (err) {
        console.error(`[ADOC] Error processing dataset table ${table.id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[ADOC] Error processing PowerBI report asset:', error.message);
  }

  results.totalAssets = results.assets.length;
  results.reportStatus = results.assetsWithAlerts > 0 ? 'Risky' : 'Healthy';
  return results;
}

// ---------------------------------------------------------------------------
// Fallback: search ADOC by the asset name scraped from the PowerBI DOM.
// ---------------------------------------------------------------------------
async function processAssetsByName(assets, serverUrl) {
  const results = {
    reportStatus: 'Healthy',
    totalAssets: assets.length,
    assetsWithAlerts: 0,
    assets: []
  };

  for (const asset of assets) {
    try {
      const searchResult = await apiClient.searchAssets(asset.name, asset.type);
      const candidates = normalizeAssets(searchResult);

      if (candidates.length > 0 && candidates[0].id) {
        const adocAsset = candidates[0];
        const scoresData = await apiClient.getAssetScores(adocAsset.id);
        const reliability = scoresData?.ruleScores?.reliabilityScore ?? 0;
        const cadence = scoresData?.ruleScores?.dataCadenceScore ?? null;
        const lastProfiled = scoresData?.lastProfileDateTime
          ? formatDate(scoresData.lastProfileDateTime)
          : 'Not profiled';

        const alertsData = await apiClient.getAlerts([adocAsset.id]);
        const openAlerts = (alertsData?.alerts || []).filter(a => a.status === 'OPEN').length;
        const upstreamIssues = await getUpstreamIssues(adocAsset.id);

        results.assets.push({
          name: asset.name,
          type: asset.type || 'TABLE',
          reliabilityScore: Math.round(reliability),
          dataFreshness: cadence !== null ? `${Math.round(cadence)}%` : 'N/A',
          lastProfiled,
          openAlerts,
          upstreamIssues,
          adocLink: `${serverUrl}${ASSET_DETAIL_PATH}${adocAsset.id}`
        });

        if (openAlerts > 0) results.assetsWithAlerts++;
      } else {
        results.assets.push({
          name: asset.name,
          type: asset.type || 'TABLE',
          reliabilityScore: 0,
          dataFreshness: 'N/A',
          lastProfiled: 'Not in ADOC',
          openAlerts: 0,
          upstreamIssues: 0,
          adocLink: `${serverUrl}${CATALOG_LIST_PATH}`
        });
      }
    } catch (error) {
      console.error(`[ADOC] Error processing asset ${asset.name}:`, error.message);
    }
  }

  results.reportStatus = results.assetsWithAlerts > 0 ? 'Risky' : 'Healthy';
  return results;
}

// Count upstream assets with open alerts via lineage
async function getUpstreamIssues(assetId) {
  try {
    const lineageData = await apiClient.getLineage(assetId, 'UPSTREAM', 1);
    if (!lineageData?.lineage?.upstream) return 0;
    return lineageData.lineage.upstream.filter(u => u.hasAlerts).length;
  } catch (error) {
    console.error('[ADOC] Error getting upstream issues:', error.message);
    return 0;
  }
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
    await apiClient.searchAssets('test', 'TABLE');
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
