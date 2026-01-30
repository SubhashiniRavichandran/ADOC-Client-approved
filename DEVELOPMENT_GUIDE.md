# ADOC Chrome Extension - Development Guide

## Project Structure

```
chrome-extension/
├── manifest.json              # Extension configuration (Manifest V3)
├── html/
│   ├── popup.html            # Main popup interface (320x749px)
│   └── options.html          # Settings page
├── css/
│   ├── popup.css             # Popup styling
│   └── sidebar.css           # Sidebar styling
├── js/
│   ├── popup.js              # Popup logic + mock data (DEMO)
│   ├── encryption.js         # AES-256 encryption service
│   ├── background.js         # Service worker + API client
│   ├── content.js            # Power BI page injection
│   └── options.js            # Settings page logic
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md                 # Documentation
```

---

## Technology Stack

### Core Technologies
- **Platform:** Chrome Extension Manifest V3
- **Languages:** JavaScript (ES6+), HTML5, CSS3
- **Architecture:** MVC pattern
- **Storage:** chrome.storage.local (encrypted)
- **Encryption:** Web Crypto API (AES-256-GCM)

### Key APIs Used
- Chrome Extension APIs (storage, tabs, runtime, action)
- Web Crypto API (encryption)
- Fetch API (HTTP requests)
- DOM APIs (content scripts)

---

## Setup Development Environment

### Prerequisites

```bash
# Required
- Google Chrome (v90+)
- Code editor (VS Code recommended)
- Git

# Optional
- Node.js (for build tools)
- Python (for icon generation)
```

### Clone & Setup

```bash
# Clone repository
git clone <repository-url>
cd ADOC-Client-approved

# Navigate to extension
cd chrome-extension

# No build step required - pure JavaScript
```

### Load Extension in Chrome

```bash
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select chrome-extension/ folder
5. Extension appears in toolbar
```

### Development Tools

```bash
# Inspect popup
Right-click extension icon → Inspect popup

# View service worker logs
chrome://extensions/ → Extension → Service worker → Inspect

# Debug content scripts
F12 on Power BI page → Console
```

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────┐
│         Popup UI (popup.js)             │
│  - View management                      │
│  - Mock data scenarios (DEMO)           │
│  - User interactions                    │
└──────────────┬──────────────────────────┘
               │
               ├──────────────────────────┐
               │                          │
               ▼                          ▼
┌──────────────────────┐    ┌──────────────────────┐
│ Encryption Service   │    │ Background Worker    │
│ (encryption.js)      │    │ (background.js)      │
│  - AES-256-GCM       │    │  - API client        │
│  - PBKDF2 KDF        │    │  - Auth monitoring   │
│  - Secure storage    │    │  - Message handler   │
└──────────────────────┘    └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │   ADOC REST API      │
                            │  (indiumtech...)     │
                            └──────────────────────┘
```

### Data Flow

```
User Action → Popup → Background → ADOC API → Background → Popup → Display
```

---

## Key Files Explained

### 1. manifest.json

**Purpose:** Extension configuration

```json
{
  "manifest_version": 3,
  "name": "ADOC Reliability Metrics",
  "version": "1.1.0",
  "permissions": [
    "storage",      // chrome.storage API
    "tabs",         // Tab management
    "notifications" // Desktop notifications
  ],
  "host_permissions": [
    "https://indiumtech.acceldata.app/*",
    "https://*.powerbi.com/*"
  ],
  "background": {
    "service_worker": "js/background.js"
  },
  "action": {
    "default_popup": "html/popup.html"
  }
}
```

**Key Points:**
- Manifest V3 (latest standard)
- Service worker (not background page)
- Minimal permissions for security

---

### 2. popup.js

**Purpose:** Main UI controller + Mock data (DEMO)

**Class Structure:**
```javascript
class PopupController {
  constructor() {
    this.encryption = encryptionService;
    this.mockDataScenarios = this.generateMockScenarios();
  }

  // Mock data generation (DEMO only)
  generateMockScenarios() { ... }
  getRandomScenario() { ... }

  // View management
  showView(viewName) { ... }

  // Authentication
  async checkAuthStatus() { ... }
  async handleLogin() { ... }
  async handleLogout() { ... }

  // Data fetching
  async autoFetchData() { ... }

