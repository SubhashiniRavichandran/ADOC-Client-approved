# ADOC Chrome Extension - Deployment Guide

## Deployment Options

### Option 1: Internal Distribution (Recommended)
For enterprise/corporate use without Chrome Web Store

### Option 2: Chrome Web Store
For public distribution (requires Google account and $5 fee)

### Option 3: Manual Install
For testing and development

---

## Option 1: Internal Distribution

**Best for:** Corporate environments, controlled rollout

### Prerequisites

```bash
✓ Domain ownership verification
✓ Google Workspace admin access
✓ Extension signed with private key
```

### Step 1: Prepare Extension Package

```bash
# 1. Clean directory
cd chrome-extension
rm -rf **/*.backup **/*.map

# 2. Update version in manifest.json
"version": "1.1.0"  → "1.2.0"

# 3. Switch to production mode
# Edit popup.js - replace mock data with real API calls
# (See DEVELOPMENT_GUIDE.md for details)

# 4. Create zip
zip -r ADOC-Extension-v1.2.0.zip \
  manifest.json \
  html/ \
  css/ \
  js/ \
  icons/

# Verify zip size (should be ~40-50 KB)
ls -lh ADOC-Extension-v1.2.0.zip
```

### Step 2: Google Workspace Setup

**A. Enable Extension Management**

```bash
1. Login to Google Workspace Admin Console
   https://admin.google.com

2. Navigate to:
   Devices → Chrome → Apps & Extensions

3. Click "Settings"

4. Enable:
   ☑ Allow users to install other apps & extensions
   ☑ Allow installation of specific extensions
```

**B. Add Extension to Allowlist**

```bash
1. In Apps & Extensions settings

2. Click "Add" → "Upload private extension"

3. Upload: ADOC-Extension-v1.2.0.zip

4. Configure:
   - Name: ADOC Reliability Metrics
   - Installation: Force install (automatic)
   - User groups: All users (or specific OUs)

5. Click "Save"
```

### Step 3: User Deployment

**Automatic Installation:**
- Extension auto-installs on next Chrome restart
- Users see notification: "ADOC Reliability Metrics installed"
- Icon appears in toolbar

**User Setup:**
```bash
1. User opens Chrome
2. Extension auto-installed
3. Click ADOC icon
4. Login to Acceldata
5. Ready to use
```

**Rollout Timeline:**
- Hour 1-2: 30% of users
- Hour 3-6: 60% of users
- Hour 7-24: 100% of users

---

## Option 2: Chrome Web Store

**Best for:** Public distribution, non-corporate users

### Prerequisites

```bash
✓ Google Developer account ($5 one-time fee)
✓ Extension privacy policy URL
✓ Screenshots and promotional images
✓ Store listing content
```

### Step 1: Create Developer Account

```bash
1. Go to: https://chrome.google.com/webstore/devconsole

2. Click "Sign in" with Google account

3. Pay $5 developer registration fee

4. Accept Developer Agreement
```

### Step 2: Prepare Store Assets

**Required Files:**

```bash
# Screenshots (1280x800 or 640x400)
screenshot_1_healthy.png
screenshot_2_risky.png
screenshot_3_noassets.png
screenshot_4_installation.png

# Promotional images
promo_tile_440x280.png      # Required
promo_small_128x128.png     # Optional
promo_large_920x680.png     # Optional
promo_marquee_1400x560.png  # Optional

# Icons (already have)
icon128.png
```

**Create Screenshots:**
```bash
# Use browser dev tools
1. Open extension
2. F12 → Device toolbar
3. Set dimensions: 1280x800
4. Screenshot tool (Ctrl+Shift+P → "Capture screenshot")
5. Save with descriptive names
```

### Step 3: Upload Extension

```bash
1. Chrome Web Store Developer Dashboard
   https://chrome.google.com/webstore/devconsole

2. Click "New Item"

3. Upload: ADOC-Extension-v1.2.0.zip

4. Click "Upload"
```

### Step 4: Complete Store Listing

**A. Product Details**

```
Extension Name:
ADOC Reliability Metrics for Power BI

Short Description (132 chars):
Real-time data quality insights for Power BI reports. Check reliability scores, alerts, and upstream issues instantly.

Detailed Description:
[Paste from section below]

Category:
Productivity

Language:
English

Icon:
icon128.png
```

