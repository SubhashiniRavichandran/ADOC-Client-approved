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

  // Extract the Power BI report name from the DOM.
  // Tries document.title first, then falls back to CSS selectors.
  getPowerBIReportName() {
    if (document.title && document.title.includes('Power BI')) {
      return document.title.replace(' - Power BI', '').trim();
    }
    const selectors = [
      '[data-testid="report-name"]',
      '.logoBarContent h1',
      '.headerText',
      '.logoBarContent .textWithEllipsis',
      '.reportHeader .title'
    ];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && el.innerText && el.innerText.trim()) {
        return el.innerText.trim();
      }
    }
    return null;
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
    const reportName = detector.getPowerBIReportName();
    console.log(`[ADOC] Report name extracted: "${reportName}"`);
    sendResponse({ context, reportName });
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