  // Display
  displayResults(results) { ... }
  createAssetCard(asset, index) { ... }
  getBadgeIcon(index) { ... }
}
```

**Key Functions:**
- `generateMockScenarios()` - Creates 3 demo scenarios (DEMO only)
- `getRandomScenario()` - Selects random scenario (DEMO only)
- `autoFetchData()` - Fetches and displays data
- `createAssetCard()` - Builds asset card HTML with badges

---

### 3. encryption.js

**Purpose:** AES-256-GCM encryption service

**Class Structure:**
```javascript
class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }

  async generateKey(password) {
    // PBKDF2 with 100,000 iterations
  }

  async encrypt(plaintext, password) {
    // Returns: { ciphertext, iv, salt }
  }

  async decrypt(encryptedData, password) {
    // Returns: plaintext
  }

  async secureStore(key, value, password) {
    // Encrypts and stores in chrome.storage
  }

  async secureRetrieve(key, password) {
    // Retrieves and decrypts from chrome.storage
  }

  async secureRemove(key) {
    // Removes from chrome.storage
  }
}
```

**Security Features:**
- AES-256-GCM authenticated encryption
- Random IV per encryption
- PBKDF2 with 100,000 iterations
- Base64 encoding for storage

---

### 4. background.js

**Purpose:** Service worker + API client

**Key Components:**
```javascript
// API Client
class AdocApiClient {
  async makeRequest(endpoint, options) { ... }
  async searchAssets(query, assetType) { ... }
  async getReliabilityScore(assetId) { ... }
  async getAlerts(assetIds, status) { ... }
  async getLineage(assetId, direction, depth) { ... }
}

// Message Handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchReliabilityData') { ... }
  if (request.action === 'startAuthMonitoring') { ... }
  if (request.action === 'testConnection') { ... }
});

// Authentication Monitoring
function startAuthenticationMonitoring(loginUrl) {
  // Opens login tab
  // Monitors URL changes
  // Detects successful login
  // Stores encrypted auth data
  // Shows notification
}
```

---

### 5. popup.css

**Purpose:** Styling for popup interface

**Key Sections:**
```css
/* Layout */
body { width: 320px; height: 749px; }

/* Views */
.view { display: flex; flex-direction: column; }
.view.hidden { display: none; }

