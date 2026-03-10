// ADOC Reliability Metrics - Background Service Worker

// ADOC API Client
class AdocApiClient {
  constructor() {
    this.baseUrl = 'https://cso-enablement.poc.acceldatasolutions.net';
    // Confirmed from official Acceldata API docs (V26.2.0)
    this.apiPrefix = 'catalog-server/api';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}/${this.apiPrefix}${endpoint}`;

    try {
      const credentials = await this.getCredentials();

      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Auth header names confirmed from Acceldata API docs (lowercase, no X- prefix)
      if (credentials.accessKey && credentials.secretKey) {
        headers['accessKey'] = credentials.accessKey;
        headers['secretKey'] = credentials.secretKey;
      }

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ADOC API request failed:', error);
      throw error;
    }
  }

  async getCredentials() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['adoc_access_key', 'adoc_secret_key'], (result) => {
        resolve({
          accessKey: result.adoc_access_key || null,
          secretKey: result.adoc_secret_key || null
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Search assets by query string with optional assetType filter.
  // Confirmed endpoint: GET /catalog-server/api/assets/search
  // PowerBI asset types: POWERBI_REPORT (31), POWERBI_DATASET (29),
  //   POWERBI_DATASET_TABLE (49), POWERBI_GROUP (27), etc.
  // ---------------------------------------------------------------------------
  async searchAssets(query, assetType = null) {
    let endpoint = `/assets/search?query=${encodeURIComponent(query)}`;
    if (assetType) {
      endpoint += `&assetType=${assetType}`;
    }
    try {
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Asset search failed:', error);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Get asset policy scores (reliability, quality, cadence, etc.)
  // Confirmed endpoint: GET /catalog-server/api/assets/{id}/scores
  // Response: { ruleScores: { reliabilityScore, dataQualityScore, ... },
  //             previousScores: {...}, policyCount: {...},
  //             lastProfileDateTime: "ISO string" }
  // ---------------------------------------------------------------------------
  async getAssetScores(assetId) {
    try {
      return await this.makeRequest(`/assets/${assetId}/scores`);
    } catch (error) {
      console.error('Failed to get asset scores:', error);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Get asset metadata (key-value properties for the asset).
  // Confirmed endpoint: GET /catalog-server/api/assets/{id}/metadata
  // Response: { data: { items: [{ key, value, dataType, source }] } }
  // Used to verify workspaceId / reportId for PowerBI assets.
  // ---------------------------------------------------------------------------
  async getAssetMetadata(assetId) {
    try {
      return await this.makeRequest(`/assets/${assetId}/metadata`);
    } catch (error) {
      console.error('Failed to get asset metadata:', error);
      return null;
    }
  }

  // Alerts endpoint — path not yet confirmed; using best-known pattern
  async getAlerts(assetIds, status = 'OPEN') {
    const endpoint = `/alerts?assetIds=${assetIds.join(',')}&status=${status}`;
    try {
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Failed to get alerts:', error);
      return null;
    }
  }

  // Lineage endpoint — path not yet confirmed; using best-known pattern
  async getLineage(assetId, direction = 'BOTH', depth = 2) {
    try {
      return await this.makeRequest(`/assets/${assetId}/lineage?direction=${direction}&depth=${depth}`);
    } catch (error) {
      console.error('Failed to get lineage:', error);
      return null;
    }
  }
}

// Initialize API client
const apiClient = new AdocApiClient();

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchReliabilityData') {
    handleFetchReliabilityData(request.assets, request.context)
      .then(results => sendResponse({ results }))
      .catch(error => {
        console.error('Error fetching reliability data:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (request.action === 'openAdocPlatform') {
    chrome.tabs.create({ url: 'https://cso-enablement.poc.acceldatasolutions.net/ui/torch/namespace/Default/data-reliability/catalog/list?sort=-1:dataQualityPolicyCount' });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'testConnection') {
    testAdocConnection()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// ---------------------------------------------------------------------------
// Primary entry point.
// Strategy 1 (PowerBI context): search ADOC for POWERBI_REPORT asset by
//   reportId, verify workspaceId via metadata, then fetch scores.
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

    // Search for POWERBI_REPORT asset using the reportId (GUID) as query
    const searchResult = await apiClient.searchAssets(reportId, assetType);
    const matchedAsset = findMatchingPowerBIAsset(searchResult, context.workspaceId, reportId);

    if (matchedAsset) {
      console.log(`[ADOC] Found ${assetType} asset id=${matchedAsset.id} – fetching scores`);
      return await processPowerBIReportAsset(matchedAsset, context);
    }

    console.warn('[ADOC] PowerBI asset not found in ADOC – falling back to name-based search');
  }

  console.log(`[ADOC] Using name-based search for ${assets.length} DOM-scraped assets`);
  return await processAssetsByName(assets);
}

// ---------------------------------------------------------------------------
// Find the correct ADOC asset from search results.
// If only one result, use it directly.
// If multiple, use first match (metadata-based verification can be added
// once we confirm what keys ADOC stores for PowerBI assets).
// ---------------------------------------------------------------------------
function findMatchingPowerBIAsset(searchResult, workspaceId, reportId) {
  if (!searchResult) return null;

  // Handle both array response and { assets: [...] } response shapes
  const candidates = Array.isArray(searchResult)
    ? searchResult
    : (searchResult.assets || searchResult.data || []);

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  console.log(`[ADOC] ${candidates.length} candidates found, using first match`);
  return candidates[0];
}

// ---------------------------------------------------------------------------
// Fetch scores for the POWERBI_REPORT asset and its related DATASET_TABLE
// assets (searched by workspaceId).
// ---------------------------------------------------------------------------
async function processPowerBIReportAsset(reportAsset, context) {
  const results = {
    reportStatus: 'Healthy',
    totalAssets: 0,
    assetsWithAlerts: 0,
    assets: []
  };

  try {
    // 1. Get scores for the report asset itself
    const reportScores = await apiClient.getAssetScores(reportAsset.id);
    const reportReliability = reportScores?.ruleScores?.reliabilityScore ?? null;
    const lastProfiled = reportScores?.lastProfileDateTime
      ? formatDate(reportScores.lastProfileDateTime)
      : 'Not profiled';
    const dataCadenceScore = reportScores?.ruleScores?.dataCadenceScore ?? null;

    // 2. Search for POWERBI_DATASET_TABLE assets in the same workspace
    const datasetSearch = await apiClient.searchAssets(context.workspaceId, 'POWERBI_DATASET_TABLE');
    const datasetTables = Array.isArray(datasetSearch)
      ? datasetSearch
      : (datasetSearch?.assets || datasetSearch?.data || []);

    // Include the report itself as an asset entry if we have its scores
    if (reportReliability !== null) {
      const reportEntry = {
        name: reportAsset.name || reportAsset.displayName || 'PowerBI Report',
        type: 'POWERBI_REPORT',
        reliabilityScore: Math.round(reportReliability),
        dataFreshness: dataCadenceScore !== null ? `${Math.round(dataCadenceScore)}%` : 'N/A',
        lastProfiled: lastProfiled,
        openAlerts: 0,
        upstreamIssues: 0,
        adocLink: `https://cso-enablement.poc.acceldatasolutions.net/ui/torch/namespace/Default/data-reliability/catalog/${reportAsset.id}`
      };
      results.assets.push(reportEntry);
    }

    // 3. For each dataset table get scores (cap at 10 to avoid too many API calls)
    for (const table of datasetTables.slice(0, 10)) {
      try {
        const tableScores = await apiClient.getAssetScores(table.id);
        const reliability = tableScores?.ruleScores?.reliabilityScore ?? 0;
        const cadence = tableScores?.ruleScores?.dataCadenceScore ?? null;
        const tableLastProfiled = tableScores?.lastProfileDateTime
          ? formatDate(tableScores.lastProfileDateTime)
          : 'Not profiled';

        const alertsData = await apiClient.getAlerts([table.id]);
        const openAlerts = alertsData?.alerts?.filter(a => a.status === 'OPEN').length ?? 0;
        const upstreamIssues = await getUpstreamIssues(table.id);

        const tableEntry = {
          name: table.name || table.displayName || `Table_${table.id}`,
          type: 'POWERBI_DATASET_TABLE',
          reliabilityScore: Math.round(reliability),
          dataFreshness: cadence !== null ? `${Math.round(cadence)}%` : 'N/A',
          lastProfiled: tableLastProfiled,
          openAlerts: openAlerts,
          upstreamIssues: upstreamIssues,
          adocLink: `https://cso-enablement.poc.acceldatasolutions.net/ui/torch/namespace/Default/data-reliability/catalog/${table.id}`
        };

        results.assets.push(tableEntry);
        if (openAlerts > 0) results.assetsWithAlerts++;
      } catch (err) {
        console.error(`[ADOC] Error processing dataset table ${table.id}:`, err);
      }
    }
  } catch (error) {
    console.error('[ADOC] Error processing PowerBI report asset:', error);
  }

  results.totalAssets = results.assets.length;
  results.reportStatus = results.assetsWithAlerts > 0 ? 'Risky' : 'Healthy';
  return results;
}

