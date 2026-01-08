# Deployment Guide - ADOC Reliability Metrics Chrome Extension

## Pre-Deployment Checklist

### Code Preparation

- [ ] All features implemented and tested
- [ ] No console.log statements (except intentional debugging)
- [ ] Error handling implemented for all API calls
- [ ] Mock data removed or behind feature flag
- [ ] Code minified and optimized
- [ ] Comments and documentation added
- [ ] License file added

### Assets

- [ ] Icons generated (16x16, 48x48, 128x128)
- [ ] Screenshots prepared (1280x800 or 640x400)
- [ ] Promotional images created (440x280)
- [ ] README.md complete
- [ ] INSTALLATION.md complete
- [ ] Privacy policy document created

### Testing

- [ ] Tested on Chrome (latest)
- [ ] Tested on Microsoft Edge
- [ ] Tested with different Power BI reports
- [ ] Tested authentication flow
- [ ] Tested API integration
- [ ] Tested error scenarios
- [ ] Tested with slow network
- [ ] UI matches design specifications
- [ ] No console errors
- [ ] No security warnings

### Security

- [ ] No hardcoded credentials
- [ ] HTTPS-only connections
- [ ] Content Security Policy enforced
- [ ] Credentials encrypted in storage
- [ ] No sensitive data in logs
- [ ] Permissions minimal and justified
- [ ] Code reviewed for vulnerabilities

### Documentation

- [ ] README complete with all sections
- [ ] Installation instructions clear
- [ ] API documentation included
- [ ] Troubleshooting section added
- [ ] Support contact information
- [ ] Version history documented

## Version Update

Before deployment, update version number in:

1. `manifest.json`:
```json
{
  "version": "1.0.0"
}
```

2. `README.md`:
```markdown
## Version History
### 1.0.0 (YYYY-MM-DD)
```

3. `options.html`:
```html
<strong>Version:</strong> 1.0.0
```

## Chrome Web Store Submission

### Step 1: Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Sign in with Google account
3. Pay one-time developer registration fee ($5 USD)
4. Verify email address

### Step 2: Prepare Store Listing

Create the following assets:

#### Required Icons
- **icon-16.png** (16x16) - Browser toolbar
- **icon-48.png** (48x48) - Extension management page
- **icon-128.png** (128x128) - Chrome Web Store listing

#### Screenshots (1-5 required)
1. Login screen (1st_view.png)
2. Fetch data screen (afterlogin_2view.png)
3. Fetching state (try2fetch_3view.png)
4. Results - Healthy report
5. Results - Risky report with alerts

Dimensions: 1280x800 or 640x400 pixels

#### Promotional Images (optional but recommended)
- **Small promo tile**: 440x280 pixels
- **Marquee promo tile**: 1400x560 pixels

#### Store Listing Text

**Short description (132 characters max):**
```
Check data quality in Power BI reports. Get reliability scores and alerts from ADOC instantly.
```

**Detailed description:**
```
ADOC Reliability Metrics integrates Acceldata's Data Observability Cloud with Power BI, allowing you to check data quality and make informed decisions directly within your workflow.

KEY FEATURES
• Automatic asset detection from Power BI reports
• Real-time data reliability scores
• Data quality alerts and notifications
• Asset-by-asset metrics breakdown
• Direct links to ADOC dashboard
• Easy authentication flow

HOW IT WORKS
1. Install the extension
2. Open a Power BI report
3. Click the extension icon
4. View reliability metrics for all assets

BENEFITS
✓ No context switching between Power BI and ADOC
✓ Instant visibility into data quality issues
✓ Proactive alert monitoring
✓ Better data-driven decisions
✓ Improved data trust and confidence

REQUIREMENTS
• Power BI Service account (app.powerbi.com)
• ADOC account at indiumtech.acceldata.app
• Chrome 120 or higher

PRIVACY & SECURITY
• HTTPS-only connections
• Encrypted credential storage
• No data collection or tracking
• Minimal permissions

SUPPORT
Email: support@acceldata.io
Docs: docs.acceldata.io

Developed by Indium Technologies for Acceldata
```

**Category:**
- Primary: Productivity
- Secondary: Developer Tools

**Language:**
- English (United States)

### Step 3: Package Extension

1. Create a clean copy of the extension folder
2. Remove development files:
   ```bash
   rm -rf .git
   rm -rf node_modules
   rm DEPLOYMENT.md
   rm icon-generator.html
   ```

3. Verify manifest.json:
   - Version number correct
   - All paths valid
   - Permissions minimal
   - Host permissions correct

4. Create ZIP file:
   ```bash
   cd chrome-extension
   zip -r ../adoc-reliability-metrics-v1.0.0.zip .
   ```

5. Verify ZIP contents:
   - manifest.json in root
   - All referenced files included
   - No unnecessary files
   - File size under 100MB

### Step 4: Submit to Chrome Web Store

1. Go to Developer Dashboard
2. Click "New Item"
3. Upload ZIP file
4. Fill in store listing:
   - Extension name: "ADOC Reliability Metrics"
   - Short description
   - Detailed description
   - Category: Productivity
   - Language: English
   - Upload screenshots (drag to reorder)
   - Upload icons
   - Upload promotional images

5. Privacy:
   - Privacy policy URL (required)
   - Justification for permissions
   - Data usage declaration

6. Distribution:
   - Visibility: Public
   - Countries: All countries
   - Pricing: Free

7. Click "Submit for Review"

### Step 5: Review Process

- **Automated review**: 1-5 minutes
  - Checks for malware
  - Validates manifest
  - Scans for policy violations