**Detailed Description Template:**
```
ADOC Reliability Metrics brings Acceldata's Data Observability Cloud directly into your Power BI workflow.

✨ KEY FEATURES
• Instant data reliability scores for all report datasets
• Real-time data quality alerts and notifications
• Upstream dependency tracking and issue detection
• One-click access to detailed analysis in ADOC platform
• Secure AES-256 encrypted credential storage

🎯 HOW IT WORKS
1. Open any Power BI report
2. Click the ADOC extension icon
3. View health status instantly (Healthy, Risky, or Not Found)
4. Review asset cards with detailed metrics
5. Click through to ADOC for root cause analysis

📊 WHAT YOU'LL SEE
• Report Status: Overall health indicator
• Total Assets: Number of datasets analyzed
• Assets with Alerts: Count of quality issues
• Reliability Scores: Color-coded percentages (90%+, 70-89%, <70%)
• Data Freshness: Currency indicators
• Open Alerts: Active data quality issues
• Upstream Issues: Source data problems

🔒 SECURITY & PRIVACY
• Enterprise-grade AES-256 encryption
• Local storage only (no third-party transmission)
• Minimal permissions required
• HTTPS-only connections

✅ REQUIREMENTS
• Google Chrome 90+
• Acceldata account with valid credentials
• Power BI access

🆘 SUPPORT
• Email: support@acceldata.io
• Documentation: Included with extension
• Response time: 24-48 hours

📝 ABOUT ACCELDATA
Acceldata is the pioneer in Data Observability, helping organizations ensure their data is reliable, accurate, and trustworthy.

Website: https://acceldata.io
Platform: https://indiumtech.acceldata.app
```

**B. Privacy Practices**

```
Single Purpose Description:
Displays data reliability metrics from Acceldata platform for Power BI reports

Permissions Justification:

storage - Store encrypted user credentials and cached results
tabs - Detect Power BI reports and manage authentication flow
notifications - Alert users of successful login

Host Permissions:
https://indiumtech.acceldata.app/* - Access ADOC API for reliability data
https://*.powerbi.com/* - Detect and analyze Power BI reports

Data Usage:
☑ User credentials (encrypted, stored locally)
☑ Cached reliability metrics (encrypted, stored locally)
☐ Personal information (NOT collected)
☐ Analytics/tracking data (NOT collected)
```

**C. Privacy Policy** (Required)

Create page at: `https://acceldata.io/adoc-extension-privacy`

```html
Privacy Policy - ADOC Chrome Extension

Data Collection:
- We do NOT collect any user data
- We do NOT track usage analytics
- We do NOT share data with third parties

Local Storage:
- User credentials stored encrypted (AES-256)
- Cached results stored encrypted
- Data cleared on logout

Third-Party Services:
- Acceldata ADOC API (for reliability data)
- No other third-party services used

Contact: privacy@acceldata.io
Last Updated: January 2026
```

**D. Upload Assets**

```bash
1. Screenshots tab
   - Upload 4-5 screenshots
   - Add captions describing each view

2. Promotional images tab
   - Upload required promo tile (440x280)
   - Optional: Upload other promo images

3. Save draft
```

### Step 5: Submit for Review

```bash
1. Review all information

2. Check:
   ☑ All required fields filled
   ☑ Privacy policy URL working
   ☑ Screenshots uploaded
   ☑ Description accurate
   ☑ Permissions justified

3. Click "Submit for Review"

4. Review time: 1-3 business days

5. Check email for approval/rejection
```

### Step 6: Publish

```bash
After approval:

1. Dashboard shows "Approved"

2. Click "Publish Item"

3. Extension goes live on Chrome Web Store

4. Share link:
   https://chrome.google.com/webstore/detail/[extension-id]

5. Users can install with one click
```

---

## Option 3: Manual Install

**Best for:** Development, testing, demos

### Step 1: Package Extension

```bash
# Create zip file
cd chrome-extension
zip -r ADOC-Extension-Demo-v1.1.0.zip *

# Or use existing
ADOC-Extension-DEMO-v1.1.0.zip (already created)
```

### Step 2: Distribute

**Via Email:**
```bash
1. Email zip file to users
2. Include installation instructions (see USER_GUIDE.md)
3. Users extract and load unpacked
```

**Via File Share:**
```bash
1. Upload to shared drive (OneDrive, Google Drive, Dropbox)
2. Share link with users
3. Include installation instructions
```

**Via USB/Network:**
```bash
1. Copy zip to shared network location
2. Users download from network
3. Extract and install
```

### Step 3: User Installation

```bash
Users follow these steps:

1. Extract ADOC-Extension-Demo-v1.1.0.zip

2. Open Chrome → chrome://extensions/

3. Enable "Developer mode" (top right)

4. Click "Load unpacked"

5. Select extracted chrome-extension folder

6. Extension appears in toolbar

7. Click icon → Login → Use
```

