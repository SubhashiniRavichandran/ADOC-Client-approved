# Installation Guide - ADOC Reliability Metrics Chrome Extension

## Prerequisites

- Google Chrome browser (version 120 or higher)
- Access to Power BI reports (app.powerbi.com)
- ADOC account at https://indiumtech.acceldata.app/

## Installation Steps

### Method 1: Load Unpacked (Development)

1. **Download the Extension**
   - Clone or download this repository
   - Locate the `chrome-extension` folder

2. **Generate Icons**
   - Open `chrome-extension/icons/icon-generator.html` in Chrome
   - Right-click each canvas and save as:
     - `icon16.png` (16x16)
     - `icon48.png` (48x48)
     - `icon128.png` (128x128)
   - Save all icons in the `chrome-extension/icons/` folder

3. **Open Chrome Extensions**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or click Menu (⋮) → More Tools → Extensions

4. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top right corner

5. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to the `chrome-extension` folder
   - Click "Select Folder"

6. **Verify Installation**
   - You should see "ADOC Reliability Metrics" in your extensions list
   - The extension icon should appear in your Chrome toolbar
   - Click the puzzle piece icon 🧩 to pin it for easy access

### Method 2: Chrome Web Store (Coming Soon)

*(Will be available once published)*

1. Visit the Chrome Web Store
2. Search for "ADOC Reliability Metrics"
3. Click "Add to Chrome"
4. Click "Add extension" to confirm

## Initial Setup

### 1. First Time Launch

When you first install the extension:

1. Click the ADOC extension icon in your toolbar
2. You'll see the login screen with:
   - ADOC logo ('a')
   - Tagline: "Check data quality instantly and make decisions you can trust"
   - Blue "Login to Acceldata" button

### 2. Authentication

1. Click "Login to Acceldata"
2. You'll be redirected to: `https://indiumtech.acceldata.app/`
3. Log in with your ADOC credentials:
   - Email address
   - Password
4. After successful login, the tab will close automatically
5. The extension will now show the "Fetch Reliability Data" screen

### 3. Configure API Credentials (Optional)

For direct API access:

1. Right-click the extension icon
2. Select "Options"
3. Enter your ADOC API credentials:
   - Access Key
   - Secret Key
4. Click "Save"
5. Click "Test Connection" to verify

## Using the Extension

### Step 1: Open a Power BI Report

1. Navigate to `app.powerbi.com`
2. Open any report or dashboard
3. You should see a green checkmark (✓) badge on the extension icon

### Step 2: Fetch Reliability Data

1. Click the extension icon
2. You'll see the database icon and text:
   - "Click below to check data reliability and make informed decisions"
3. Click the "Fetch Reliability Data" button
4. The extension will show "Fetching..." with a spinner

### Step 3: View Results

After fetching (usually 2-5 seconds), you'll see:

**Report Summary:**
- **Report Status**: Green "Healthy" or Red "Risky" badge
- **Total Assets fetched**: Number of assets found in the report
- **Assets with Alerts**: Count of assets with open quality issues

**Reliability Details:**

If **Healthy** (no alerts):
- Green checkmark icon
- Message: "There are no assets with open alerts powering this report"

If **Risky** (has alerts):
- Scrollable list of asset cards showing:
  - Asset name and type icon
  - Data Reliability Score (color-coded)
  - Data Freshness percentage
  - Last Profiled timestamp
  - Open Alerts count with quick link
  - Upstream Issues count

### Step 4: Take Action

- **View in ADOC**: Click the blue link icon next to alerts to open the asset in ADOC
- **Refresh Data**: Click the refresh button (↻) in the header to update metrics
- **Copy Asset Name**: Click the copy icon next to any asset name

## Troubleshooting

### Extension Icon Not Showing

1. Check if the extension is installed: `chrome://extensions/`
2. Make sure it's enabled (toggle switch is on)
3. Pin the extension: Click puzzle piece 🧩 → Pin ADOC icon

### "No Assets Found" Message

**Causes:**
- Power BI report may not have loaded completely
- Report uses custom visuals not detected by the extension
- Field list panel is collapsed

**Solutions:**
1. Refresh the Power BI page
2. Wait for all visuals to load completely
3. Expand the Fields panel on the right
4. Try clicking "Fetch Reliability Data" again

### Authentication Failed

1. Clear extension storage:
   - Go to `chrome://extensions/`
   - Find ADOC Reliability Metrics
   - Click "Details"
   - Scroll to "Site permissions"
   - Click "Remove" for all sites
   - Try logging in again

2. Check ADOC credentials:
   - Make sure you can log in at https://indiumtech.acceldata.app/
   - Verify your account is active

### API Connection Issues

1. Check internet connection
2. Verify firewall isn't blocking `acceldata.app` domain
3. Check API credentials in extension options
4. Contact ADOC support for API access

### Extension Not Working on Power BI

**Verify URL:**
- Extension only works on:
  - `https://app.powerbi.com/*`
  - `https://msit.powerbi.com/*`
- Will not work on:
  - Power BI Desktop
  - Embedded Power BI reports on other domains
  - Power BI Report Server (on-premises)

**Solution:**
- Make sure you're using Power BI Service (cloud)
- Check the URL in your browser

## Uninstallation

### Remove Extension

1. Go to `chrome://extensions/`
2. Find "ADOC Reliability Metrics"
3. Click "Remove"
4. Confirm removal

### Clear Data

Extension data is automatically removed on uninstall, including:
- Authentication tokens
- Cached results
- Configuration settings

## Support

### Getting Help

- **Documentation**: See README.md in the extension folder
- **Issues**: Report bugs on GitHub Issues
- **Email**: support@acceldata.io
- **ADOC Help**: docs.acceldata.io

### Common Questions

**Q: Does the extension work offline?**
A: No, it requires internet connection to fetch data from ADOC.

**Q: How often should I refresh the data?**
A: Refresh whenever you want the latest reliability metrics. Data is cached until you refresh.

**Q: Can I use this with Tableau or Looker?**
A: Not yet. Currently only Power BI is supported. Tableau and Looker support coming soon.

**Q: Is my data secure?**
A: Yes. The extension only reads public metadata from Power BI and communicates securely with ADOC via HTTPS. No sensitive data is stored or transmitted.

**Q: How many assets can it handle?**
A: The extension can handle reports with up to 100+ assets. Performance may vary based on report complexity.

## Updates

The extension will automatically update when new versions are released:

1. Chrome checks for updates every few hours
2. Updates install automatically in the background
3. You may need to reload Power BI tabs after updates

To manually check for updates:
1. Go to `chrome://extensions/`
2. Click "Update" button at the top

## Version Information

Current Version: 1.0.0
Release Date: January 8, 2026
Manifest Version: 3
Minimum Chrome Version: 120

---

**Ready to use!** 🚀

Open Power BI, click the extension icon, and start checking data reliability!