- **Manual review**: 1-3 business days
  - Human reviewer tests extension
  - Checks compliance with policies
  - Verifies functionality

**Common rejection reasons:**
- Missing privacy policy
- Excessive permissions
- Misleading description
- Broken functionality
- Security vulnerabilities

### Step 6: Publication

Once approved:
- Extension goes live on Chrome Web Store
- Receives unique extension ID
- Available for public installation
- Appears in search results

## Post-Deployment

### Monitor

1. **Chrome Web Store Dashboard**
   - Installation count
   - Active users (daily/weekly)
   - User ratings and reviews
   - Crash reports

2. **User Feedback**
   - Read and respond to reviews
   - Track feature requests
   - Monitor support emails
   - Fix reported bugs

3. **Analytics** (optional)
   - Google Analytics for web properties
   - Track usage patterns
   - Monitor API errors
   - Performance metrics

### Updates

To release an update:

1. Increment version in `manifest.json`:
   ```json
   {
     "version": "1.0.1"  // or 1.1.0, 2.0.0
   }
   ```

2. Update CHANGELOG.md:
   ```markdown
   ## [1.0.1] - 2026-01-15
   ### Fixed
   - Asset extraction bug in Power BI
   - Authentication timeout issue
   ```

3. Test thoroughly

4. Create new ZIP file

5. Upload to Chrome Web Store:
   - Go to Developer Dashboard
   - Click on extension
   - Click "Package" → "Upload new package"
   - Upload ZIP
   - Add "What's new" description
   - Submit for review

6. Auto-update for users:
   - Chrome checks for updates every ~5 hours
   - Users get update automatically
   - No action required from users

## Rollback Plan

If critical bug discovered:

1. **Immediate:**
   - Submit fixed version with incremented version number
   - Add note in "What's new" about critical fix
   - Request expedited review

2. **Temporary removal:**
   - If bug is severe, can unpublish extension
   - Users keep installed version
   - New installs blocked until fixed

3. **Communication:**
   - Email affected users (if contact available)
   - Post on support channels
   - Update Chrome Web Store description

## Alternative Distribution

### Enterprise Deployment

For internal company use:

1. **Google Workspace Admin Console**
   - Upload extension
   - Deploy to organizational units
   - Force install or recommend

2. **Group Policy (Windows)**
   - Configure Chrome policy
   - Whitelist extension ID
   - Auto-install for domain users

3. **MDM Solutions**
   - Jamf, Intune, etc.
   - Push extension to managed devices

### Self-Hosting

For private deployment:

1. Host extension files on web server
2. Create `updates.xml` manifest
3. Configure auto-update URL
4. Users install via "Load unpacked"

**Not recommended** - loses auto-update and security benefits of Chrome Web Store.

## Compliance

### Privacy Policy Requirements

Must include:
- What data is collected
- How data is used
- How data is stored
- How data is shared (if at all)
- User rights (access, deletion)
- Contact information

Example: See `PRIVACY.md` template

### Terms of Service

Recommended to include:
- Usage terms
- Limitations of liability
- Support policy
- License terms

## Support Plan

### Communication Channels

1. **Chrome Web Store Reviews**
   - Monitor daily
   - Respond to all reviews
   - Mark helpful reviews

2. **Email Support**
   - support@acceldata.io
   - 24-48 hour response time
   - Track in ticketing system

3. **Documentation Site**
   - Host README, INSTALLATION, FAQ
   - Keep up-to-date
   - Include video tutorials

4. **GitHub Issues** (if open source)
   - Bug reports
   - Feature requests
   - Community contributions

### SLA Commitments

- **Critical bugs**: Fix within 24 hours
- **Security issues**: Fix within 12 hours
- **Feature requests**: Review within 1 week
- **General questions**: Respond within 48 hours

## Version Numbering

Follow Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

Examples:
- 1.0.0 - Initial release
- 1.0.1 - Bug fix
- 1.1.0 - Add Tableau support
- 2.0.0 - Complete redesign, new API

## Success Metrics

Track these KPIs:

- **Installations**: Target 1000+ in first month
- **Active users**: Target 70% DAU/MAU ratio
- **Rating**: Maintain 4.5+ stars
- **Reviews**: Positive/negative ratio
- **Support tickets**: Response time, resolution rate
- **API usage**: Calls per user, error rate

## Maintenance Schedule

- **Weekly**: Monitor reviews, check crash reports
- **Monthly**: Review analytics, plan features
- **Quarterly**: Security audit, dependency updates
- **Yearly**: Major version release, roadmap update

---

## Quick Deployment Commands

```bash
# Clean and package
cd chrome-extension
rm -rf .git node_modules *.md icon-generator.html
zip -r ../adoc-reliability-metrics-v1.0.0.zip .

# Verify package
unzip -l ../adoc-reliability-metrics-v1.0.0.zip

# Test package locally
# Load unpacked from chrome://extensions/
```

## Checklist for First Release

- [ ] Code complete and tested
- [ ] Icons generated (16, 48, 128)
- [ ] Screenshots captured (5 images)
- [ ] Privacy policy written and hosted
- [ ] Store listing text written
- [ ] Developer account registered
- [ ] ZIP file created and verified
- [ ] Submission form completed
- [ ] Extension submitted
- [ ] Review process monitored
- [ ] Publication confirmed
- [ ] Social media announcement
- [ ] Documentation updated with extension ID
- [ ] Support channels active
- [ ] Analytics configured

---

**Ready to Deploy!** 🚀

Follow this guide step-by-step for successful Chrome Web Store deployment.
