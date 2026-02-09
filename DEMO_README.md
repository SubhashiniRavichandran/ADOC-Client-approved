# 🎭 ADOC Chrome Extension - DEMO VERSION

## Overview

This is the **DEMO VERSION** of the ADOC Chrome Extension with **mock data** for demonstration purposes. It covers all three scenarios without requiring actual API calls to ADOC.

---

## 🎯 Demo Features

### ✅ Keeps Real Login Flow
- Users login to Acceldata (indiumtech.acceldata.app)
- After successful login, authentication is stored
- No actual API calls made to ADOC dashboard after login

### 🎲 Three Random Scenarios

When you click **"Fetch Again"** or **refresh**, the extension randomly displays one of three scenarios:

#### Scenario 1: **Healthy** (No Alerts) ✅
```
Report Status: Healthy
Total Assets fetched: 175
Assets with Alerts: 0

Message: "There are no assets with open alerts powering this report"
```

**Display:**
- Green checkmark icon
- Report status badge: "Healthy" (green)
- No asset cards shown
- Clean, minimal view

---

#### Scenario 2: **No Assets Found** ⚠️
```
Error: "We couldn't find the datasets powering this report in Acceldata"

Actions:
- Fetch Again button (tries another random scenario)
- Logout button
```

**Display:**
- Warning icon (orange)
- Error message
- Two action buttons
- No data shown

---

#### Scenario 3: **Risky** (With Alerts) 🔴
```
Report Status: Risky
Total Assets fetched: 175
Assets with Alerts: 25

Shows 8 sample assets with varying:
- Reliability scores (76.3% - 94.7%)
- Data freshness (95% - 100%)
- Open alerts (1-3 per asset)
- Upstream issues (0-5 per asset)
```

**Sample Assets Included:**
1. **TRANSACTIONS_DATA** - 92.12%, 2 alerts, 5 upstream issues
2. **PharmaSalesbyDistributor** - 92.12%, 1 alert, 0 upstream issues
3. **Customer_details** - 76.3%, 3 alerts, 2 upstream issues
4. **Sales_Summary** - 88.5%, 1 alert, 1 upstream issue
5. **Inventory_Master** - 94.7%, 2 alerts, 3 upstream issues
6. **Product_Catalog** - 82.1%, 1 alert, 0 upstream issues
7. **Order_Details** - 79.3%, 2 alerts, 4 upstream issues
8. **Shipping_Info** - 91.8%, 1 alert, 1 upstream issue

**Display:**
- Report status badge: "Risky" (red)
- Asset cards with:
  - Table icon
  - Asset name with copy button
  - Data Reliability Score (color-coded)
  - Data Freshness percentage
  - Last Profiled timestamp
  - Open Alerts with link icon
  - Upstream Issues with link icon
- Left border on cards (red) for visual emphasis

---

## 🚀 How to Use

### Installation

1. **Extract the demo zip:**
   ```bash
   unzip ADOC-Extension-DEMO-v1.1.0.zip
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

3. **Click the extension icon**

### Demo Flow

1. **Login Screen**
   - Click "Login to Acceldata"
   - Complete login at indiumtech.acceldata.app
   - Extension detects successful login
   - Notification appears

2. **Auto-Fetch**
   - Extension automatically fetches after login
   - Shows fetching screen for 1.5 seconds
   - Randomly selects one of three scenarios

3. **View Results**
   - **If Healthy:** See green status, 0 alerts
   - **If Risky:** See red status, asset cards with alerts
   - **If No Assets:** See error message

4. **Try Another Scenario**
   - Click **refresh icon** (top right)
   - Or click **"Fetch Again"** from error screen
   - Randomly gets another scenario

5. **Logout**
   - Click logout icon (top right)
   - Returns to login screen
   - All data cleared

---

## 🎨 Design Specifications

### Dimensions
- Width: **320px**
- Height: **749px**
- Header height: **48px**

### Color Scheme
- **Healthy badge:** `#d1fae5` background, `#065f46` text
- **Risky badge:** `#fee2e2` background, `#991b1b` text
- **Logo color:** `#1e3a8a` (dark blue)
- **Primary blue:** `#0ea5e9`

### Typography
- Font: System fonts (San Francisco, Segoe UI, Roboto)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Icons
- Table icon for dataset assets
- Shield icon for no alerts
- Warning icon for errors
- External link icons for ADOC links

---

## 🔐 Security Features

Even in demo mode, the extension maintains:
- **AES-256-GCM encryption** for stored credentials
- **PBKDF2 key derivation** (100,000 iterations)
- **Secure storage** via chrome.storage.local
- **Encrypted caching** of results
- **Secure logout** with data cleanup

---

## 📊 Mock Data Details

### Reliability Scores
- **High (90%+):** Green color - `#10b981`
- **Medium (70-89%):** Orange color - `#f59e0b`
- **Low (<70%):** Red color - `#ef4444`

### Sample Dates
- Last Profiled dates range from Feb 2024 - Jun 2024
- Realistic timestamps included (10:15 AM, 14:24 PM, etc.)

