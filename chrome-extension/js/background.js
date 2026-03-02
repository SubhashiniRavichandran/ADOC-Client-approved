// ADOC Reliability Metrics - Background Service Worker

// ADOC API Client
class AdocApiClient {
  constructor() {
    this.baseUrl = 'https://indiumtech.acceldata.app';
    this.apiVersion = 'api/v1';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}/${this.apiVersion}${endpoint}`;

    try {
      // Get stored credentials
      const credentials = await this.getCredentials();

      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Add authentication headers if available
      if (credentials.accessKey && credentials.secretKey) {
        headers['X-ACCESS-KEY'] = credentials.accessKey;
        headers['X-SECRET-KEY'] = credentials.secretKey;
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

  // --- PowerBI-specific endpoint ---
  // GET /api/v1/bi-tools/powerbi/workspaces/{workspaceId}/reports/{reportId}
  // Returns the report metadata plus underlyingAssets already mapped to ADOC asset IDs.
  async getPowerBIReportAssets(workspaceId, reportId) {
    try {
      return await this.makeRequest(
        `/bi-tools/powerbi/workspaces/${encodeURIComponent(workspaceId)}/reports/${encodeURIComponent(reportId)}`
      );
    } catch (error) {
      console.error('Failed to get PowerBI report assets from ADOC:', error);
      return null;
    }
  }

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

  async getReliabilityScore(assetId) {
    try {
      return await this.makeRequest(`/assets/${assetId}/reliability`);
    } catch (error) {
      console.error('Failed to get reliability score:', error);
      return null;
    }
  }

  async getAlerts(assetIds, status = 'OPEN') {
    const endpoint = `/alerts?assetIds=${assetIds.join(',')}&status=${status}`;

    try {
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Failed to get alerts:', error);
      return null;
    }
  }

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
    // Accept both context (workspaceId/reportId) and fallback assets from DOM scraping
    handleFetchReliabilityData(request.assets, request.context)
      .then(results => sendResponse({ results }))
      .catch(error => {
        console.error('Error fetching reliability data:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async response
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
// Primary entry point: use PowerBI-specific ADOC endpoint when context is
// available, fall back to asset-name search for unrecognised BI tools or when
// the dedicated endpoint returns nothing.
// ---------------------------------------------------------------------------
async function handleFetchReliabilityData(assets, context) {
  // Strategy 1: PowerBI report context  →  dedicated ADOC bi-tools endpoint
  if (
    context &&
    context.toolType === 'POWERBI' &&
    context.workspaceId &&
    (context.reportId || context.dashboardId)
  ) {
    const reportId = context.reportId || context.dashboardId;
    console.log(
      `[ADOC] Using PowerBI endpoint for workspaceId=${context.workspaceId} reportId=${reportId}`
    );

    const reportData = await apiClient.getPowerBIReportAssets(context.workspaceId, reportId);

    if (reportData && reportData.underlyingAssets && reportData.underlyingAssets.length > 0) {
      console.log(
        `[ADOC] PowerBI endpoint returned ${reportData.underlyingAssets.length} underlying assets`
      );
      return await processReportAssets(reportData);
    }

    console.warn(
      '[ADOC] PowerBI endpoint returned no assets – falling back to name-based search'
    );
  }

  // Strategy 2: Fallback – search ADOC by asset name (DOM-scraped names)
  console.log(`[ADOC] Using name-based search for ${assets.length} DOM-scraped assets`);
  return await processAssetsByName(assets);
}

// ---------------------------------------------------------------------------
// Process assets returned by the PowerBI-specific ADOC endpoint.
// Each entry in underlyingAssets already contains an adocAssetId so we skip
// the search step entirely.
// ---------------------------------------------------------------------------
async function processReportAssets(reportData) {
  const results = {
    reportStatus: 'Healthy',
    reportName: reportData.reportName || '',
    workspaceName: reportData.workspaceName || '',
    lastRefreshed: reportData.lastRefreshed ? formatDate(reportData.lastRefreshed) : 'N/A',
    totalAssets: reportData.underlyingAssets.length,
    assetsWithAlerts: 0,
    assets: []
  };

  for (const underlying of reportData.underlyingAssets) {
    try {
      const assetId = underlying.adocAssetId;

      // Prefer score from the endpoint payload; enrich with fresh reliability call
      const reliabilityData = await apiClient.getReliabilityScore(assetId);
      const alertsData = await apiClient.getAlerts([assetId]);

      const openAlerts = alertsData?.alerts?.filter(a => a.status === 'OPEN').length || 0;
      const upstreamIssues = await getUpstreamIssues(assetId);

      const assetResult = {
        name: underlying.tableName,
        type: 'TABLE',
        columnUsage: underlying.columnUsage || [],
        reliabilityScore:
          reliabilityData?.overallScore ?? underlying.reliabilityScore ?? 0,
        dataFreshness: reliabilityData?.scoreBreakdown?.timeliness
          ? `${reliabilityData.scoreBreakdown.timeliness}%`
          : '100%',
        lastProfiled: reliabilityData?.lastEvaluated
          ? formatDate(reliabilityData.lastEvaluated)
          : formatDate(new Date()),
        openAlerts: openAlerts !== 0 ? openAlerts : (underlying.openAlerts ?? 0),
        upstreamIssues: upstreamIssues,
        adocLink: `https://indiumtech.acceldata.app/assets/${assetId}`
      };

      results.assets.push(assetResult);

      if (assetResult.openAlerts > 0) {
        results.assetsWithAlerts++;
      }
    } catch (error) {
      console.error(`[ADOC] Error processing underlying asset ${underlying.tableName}:`, error);
    }
  }

  results.reportStatus = results.assetsWithAlerts > 0 ? 'Risky' : 'Healthy';
  return results;
}

