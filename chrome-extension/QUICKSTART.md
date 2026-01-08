# Quick Start Guide - ADOC Reliability Metrics Chrome Extension

## 5-Minute Setup

### Step 1: Install Extension (2 minutes)

1. Download or clone this repository
2. Open Chrome browser
3. Go to `chrome://extensions/`
4. Toggle **Developer mode** ON (top right)
5. Click **Load unpacked**
6. Select the `chrome-extension` folder
7. Done! You'll see the extension icon in your toolbar

### Step 2: Generate Icons (1 minute)

1. Open `chrome-extension/icons/icon-generator.html` in Chrome
2. Click **Download** under each icon size
3. Save as:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
4. All files should be in `chrome-extension/icons/` folder

### Step 3: First Use (2 minutes)

1. **Open Power BI**: Navigate to `app.powerbi.com`
2. **Open a Report**: Any report or dashboard
3. **Click Extension**: Look for the ADOC icon in toolbar
4. **Login**: Click "Login to Acceldata"
5. **Authenticate**: Log in at `indiumtech.acceldata.app`
6. **Fetch Data**: Click "Fetch Reliability Data"
7. **View Results**: See your data reliability metrics!

## What You'll See

### Login Screen
- ADOC logo
- Tagline about data quality
- Blue login button

### Fetch Screen
- Database icon
- Instructions
- Fetch button

### Loading Screen
- Spinner animation
- "Fetching..." text
- Status indicators

### Results Screen

**If Healthy (No Alerts):**
- Green "Healthy" badge
- Total assets count
- "No alerts" message with checkmark

**If Risky (Has Alerts):**
- Red "Risky" badge
- Assets with alerts count
- List of asset cards showing:
  - Asset name and type
  - Reliability score (color coded)
  - Data freshness percentage
  - Last profiled timestamp
  - Open alerts count
  - Link to ADOC dashboard

## Testing Without Power BI

The extension includes mock data for testing:

1. Click extension icon on any page
2. Complete login flow
3. Click "Fetch Reliability Data"
4. You'll see sample assets:
   - TRANSACTIONS_DATA
   - PharmaSalesbyDistributor
   - Customer_details
   - Sales_Summary

## Common Issues & Quick Fixes

### Issue: Extension not showing
**Fix:** Click the puzzle piece 🧩 icon and pin ADOC extension

### Issue: No assets found
**Fix:** Make sure Power BI report is fully loaded, then try again

### Issue: Login not working
**Fix:** Check that you can access `indiumtech.acceldata.app` in a regular tab

### Issue: Icons not displaying
**Fix:** Generate icons using `icons/icon-generator.html`

## Next Steps

- [ ] Configure API credentials in Options (right-click icon → Options)
- [ ] Test with your actual Power BI reports
- [ ] Explore asset details and links to ADOC
- [ ] Set up custom thresholds (coming soon)
- [ ] Share feedback and report issues

## Key Features to Try

1. **Auto-Detection**: Extension automatically detects Power BI reports
2. **Quick Links**: Click alert links to jump directly to ADOC dashboard
3. **Copy Names**: Click copy icon to copy asset names
4. **Refresh**: Click refresh button to update metrics
5. **Scrolling**: Scroll through many assets in the results view

## Pro Tips

💡 **Pin the extension** for quick access
💡 **Use keyboard shortcuts** - Press Alt+Shift+A to open (customize in chrome://extensions/shortcuts)
💡 **Check before meetings** - Verify data quality before presenting reports
💡 **Monitor regularly** - Refresh metrics throughout the day
💡 **Share results** - Screenshot and share with your team

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│           Chrome Extension                   │
│                                             │
│  ┌─────────────┐      ┌─────────────┐     │
│  │   Popup     │◄────►│  Background │     │
│  │   (UI)      │      │   Service   │     │
│  └─────────────┘      │   Worker    │     │
│                       └─────┬───────┘     │
│                             │              │
│  ┌─────────────┐            │              │
│  │   Content   │            │              │
│  │   Script    │            │              │
│  │ (Power BI)  │            │              │
│  └─────────────┘            │              │
└──────────────────────────────┼──────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   ADOC API      │
                    │ (Acceldata      │
                    │  Platform)      │
                    └─────────────────┘
```

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── html/
│   ├── popup.html        # Main popup interface
│   └── options.html      # Settings page
├── js/
│   ├── popup.js          # Popup logic
│   ├── background.js     # API communication
│   ├── content.js        # Power BI integration
│   └── options.js        # Settings logic
├── css/
│   ├── popup.css         # Popup styles
│   └── sidebar.css       # Sidebar styles
├── icons/
│   ├── icon16.png        # 16x16 icon
│   ├── icon48.png        # 48x48 icon
│   ├── icon128.png       # 128x128 icon
│   └── icon-generator.html
└── docs/
    ├── README.md         # Main documentation
    ├── INSTALLATION.md   # Installation guide
    ├── DEPLOYMENT.md     # Deployment guide
    └── QUICKSTART.md     # This file
```

## Support

Need help? Try these resources:

1. **Documentation**: See README.md for detailed info
2. **Installation**: See INSTALLATION.md for setup help
3. **Issues**: Check INSTALLATION.md troubleshooting section
4. **Email**: support@acceldata.io
5. **ADOC Docs**: docs.acceldata.io

## What's Next?

Upcoming features:
- 🔔 Real-time notifications for new alerts
- 📊 Historical trends and charts
- 🎯 Custom alert thresholds
- 🔍 Advanced filtering options
- 📋 Export functionality
- 🎨 Dark mode support
- 🔗 Tableau integration
- 🔗 Looker integration

## Feedback

We'd love to hear from you!

- ⭐ Rate the extension
- 💬 Write a review
- 🐛 Report bugs
- 💡 Suggest features
- 📧 Email us: support@acceldata.io

---

**Happy Data Quality Checking!** ✨

Your data reliability journey starts now. Open Power BI and click that extension icon!