---

## Post-Deployment

### Monitor Usage

**Google Workspace (Option 1):**
```bash
Admin Console → Reports → Chrome

View:
- Number of installs
- Active users
- Crash reports
```

**Chrome Web Store (Option 2):**
```bash
Developer Dashboard → Item → Stats

View:
- Impressions
- Installs
- Weekly users
- Ratings/reviews
```

### Handle Issues

**Common Issues:**

| Issue | Solution |
|-------|----------|
| Installation fails | Check manifest syntax |
| Permission errors | Review host_permissions |
| Not appearing | Clear browser cache |
| Login fails | Check ADOC credentials |
| No data shown | Verify datasets onboarded |

**Support Channels:**
```bash
Email: support@acceldata.io
Slack: #adoc-extension-support (internal)
Ticketing: help.acceldata.io
```

### Collect Feedback

**Feedback Form:**
```bash
Create Google Form with questions:
1. How easy was installation? (1-5 scale)
2. How useful is the extension? (1-5 scale)
3. Which features do you use most?
4. What features would you like added?
5. Any bugs or issues encountered?
6. Additional comments
```

**Share link with users via:**
- Email announcement
- Slack channel
- Extension welcome screen

---

## Updates & Versioning

### Semantic Versioning

```
Format: MAJOR.MINOR.PATCH

Examples:
1.0.0 → Initial release
1.1.0 → New features (demo mode, logout)
1.1.1 → Bug fixes
1.2.0 → Production mode, new features
2.0.0 → Breaking changes (architecture redesign)
```

### Update Process

**Step 1: Prepare Update**

```bash
# 1. Update version in manifest.json
"version": "1.2.0" → "1.3.0"

# 2. Make code changes

# 3. Test thoroughly

# 4. Document changes in CHANGES.md

# 5. Create new zip
zip -r ADOC-Extension-v1.3.0.zip chrome-extension/
```

**Step 2: Deploy Update**

**For Internal Distribution:**
```bash
1. Google Workspace Admin Console
2. Apps & Extensions
3. Find ADOC extension
4. Click "Update"
5. Upload new zip: ADOC-Extension-v1.3.0.zip
6. Click "Save"
7. Auto-updates within 24 hours
```

**For Chrome Web Store:**
```bash
1. Developer Dashboard
2. Find extension
3. Click "Package" → "Upload updated package"
4. Upload new zip
5. Update version notes
6. Submit for review (1-3 days)
7. Publish after approval
```

**Step 3: Notify Users**

```bash
Email template:

Subject: ADOC Extension Updated to v1.3.0

Hi Team,

We've released version 1.3.0 of the ADOC Chrome Extension with:

✨ New Features:
- [List new features]

🐛 Bug Fixes:
- [List bug fixes]

🔧 Improvements:
- [List improvements]

The update will install automatically within 24 hours. To update immediately:
1. Go to chrome://extensions/
2. Click "Update" button (top left)

Questions? Contact support@acceldata.io

Thanks,
ADOC Team
```

---

## Rollback Plan

### If Issues Occur

**Quick Rollback (Google Workspace):**

```bash
1. Admin Console → Apps & Extensions

2. Find ADOC extension

3. Click "Version history"

4. Select previous working version (e.g., 1.2.0)

5. Click "Rollback"

6. Confirm

7. Users auto-revert within hours
```

**Chrome Web Store Rollback:**

```bash
Cannot rollback on Web Store

Instead:
1. Unpublish current version
2. Fix issues quickly
3. Release new patch version (e.g., 1.3.1)
4. Expedite review by contacting support
```

### Communication Template

```bash
Subject: ADOC Extension Rollback - v1.3.0 → v1.2.0

Hi Team,

We've identified an issue with version 1.3.0 and rolled back to the stable v1.2.0.

Issue: [Brief description]

Status: Rolled back to v1.2.0 (working version)

Impact: Minimal - functionality restored

Next Steps:
- We're fixing the issue
- Will release v1.3.1 once tested
- ETA: [timeframe]

Sorry for the inconvenience. Questions? support@acceldata.io

ADOC Team
```

---

## Security Considerations

### Code Signing

**For Enterprise Distribution:**

```bash
# Generate private key (one time)
openssl genrsa -out key.pem 2048

# Create certificate signing request
openssl req -new -key key.pem -out request.csr

# Sign extension with key
# (Google Workspace handles this automatically)
```

