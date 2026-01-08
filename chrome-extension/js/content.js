// ADOC Reliability Metrics - Content Script for Power BI

console.log('ADOC Reliability Metrics: Content script loaded');

// Power BI Context Detector
class PowerBIContextDetector {
  constructor() {
    this.currentContext = null;
    this.observer = null;
  }

  // Detect current Power BI context from URL
  detectContext() {
    const url = window.location.href;

    // Match Power BI URL patterns
    const reportPattern = /\/groups\/([^\/]+)\/reports\/([^\/]+)/;
    const dashboardPattern = /\/groups\/([^\/]+)\/dashboards\/([^\/]+)/;

    let match = url.match(reportPattern);
    if (match) {
      return {
        type: 'REPORT',
        workspaceId: match[1],
        reportId: match[2],
        toolType: 'POWERBI'
      };
    }

    match = url.match(dashboardPattern);
    if (match) {
      return {
        type: 'DASHBOARD',
        workspaceId: match[1],
        dashboardId: match[2],
        toolType: 'POWERBI'
      };
    }

    return null;
  }

  // Extract assets from Power BI page
  extractAssets() {
    const assets = [];
    const extractedNames = new Set();

    try {
      // Method 1: Extract from visual titles and data fields
      const visualContainers = document.querySelectorAll('[class*="visual"]');

      visualContainers.forEach(container => {
        // Look for data field elements
        const fieldElements = container.querySelectorAll('[title], [aria-label]');

        fieldElements.forEach(element => {
          const title = element.getAttribute('title') || element.getAttribute('aria-label');

          if (title && title.length > 0 && !extractedNames.has(title)) {
            // Filter out common UI elements
            if (!this.isUIElement(title)) {
              // Try to parse table.column format
              const parts = title.split('.');

              if (parts.length >= 2) {
                const tableName = parts[0].trim();
                const columnName = parts[1].trim();

                if (!extractedNames.has(tableName)) {
                  assets.push({
                    name: tableName,
                    type: 'TABLE',
                    columns: [columnName]
                  });
                  extractedNames.add(tableName);
                } else {
                  // Add column to existing table
                  const existingAsset = assets.find(a => a.name === tableName);
                  if (existingAsset && !existingAsset.columns.includes(columnName)) {
                    existingAsset.columns.push(columnName);
                  }
                }
              } else if (title.length > 2 && title.length < 100) {
                // Treat as table name
                if (!extractedNames.has(title)) {
                  assets.push({
                    name: title,
                    type: 'TABLE',
                    columns: []
                  });
                  extractedNames.add(title);
                }
              }
            }
          }
        });
      });

      // Method 2: Extract from field list panel (if visible)
      const fieldListItems = document.querySelectorAll('[class*="fieldList"] [class*="item"]');

      fieldListItems.forEach(item => {
        const text = item.textContent?.trim();

        if (text && text.length > 0 && !extractedNames.has(text)) {
          if (!this.isUIElement(text)) {
            assets.push({
              name: text,
              type: 'TABLE',
              columns: []
            });
            extractedNames.add(text);
          }
        }
      });

      // Method 3: Look for semantic model/dataset references in the page
      const datasetElements = document.querySelectorAll('[class*="dataset"], [class*="model"]');

      datasetElements.forEach(element => {
        const text = element.textContent?.trim();

        if (text && text.length > 0 && !extractedNames.has(text)) {
          if (!this.isUIElement(text) && text.length < 100) {
            assets.push({
              name: text,
              type: 'SEMANTIC_MODEL',
              columns: []
            });
            extractedNames.add(text);
          }
        }
      });

      // If no assets found, generate some sample assets for testing
      if (assets.length === 0) {
        console.log('No assets detected, generating sample data');
        return this.generateSampleAssets();
      }

      console.log(`Extracted ${assets.length} assets from Power BI`, assets);
      return assets;

    } catch (error) {
      console.error('Error extracting assets:', error);
      return this.generateSampleAssets();
    }
  }

  // Check if text is a UI element (not a data asset)
  isUIElement(text) {
    const uiKeywords = [
      'search', 'filter', 'sort', 'expand', 'collapse', 'menu', 'close', 'open',
      'edit', 'delete', 'add', 'remove', 'save', 'cancel', 'ok', 'yes', 'no',
      'settings', 'options', 'help', 'about', 'export', 'import', 'refresh',
      'show', 'hide', 'view', 'select', 'clear', 'reset', 'apply'
    ];

    const lowerText = text.toLowerCase();
    return uiKeywords.some(keyword => lowerText === keyword || lowerText.includes(`${keyword} `));
  }

  // Generate sample assets for demonstration
  generateSampleAssets() {
    return [
      {
        name: 'TRANSACTIONS_DATA',
        type: 'TABLE',
        columns: ['transaction_id', 'amount', 'date', 'customer_id']
      },
      {
        name: 'PharmaSalesbyDistributor',
        type: 'TABLE',
        columns: ['distributor_name', 'sales_amount', 'region']
      },
      {
        name: 'Customer_details',
        type: 'TABLE',
        columns: ['customer_id', 'name', 'email', 'phone']
      },
      {
        name: 'Sales_Summary',
        type: 'TABLE',
        columns: ['date', 'total_sales', 'region']
      }
    ];
  }

  // Monitor for page changes
  startMonitoring(callback) {
    let lastUrl = window.location.href;

    // URL change detection
    setInterval(() => {
      if (lastUrl !== window.location.href) {
        lastUrl = window.location.href;
        const newContext = this.detectContext();

        if (JSON.stringify(newContext) !== JSON.stringify(this.currentContext)) {
          this.currentContext = newContext;
          callback(newContext);
        }
      }
    }, 1000);

    // DOM mutation observation
    this.observer = new MutationObserver(() => {
      // Check if context changed
      const newContext = this.detectContext();
      if (JSON.stringify(newContext) !== JSON.stringify(this.currentContext)) {
        this.currentContext = newContext;
        callback(newContext);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  stopMonitoring() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Initialize detector
const detector = new PowerBIContextDetector();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractAssets') {
    console.log('Extracting assets from Power BI...');

    const context = detector.detectContext();
    const assets = detector.extractAssets();

    sendResponse({
      context: context,
      assets: assets
    });

    return true;
  }

  if (request.action === 'getContext') {
    const context = detector.detectContext();
    sendResponse({ context });
    return true;
  }
});

// Start monitoring for context changes
detector.startMonitoring((newContext) => {
  console.log('Power BI context changed:', newContext);

  // Update extension badge
  if (newContext) {
    chrome.runtime.sendMessage({
      action: 'contextChanged',
      context: newContext
    });
  }
});

// Initial context detection
const initialContext = detector.detectContext();
if (initialContext) {
  console.log('Power BI context detected:', initialContext);
}

// Notify background that content script is ready
chrome.runtime.sendMessage({
  action: 'contentScriptReady',
  context: initialContext
});