### Alert Distribution
- Total assets: Always 175
- Assets with alerts in Risky scenario: 25
- Open alerts per asset: 1-3
- Upstream issues: 0-5

---

## 🔄 Differences from Production Version

| Feature | Demo Version | Production Version |
|---------|--------------|-------------------|
| Login | Real ADOC login | Real ADOC login |
| API Calls | Mock data | Actual ADOC API |
| Scenarios | Random 3 scenarios | Real Power BI data |
| Data Source | Hardcoded samples | Live ADOC platform |
| Fetch Again | New random scenario | Re-fetches real data |
| Asset Detection | Not checked | Detects Power BI assets |

---

## 🎬 Demo Scenarios Visualization

```
┌─────────────┐
│   LOGIN     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  FETCHING   │ (1.5s delay)
└──────┬──────┘
       │
       ├─────────────┬─────────────┐
       │             │             │
       ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ HEALTHY  │  │  RISKY   │  │NO ASSETS │
│  (33%)   │  │  (33%)   │  │  (33%)   │
└──────────┘  └──────────┘  └──────────┘
       │             │             │
       │             │             ▼
       │             │        ┌──────────┐
       │             │        │  FETCH   │
       │             │        │  AGAIN   │
       │             │        └──────────┘
       │             │             │
       └─────────────┴─────────────┘
                     │
                     ▼
              ┌──────────┐
              │  LOGOUT  │
              └──────────┘
                     │
                     ▼
              ┌──────────┐
              │  LOGIN   │
              └──────────┘
```

---

## 📦 Files Included

```
chrome-extension/
├── manifest.json              # Extension configuration
├── html/
│   ├── popup.html            # Main popup UI
│   └── options.html          # Settings page
├── css/
│   ├── popup.css             # Popup styling
│   └── sidebar.css           # Sidebar styling
├── js/
│   ├── popup.js              # ⭐ DEMO VERSION with mock data
│   ├── encryption.js         # AES-256 encryption service
│   ├── background.js         # Background service worker
│   ├── content.js            # Content script
│   └── options.js            # Options page logic
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md                 # Documentation
```

---

## 🧪 Testing Checklist

- [ ] **Login Flow:**
  - [ ] Click "Login to Acceldata"
  - [ ] Complete login successfully
  - [ ] See success notification
  - [ ] Extension auto-fetches

- [ ] **Scenario 1 - Healthy:**
  - [ ] Green "Healthy" badge
  - [ ] Shows 175 total assets
  - [ ] Shows 0 assets with alerts
  - [ ] Displays checkmark icon
  - [ ] Message: "No assets with open alerts"

- [ ] **Scenario 2 - No Assets:**
  - [ ] Warning icon displayed
  - [ ] Error message shown
  - [ ] "Fetch Again" button works
  - [ ] "Logout" button works

- [ ] **Scenario 3 - Risky:**
  - [ ] Red "Risky" badge
  - [ ] Shows 175 total assets
  - [ ] Shows 25 assets with alerts
  - [ ] Displays 8 asset cards
  - [ ] Each card shows:
    - [ ] Asset name with copy button
    - [ ] Reliability score (color-coded)
    - [ ] Data freshness
    - [ ] Last profiled date
    - [ ] Open alerts count with link
    - [ ] Upstream issues count with link
  - [ ] Red left border on cards

- [ ] **Refresh:**
  - [ ] Click refresh icon
  - [ ] Gets random new scenario
  - [ ] Smooth animation

- [ ] **Logout:**
  - [ ] Click logout icon
  - [ ] Returns to login screen
  - [ ] Storage cleared
  - [ ] Can login again

---

## 🎓 Use Cases

This demo version is perfect for:

1. **Sales Presentations** - Show potential clients all scenarios
2. **Training Sessions** - Demonstrate features without setup
3. **User Testing** - Gather feedback on UI/UX
4. **Development Testing** - Test frontend without backend
5. **Marketing Materials** - Create screenshots and videos

---

## 🔧 Converting to Production

To convert this demo to production version:

1. **Restore Real API Calls:**
   - Replace `autoFetchData()` in `popup.js`
   - Remove mock data scenarios
   - Re-enable Power BI asset detection
   - Use background.js API client

2. **Update Comments:**
   - Remove "DEMO VERSION" header comments
   - Update documentation

3. **Test with Real Data:**
   - Connect to actual ADOC API
   - Verify Power BI integration
   - Test with real assets

---

## 📞 Support

For questions or issues:
- **Repository:** ADOC-Client-approved
- **Branch:** `claude/chrome-extension-powerbi-sidebar-lbFbO`
- **Documentation:** See `chrome-extension/README.md`

---

## ✨ Demo Version Benefits

✅ **No API setup required**
✅ **Works offline**
✅ **Consistent results for demos**
✅ **Covers all scenarios**
✅ **Fast testing**
✅ **Perfect for presentations**

**Ready for your demo!** 🎉

Extract the zip and load it in Chrome to start demonstrating all three scenarios.