/* Asset Cards */
.asset-card { border: 1px solid #e5e7eb; padding: 12px; }
.asset-badge { width: 24px; height: 24px; border-radius: 4px; }
.asset-badge.badge-cyan { background: #cffafe; color: #06b6d4; }
.asset-badge.badge-red { background: #fee2e2; color: #ef4444; }
.asset-badge.badge-blue { background: #dbeafe; color: #3b82f6; }

/* Badges */
.badge-healthy { background: #d1fae5; color: #065f46; }
.badge-risky { background: #fef3c7; color: #d97706; }

/* Scores */
.metric-value.score-high { background: #d1fae5; color: #065f46; }
.metric-value.score-medium { background: #fef3c7; color: #92400e; }
.metric-value.score-low { background: #fee2e2; color: #991b1b; }
```

---

## Demo Mode vs Production

### Current: Demo Mode

**popup.js changes:**
```javascript
// DEMO: Uses mock data
async autoFetchData() {
  this.showView('fetching');
  await new Promise(resolve => setTimeout(resolve, 1500));

  const scenario = this.getRandomScenario(); // Random selection

  if (scenario === 'noAssets') {
    this.showView('no-assets');
    return;
  }

  const results = this.mockDataScenarios[scenario]; // Mock data
  await this.encryption.secureStore('cached_results', results);
  this.displayResults(results);
  this.showView('results');
}
```

### Production Mode

**popup.js changes needed:**
```javascript
// PRODUCTION: Uses real API
async autoFetchData() {
  this.showView('fetching');

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  if (!currentTab.url.includes('powerbi.com')) {
    this.showError('Please open a Power BI report');
    this.showView('no-assets');
    return;
  }

  // Extract Power BI assets from page
  chrome.tabs.sendMessage(currentTab.id, { action: 'extractAssets' }, async (response) => {
    if (response?.assets?.length > 0) {
      // Fetch from ADOC API via background
      const results = await this.fetchReliabilityData(response.assets);

      if (results.totalAssets === 0) {
        this.showView('no-assets');
        return;
      }

      await this.encryption.secureStore('cached_results', results);
      this.displayResults(results);
      this.showView('results');
    } else {
      this.showView('no-assets');
    }
  });
}
```

**Key Differences:**
| Feature | Demo | Production |
|---------|------|------------|
| Data source | `mockDataScenarios` | ADOC API |
| Scenarios | Random 3 types | Real data quality |
| Asset detection | Skipped | Power BI extraction |
| Delay | 1.5s fixed | API response time |
| Caching | Mock results | Real results |

---

## Development Workflows

### Adding New Feature

```bash
1. Create feature branch
   git checkout -b feature/new-feature

2. Make changes
   - Update relevant JS files
   - Update CSS if UI changes
   - Test in Chrome

3. Reload extension
   chrome://extensions/ → Reload

4. Test thoroughly
   - All three scenarios
   - Login/logout flow
   - Error cases

5. Commit and push
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
```

### Debugging

**Popup debugging:**
```javascript
// Add console logs
console.log('Current view:', this.currentView);
console.log('Auth status:', await this.checkAuthStatus());

// Right-click extension icon → Inspect popup
// Console tab shows all logs
```

**Background debugging:**
```javascript
// Add console logs in background.js
console.log('API request:', endpoint, options);

// chrome://extensions/ → Service worker → Inspect
// Console tab shows background logs
```

**Content script debugging:**
```javascript
// Add console logs in content.js
console.log('Power BI assets found:', assets);

// F12 on Power BI page
// Console tab shows content script logs
```

### Testing

**Manual testing checklist:**
```
□ Install fresh
□ Login works
□ Auto-fetch after login
□ All 3 scenarios display correctly
□ Refresh works (shows different scenario in demo)
□ Logout clears data
□ Re-login works
□ Asset cards render properly
□ Copy buttons work
□ Link icons clickable
□ Encryption/decryption works
□ No console errors
```

---

## Code Style Guide

### JavaScript

```javascript
// Use ES6+ features
const results = await this.fetchData();

// Use arrow functions
assets.forEach(asset => {
  const card = this.createAssetCard(asset);
});

// Use async/await (not .then)
async myFunction() {
  const data = await this.getData();
  return data;
}

// Use template literals
const html = `
  <div class="asset-name">${asset.name}</div>
`;

// Use optional chaining
const value = data?.nested?.property || 'default';

// Classes for organization
class MyController {
  constructor() { ... }
  async myMethod() { ... }
}
```

### CSS

```css
/* Use semantic class names */
.asset-card { }
.asset-header { }
.asset-badge { }

/* Use BEM for complex components */
.card__title { }
.card__title--active { }

/* Use CSS variables for colors */
:root {
  --color-primary: #0ea5e9;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
}

/* Mobile-first (not needed for fixed 320px) */
.element { width: 100%; }
```

### HTML

```html
<!-- Use semantic HTML5 -->
<section id="results-view">
  <header class="header">...</header>
  <main class="content">...</main>
</section>

<!-- Use data attributes for JS hooks -->
<button data-action="logout">Logout</button>

<!-- Use aria attributes for accessibility -->
<button aria-label="Refresh data">🔄</button>
```

---

## Security Best Practices

### Input Validation
```javascript
// Validate all user inputs
function validateAssetName(name) {
  if (typeof name !== 'string') return false;
  if (name.length === 0 || name.length > 255) return false;
  return true;
}
```

### API Security
```javascript
// Always use HTTPS
const baseUrl = 'https://indiumtech.acceldata.app';

// Validate responses
if (!response.ok) {
  throw new Error(`API Error: ${response.status}`);
}

// Sanitize output
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
```

### Storage Security
```javascript
// Always encrypt sensitive data
await this.encryption.secureStore('adoc_auth', authData);

// Clear on logout
chrome.storage.local.clear();
```

---

## Performance Optimization

### Lazy Loading
```javascript
// Load encryption service only when needed
const encryption = await import('./encryption.js');
```

### Caching
```javascript
// Cache results to reduce API calls
const cached = await this.encryption.secureRetrieve('cached_results');
if (cached && Date.now() - cached.timestamp < 300000) {
  return cached.data; // Use cache if less than 5 min old
}
```

### Debouncing
```javascript
// Debounce search inputs
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};
```

---

## Common Issues & Solutions

### Issue: Extension not loading
**Solution:** Check manifest.json syntax, ensure all files exist

### Issue: Popup opens then closes
**Solution:** Check console for errors in popup.js

### Issue: Service worker crashes
**Solution:** Reduce memory usage, check for infinite loops

### Issue: CORS errors
**Solution:** Add domain to host_permissions in manifest

### Issue: Storage quota exceeded
**Solution:** Clear old cached data periodically

---

## Building for Production

### Remove Demo Code

```javascript
// In popup.js, remove:
generateMockScenarios() { ... } // DELETE
getRandomScenario() { ... }     // DELETE

// Replace autoFetchData() with production version
// (See "Production Mode" section above)
```

### Update Manifest

```json
{
  "name": "ADOC Reliability Metrics",
  "version": "1.2.0",  // Increment version
  "description": "Real-time data reliability insights for Power BI"
}
```

### Test Thoroughly

```bash
# Test all scenarios with real data
- Login with real ADOC account
- Open real Power BI reports
- Verify asset detection works
- Verify API calls succeed
- Check error handling
- Test with various datasets
```

### Create Production Build

```bash
# Clean build directory
rm -rf build/
mkdir build/

# Copy files (excluding dev files)
cp -r chrome-extension/* build/
rm build/**/*.backup
rm build/**/*.map

# Zip for distribution
cd build
zip -r ADOC-Extension-v1.2.0-Production.zip *
```

---

## Resources

### Chrome Extension Docs
- https://developer.chrome.com/docs/extensions/mv3/
- https://developer.chrome.com/docs/extensions/reference/

### Web Crypto API
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

### ADOC API
- Internal documentation in ADOC platform
- Contact: api-support@acceldata.io

---

## Contributing

### Pull Request Process

```bash
1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Commit with clear message
6. Push to fork
7. Create pull request
8. Wait for review
```

### Code Review Checklist

```
□ Code follows style guide
□ No console.logs in production code
□ All functions documented
□ Security best practices followed
□ Performance considered
□ Tested manually
□ No breaking changes (or documented)
□ Version incremented if needed
```

---

**Version:** 1.1.0 Demo
**Last Updated:** January 2026
**Questions?** dev-team@acceldata.io