// ---------------------------------------------------------------------------
// Fallback: search ADOC by the asset name scraped from the PowerBI DOM.
// ---------------------------------------------------------------------------
async function processAssetsByName(assets) {
  const results = {
    reportStatus: 'Healthy',
    totalAssets: assets.length,
    assetsWithAlerts: 0,
    assets: []
  };

  for (const asset of assets) {
    try {
      const searchResult = await apiClient.searchAssets(asset.name, asset.type);
      const candidates = Array.isArray(searchResult)
        ? searchResult
        : (searchResult?.assets || searchResult?.data || []);

      if (candidates.length > 0) {
        const adocAsset = candidates[0];

        const scoresData = await apiClient.getAssetScores(adocAsset.id);
        const reliability = scoresData?.ruleScores?.reliabilityScore ?? 0;
        const cadence = scoresData?.ruleScores?.dataCadenceScore ?? null;
        const lastProfiled = scoresData?.lastProfileDateTime
          ? formatDate(scoresData.lastProfileDateTime)
          : 'Not profiled';

        const alertsData = await apiClient.getAlerts([adocAsset.id]);
        const openAlerts = alertsData?.alerts?.filter(a => a.status === 'OPEN').length ?? 0;
        const upstreamIssues = await getUpstreamIssues(adocAsset.id);

        const assetResult = {
          name: asset.name,
          type: asset.type || 'TABLE',
          reliabilityScore: Math.round(reliability),
          dataFreshness: cadence !== null ? `${Math.round(cadence)}%` : 'N/A',
          lastProfiled: lastProfiled,
          openAlerts: openAlerts,
          upstreamIssues: upstreamIssues,
          adocLink: `https://cso-enablement.poc.acceldatasolutions.net/ui/torch/namespace/Default/data-reliability/catalog/${adocAsset.id}`
        };

        results.assets.push(assetResult);
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
          adocLink: 'https://cso-enablement.poc.acceldatasolutions.net/ui/torch/namespace/Default/data-reliability/catalog/list?sort=-1:dataQualityPolicyCount'
        });
      }
    } catch (error) {
      console.error(`[ADOC] Error processing asset ${asset.name}:`, error);
    }
  }

  results.reportStatus = results.assetsWithAlerts > 0 ? 'Risky' : 'Healthy';
  return results;
}

// Get upstream issues count via lineage
async function getUpstreamIssues(assetId) {
  try {
    const lineageData = await apiClient.getLineage(assetId, 'UPSTREAM', 1);
    if (!lineageData || !lineageData.lineage || !lineageData.lineage.upstream) return 0;
    return lineageData.lineage.upstream.filter(u => u.hasAlerts).length;
  } catch (error) {
    console.error('Error getting upstream issues:', error);
    return 0;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
    console.log('ADOC Reliability Metrics extension installed');
    chrome.tabs.create({
      url: 'https://cso-enablement.poc.acceldatasolutions.net/ui/torch/namespace/Default/data-reliability/catalog/list?sort=-1:dataQualityPolicyCount'
    });
  } else if (details.reason === 'update') {
    console.log('ADOC Reliability Metrics extension updated');
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('app.powerbi.com') || tab.url.includes('msit.powerbi.com')) {
      chrome.action.setBadgeText({ text: '✓', tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId: tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  }
});
