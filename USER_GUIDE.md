# ADOC Chrome Extension - User Guide

## Quick Start

### Installation (2 minutes)

1. **Extract the extension:**
   ```bash
   unzip ADOC-Extension-DEMO-v1.1.0.zip
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

3. **Verify:**
   - Look for ADOC icon (blue "a") in toolbar
   - Pin it for easy access

---

## First Use

### Login (One-time)

1. Click ADOC icon in toolbar
2. Click "Login to Acceldata"
3. Login at indiumtech.acceldata.app
4. See success notification
5. Extension auto-fetches data

**Your credentials are encrypted and stored securely.**

---

## Daily Usage

### Check Report Reliability

1. **Open Power BI report**
2. **Click ADOC icon** in toolbar
3. **View results** - one of three scenarios:

---

## Understanding Results

### Scenario 1: Healthy ✅

**What you see:**
- Green "Healthy" badge
- 175 total assets
- 0 assets with alerts
- Checkmark icon with message

**What it means:**
- All data is reliable
- No issues detected
- Safe to proceed with analysis

**Action:** Continue working with confidence

---

### Scenario 2: Risky ⚠️

**What you see:**
- Amber "Risky" badge
- 175 total assets
- 25 assets with alerts
- List of asset cards

**What it means:**
- Data quality issues detected
- Some datasets need attention
- Review before making decisions

**Actions:**
1. Scroll through asset cards
2. Check reliability scores:
   - **Green badge (90%+):** Good - minor issues
   - **Amber badge (70-89%):** Moderate - review needed
   - **Red badge (<70%):** Poor - urgent attention
3. Click link icons to see details in ADOC
4. Copy asset names to share with data team
5. Refresh after issues are resolved

---

### Scenario 3: No Assets Found 🚫

**What you see:**
- Orange warning icon
- Error message
- "Fetch Again" and "Logout" buttons

**What it means:**
- Datasets not found in ADOC
- May need onboarding
- Or permission issues

**Actions:**
1. Click "Fetch Again" to retry
2. Contact ADOC admin if persists
3. Try a different report
4. Use "Logout" to switch accounts

---

## Key Features

### Asset Card Components

Each asset card shows:

| Component | Description |
|-----------|-------------|
| **Colored Badge** | Visual identifier (cyan/red/blue) |
| **Table Icon** | Dataset type indicator |
| **Asset Name** | Full dataset name |
| **Copy Button** | Click to copy name to clipboard |
| **Reliability Score** | Color-coded percentage with badge |
| **Data Freshness** | Currency indicator (%) |
| **Last Profiled** | Timestamp of last check |
| **Open Alerts** | Number of active issues + link |
| **Upstream Issues** | Source data problems + link |

---

## Quick Actions

### Refresh Data
- **Button:** Circular arrow (top right)
- **When:** After data team fixes issues
- **Time:** 1-2 seconds

### View in ADOC
- **Button:** Blue link icon on asset cards
- **Opens:** New tab with detailed view
- **Shows:** Full alert details or data lineage

### Copy Asset Name
- **Button:** Copy icon next to name
- **Use:** Share with data teams via email/chat
- **Feedback:** Icon turns green briefly

### Logout
- **Button:** Logout icon (top right)
- **When:** Switch accounts or troubleshoot
- **Effect:** Clears all cached data, returns to login

---

## Tips for Success

### Best Practices

✅ **Check before sharing** - Always review status before distributing reports
✅ **Prioritize by score** - Focus on red/amber reliability scores first
✅ **Click through alerts** - Understand root causes in ADOC
✅ **Copy asset names** - Easy sharing with data teams
✅ **Refresh after fixes** - Verify issues resolved

### Common Workflows

#### Pre-Presentation Check
```
1. Open Power BI report
2. Click ADOC extension
3. Check status (Healthy or Risky?)
4. If Risky: Review asset cards
5. If critical issues: Postpone or validate
6. If Healthy: Present with confidence
```

#### Issue Investigation
```
1. See "Risky" status
2. Scroll to find low scores (red/amber)
3. Click alert link icon
4. Review details in ADOC
5. Copy asset name
6. Email/chat data team
7. Monitor in ADOC until resolved
8. Refresh extension to verify
```

#### New User Setup
```
1. Install extension
2. Login to ADOC
3. Open test Power BI report
4. Click extension icon
5. See results (try refresh for different scenarios in demo)
6. Explore asset cards
7. Click link icons to see ADOC platform
```

---

## Troubleshooting

### Extension Not Working

**Problem:** Icon is grayed out
- **Solution:** Navigate to a Power BI report page

**Problem:** "No Assets Found" for all reports
- **Solution:** Contact ADOC admin - datasets may need onboarding

**Problem:** Stuck on "Fetching..."
- **Solution:** Refresh page and try again, check internet connection

**Problem:** Login doesn't redirect back
- **Solution:** Close auth tab after login, click extension icon again

### Getting Better Results

**Verify datasets are onboarded:**
1. Open ADOC platform directly
2. Search for your dataset names
3. If not found: Request onboarding from admin

**Check permissions:**
1. Ensure you have access in ADOC
2. Contact admin to grant permissions
3. Logout and login again in extension

---

## Demo vs Production

### Demo Mode (Current Version)

- **Data:** Random mock scenarios
- **Scenarios:** 33% Healthy, 33% Risky, 33% No Assets
- **Purpose:** Testing and presentations
- **Refresh:** Shows different random scenario
- **Limitation:** Not connected to real data

### Production Mode

- **Data:** Live from ADOC API
- **Scenarios:** Based on actual data quality
- **Purpose:** Real-world usage
- **Refresh:** Updates with latest metrics
- **Benefit:** Actionable insights

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open extension | Alt+Shift+A (custom) |
| Refresh | Click refresh icon |
| Close | Click X or Esc |

---

## Security Notes

🔒 **Your data is protected:**
- AES-256 encryption for credentials
- Local storage only (never sent to third parties)
- Secure HTTPS connections
- Logout clears all data

---

## Getting Help

### Resources
- This user guide
- ADOC platform help center
- Video tutorials (in ADOC)

### Support
- **Email:** support@acceldata.io
- **Response:** 24-48 hours
- **Include:** Screenshots and error messages

### Feedback
- **Email:** product@acceldata.io
- Share: Feature requests, bugs, suggestions

---

## Quick Reference Card

### Status Meanings
| Badge | Color | Meaning | Action |
|-------|-------|---------|--------|
| Healthy | Green | No issues | Proceed |
| Risky | Amber | Has alerts | Review |
| - | Orange warning | Not found | Retry |

### Score Colors
| Score | Color | Priority |
|-------|-------|----------|
| 90%+ | Green | Low |
| 70-89% | Amber | Medium |
| <70% | Red | High |

### Icons Guide
| Icon | Meaning |
|------|---------|
| 🔄 | Refresh data |
| 🔗 | View in ADOC |
| 📋 | Copy asset name |
| 🚪 | Logout |
| ✕ | Close extension |

---

**Version:** 1.1.0 Demo
**Last Updated:** January 2026
**Questions?** support@acceldata.io