### Content Security Policy

**In manifest.json:**

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### Permissions Audit

**Minimize permissions:**

```json
{
  "permissions": [
    "storage",      // Required: encrypted storage
    "tabs",         // Required: Power BI detection
    "notifications" // Required: login alerts
  ],
  "host_permissions": [
    "https://indiumtech.acceldata.app/*", // Required: ADOC API
    "https://*.powerbi.com/*"              // Required: BI detection
  ]
}
```

**Remove any unused permissions before deployment**

---

## Compliance & Legal

### Enterprise Requirements

```bash
☑ Privacy policy published
☑ Terms of service (if needed)
☑ Data processing agreement (if needed)
☑ Security review completed
☑ Legal review completed
☑ IT/Security team approval
```

### GDPR Compliance

```bash
☑ No personal data collected
☑ User credentials encrypted
☑ Data stored locally only
☑ Data deleted on logout
☑ Privacy policy transparent
☑ User consent obtained (via login)
```

### SOC 2 / ISO 27001

```bash
☑ Secure development practices followed
☑ Code reviewed for vulnerabilities
☑ Encryption standards met (AES-256)
☑ Access controls implemented
☑ Audit logs available (ADOC platform)
☑ Incident response plan documented
```

---

## Monitoring & Analytics

### Usage Metrics to Track

```bash
Key Metrics:
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Extension opens per user
- Login success rate
- Average session duration
- Feature adoption rates
- Error rates
- Crash reports
```

### Set Up Monitoring

**Google Analytics (Optional):**

```javascript
// Add to background.js (if approved)
// Note: Requires privacy policy update

const trackEvent = (category, action, label) => {
  // Send to GA4
  gtag('event', action, {
    'event_category': category,
    'event_label': label
  });
};

// Track events
trackEvent('Extension', 'Login', 'Success');
trackEvent('Extension', 'View', 'Healthy');
trackEvent('Extension', 'Action', 'Refresh');
```

**Custom Analytics:**

```javascript
// Send to internal endpoint
const logUsage = async (event) => {
  await fetch('https://internal.acceldata.io/analytics', {
    method: 'POST',
    body: JSON.stringify({
      event: event,
      timestamp: Date.now(),
      version: chrome.runtime.getManifest().version
    })
  });
};
```

---

## Checklist: Pre-Deployment

```bash
Code:
☐ Production mode enabled (no mock data)
☐ Console.logs removed
☐ Error handling complete
☐ All features tested
☐ Performance optimized
☐ Security review passed

Documentation:
☐ README updated
☐ USER_GUIDE complete
☐ DEVELOPMENT_GUIDE updated
☐ CHANGES.md current
☐ Privacy policy published

Assets:
☐ Screenshots taken (4-5)
☐ Promotional images created
☐ Icons verified (16, 48, 128)
☐ Manifest version incremented

Testing:
☐ Manual testing complete
☐ All scenarios tested
☐ Login/logout works
☐ API integration works
☐ Encryption verified
☐ Cross-browser tested (if applicable)

Legal/Compliance:
☐ Privacy policy URL working
☐ Terms accepted
☐ Legal review complete
☐ Security review complete
☐ Approvals obtained

Distribution:
☐ Zip file created
☐ File size reasonable (<10MB)
☐ Zip tested (extract and install)
☐ Distribution method chosen
☐ Rollout plan documented
```

---

## Support Resources

### For Deployment Issues

**Google Workspace Support:**
- https://support.google.com/chrome/a/
- Contact: Google Workspace support team

**Chrome Web Store Support:**
- https://support.google.com/chrome_webstore/
- Email: chromewebstore-support@google.com

**Acceldata Internal:**
- Email: deployments@acceldata.io
- Slack: #deployments
- Wiki: https://wiki.acceldata.io/deployments

---

## Quick Reference

### Deployment Commands

```bash
# Create production build
zip -r ADOC-Extension-v1.2.0.zip chrome-extension/

# Verify build
unzip -l ADOC-Extension-v1.2.0.zip

# Test build
cd test/ && unzip ../ADOC-Extension-v1.2.0.zip
# Load in Chrome to test

# Clean up
rm -rf test/
```

### URLs

```bash
# Chrome Web Store Developer Console
https://chrome.google.com/webstore/devconsole

# Google Workspace Admin
https://admin.google.com

# Extension management
chrome://extensions/

# Test installation
chrome://extensions/ → Load unpacked
```

---

**Version:** 1.1.0 Demo
**Last Updated:** January 2026
**Deployment Support:** deployments@acceldata.io
