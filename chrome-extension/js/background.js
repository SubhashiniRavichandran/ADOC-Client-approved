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
    handleFetchReliabilityData(request.assets)
      .then(results => sendResponse({ results }))
      .catch(error => {
        console.error('Error fetching reliability data:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'openAdocPlatform') {
    chrome.tabs.create({ url: 'https://indiumtech.acceldata.app/' });
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

// Fetch reliability data for given assets
async function handleFetchReliabilityData(assets) {
  const results = {
    reportStatus: 'Healthy',
    totalAssets: assets.length,
    assetsWithAlerts: 0,
    assets: []
  };

  // Process each asset
  for (const asset of assets) {
    try {
      // Search for asset in ADOC
      const searchResult = await apiClient.searchAssets(asset.name, asset.type);

      if (searchResult && searchResult.assets && searchResult.assets.length > 0) {
        const adocAsset = searchResult.assets[0];

        // Get reliability score
        const reliabilityData = await apiClient.getReliabilityScore(adocAsset.id);

        // Get alerts
        const alertsData = await apiClient.getAlerts([adocAsset.id]);

        // Calculate metrics
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
        // Asset not found in ADOC - add with unknown status
        results.assets.push({
          name: asset.name,
          type: asset.type || 'TABLE',
          reliabilityScore: 0,
          dataFreshness: 'N/A',
          lastProfiled: 'Not profiled',
          openAlerts: 0,
          upstreamIssues: 0,
          adocLink: 'https://indiumtech.acceldata.app/'
        });
      }
    } catch (error) {
      console.error(`Error processing asset ${asset.name}:`, error);
    }
  }

  // Determine overall report status
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

    // Count upstream assets with alerts
    const upstreamWithAlerts = lineageData.lineage.upstream.filter(u => u.hasAlerts);
    return upstreamWithAlerts.length;
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
    // Try to make a simple API call
    const result = await apiClient.searchAssets('test', 'TABLE');
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ADOC Reliability Metrics extension installed');

    // Open welcome page or options page
    chrome.tabs.create({
      url: 'https://indiumtech.acceldata.app/'
    });
  } else if (details.reason === 'update') {
    console.log('ADOC Reliability Metrics extension updated');
  }
});

// Handle tab updates to detect Power BI pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('app.powerbi.com') || tab.url.includes('msit.powerbi.com')) {
      // Inject badge to indicate extension is active
      chrome.action.setBadgeText({ text: '✓', tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId: tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  }
});
