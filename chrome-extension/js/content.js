// ADOC Reliability Metrics - Content Script for Power BI

class PowerBIContextDetector {
  constructor() {
    this.currentContext = null;
    this.observer = null;
    this.intervalId = null;   // stored so we can clear it
    this.debounceTimer = null; // MutationObserver debounce
  }

  // Detect current Power BI context from URL
  detectContext() {
    try {
      const url = window.location.href;
      const reportPattern = /\/groups\/([^/]+)\/reports\/([^/]+)/;
      const dashboardPattern = /\/groups\/([^/]+)\/dashboards\/([^/]+)/;

      let match = url.match(reportPattern);
      if (match) {
        return { type: 'REPORT', workspaceId: match[1], reportId: match[2], toolType: 'POWERBI' };
      }

      match = url.match(dashboardPattern);
      if (match) {
        return { type: 'DASHBOARD', workspaceId: match[1], dashboardId: match[2], toolType: 'POWERBI' };
      }
    } catch (e) {
      console.error('[ADOC] detectContext error:', e);
    }
    return null;
  }

  // Extract data asset names from the Power BI DOM.
  // Returns an empty array when nothing is found — never returns fake data.
  extractAssets() {
    const assets = [];
    const seenNorm = new Set(); // lowercase-normalised names for deduplication

    const addAsset = (name, type, columns = []) => {
      if (!name) return;
      const norm = name.toLowerCase().trim();
      if (!norm || seenNorm.has(norm)) return;
      if (this.isUIElement(name)) return;
      if (name.length <= 2 || name.length >= 100) return;
      seenNorm.add(norm);
      assets.push({ name: name.trim(), type, columns });
    };

    try {
      // Method 1: Visual titles / aria-labels — look for "Table.Column" patterns
      document.querySelectorAll('[class*="visual"]').forEach(container => {
        container.querySelectorAll('[title], [aria-label]').forEach(element => {
          const title = element.getAttribute('title') || element.getAttribute('aria-label');
          if (!title) return;

          const parts = title.split('.');
          if (parts.length >= 2) {
            const tableName = parts[0].trim();
            const columnName = parts[1].trim();
            const normTable = tableName.toLowerCase();

            if (tableName && !seenNorm.has(normTable) && !this.isUIElement(tableName)) {
              seenNorm.add(normTable);
              assets.push({ name: tableName, type: 'TABLE', columns: [columnName].filter(Boolean) });
            } else {
              // Append column to existing table entry
              const existing = assets.find(a => a.name.toLowerCase() === normTable);
              if (existing && columnName && !existing.columns.includes(columnName)) {
                existing.columns.push(columnName);
              }
            }
          } else {
            addAsset(title, 'TABLE');
          }
        });
      });

      // Method 2: Field list panel (when visible)
      document.querySelectorAll('[class*="fieldList"] [class*="item"]').forEach(item => {
        addAsset(item.textContent?.trim(), 'TABLE');
      });

      // Method 3: Semantic model / dataset references
      document.querySelectorAll('[class*="dataset"], [class*="model"]').forEach(element => {
        addAsset(element.textContent?.trim(), 'SEMANTIC_MODEL');
      });

    } catch (error) {
      console.error('[ADOC] Error extracting assets:', error);
    }

    console.log(`[ADOC] Extracted ${assets.length} assets from Power BI`);
    return assets; // Empty array means "nothing found" — caller decides how to handle
  }

  // Returns true if the text looks like a UI control label, not a data asset name
  isUIElement(text) {
    const UI_KEYWORDS = new Set([
      'search', 'filter', 'sort', 'expand', 'collapse', 'menu', 'close', 'open',
      'edit', 'delete', 'add', 'remove', 'save', 'cancel', 'ok', 'yes', 'no',
      'settings', 'options', 'help', 'about', 'export', 'import', 'refresh',
      'show', 'hide', 'view', 'select', 'clear', 'reset', 'apply'
    ]);
    const lower = text.toLowerCase().trim();
    return UI_KEYWORDS.has(lower) ||
      [...UI_KEYWORDS].some(k => lower.startsWith(k + ' ') || lower.startsWith(k + ','));
  }

  // Monitor for SPA navigation changes and DOM mutations
  startMonitoring(callback) {
    let lastUrl = window.location.href;

    // Poll for URL changes (SPA navigation doesn't fire load events)
    this.intervalId = setInterval(() => {
      const current = window.location.href;
      if (lastUrl !== current) {
        lastUrl = current;
        const newContext = this.detectContext();
        if (JSON.stringify(newContext) !== JSON.stringify(this.currentContext)) {
          this.currentContext = newContext;
          callback(newContext);
        }
      }
    }, 1000);

    // Debounced MutationObserver — prevents hundreds of calls/sec on large DOMs
    this.observer = new MutationObserver(() => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        const newContext = this.detectContext();
        if (JSON.stringify(newContext) !== JSON.stringify(this.currentContext)) {
          this.currentContext = newContext;
          callback(newContext);
        }
      }, 300);
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  // Clean up all timers and observers to prevent memory leaks
  stopMonitoring() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    clearTimeout(this.debounceTimer);
    this.debounceTimer = null;
  }
}

const detector = new PowerBIContextDetector();

// Listen for messages from popup / background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || typeof request.action !== 'string') return;

  if (request.action === 'extractAssets') {
    const context = detector.detectContext();
    const assets = detector.extractAssets();
    sendResponse({ context, assets });
    return true;
  }

  if (request.action === 'getContext') {
    sendResponse({ context: detector.detectContext() });
    return true;
  }
});

// Start monitoring for context changes (SPA navigation)
detector.startMonitoring((newContext) => {
  if (newContext) {
    chrome.runtime.sendMessage({ action: 'contextChanged', context: newContext }).catch(() => {});
  }
});

// Report initial context to background
const initialContext = detector.detectContext();
if (initialContext) {
  console.log('[ADOC] Power BI context detected:', initialContext);
}

chrome.runtime.sendMessage({ action: 'contentScriptReady', context: initialContext }).catch(() => {});