// ---------------------------------------------------------------------------
// Fallback: search ADOC by the asset name that was scraped from the DOM.
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
      // Search for asset in ADOC by name
      const searchResult = await apiClient.searchAssets(asset.name, asset.type);

      if (searchResult && searchResult.assets && searchResult.assets.length > 0) {
        const adocAsset = searchResult.assets[0];

        const reliabilityData = await apiClient.getReliabilityScore(adocAsset.id);
        const alertsData = await apiClient.getAlerts([adocAsset.id]);

        const openAlerts = alertsData?.alerts?.filter(a => a.status === 'OPEN').length || 0;
        const upstreamIssues = await getUpstreamIssues(adocAsset.id);

        const assetResult = {
          name: asset.name,
          type: asset.type || 'TABLE',
          reliabilityScore: reliabilityData?.overallScore || 0,
          dataFreshness: reliabilityData?.scoreBreakdown?.timeliness
            ? `${reliabilityData.scoreBreakdown.timeliness}%`
            : '100%',
          lastProfiled: reliabilityData?.lastEvaluated
            ? formatDate(reliabilityData.lastEvaluated)
            : formatDate(new Date()),
          openAlerts: openAlerts,
          upstreamIssues: upstreamIssues,
          adocLink: `https://indiumtech.acceldata.app/assets/${adocAsset.id}`
        };

        results.assets.push(assetResult);

        if (openAlerts > 0) {
          results.assetsWithAlerts++;
        }
      } else {
        // Asset not found in ADOC
        results.assets.push({
          name: asset.name,
          type: asset.type || 'TABLE',
          reliabilityScore: 0,
          dataFreshness: 'N/A',
          lastProfiled: 'Not profiled',
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

// Get upstream issues count
async function getUpstreamIssues(assetId) {
  try {
    const lineageData = await apiClient.getLineage(assetId, 'UPSTREAM', 1);

    if (!lineageData || !lineageData.lineage || !lineageData.lineage.upstream) {
      return 0;
    }

    return lineageData.lineage.upstream.filter(u => u.hasAlerts).length;
  } catch (error) {
    console.error('Error getting upstream issues:', error);
    return 0;
  }
}

// Format date for display
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

// Test ADOC connection
async function testAdocConnection() {
  try {
    await apiClient.searchAssets('test', 'TABLE');
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Installation handler
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

// Handle tab updates to detect Power BI pages
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
