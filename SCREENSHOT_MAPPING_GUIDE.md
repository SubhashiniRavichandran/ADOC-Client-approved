# Screenshot Mapping Guide for ADOC Extension Documentation

## Overview
This guide maps the 5 screenshots to specific locations in the documentation files.

---

## Screenshot Files Needed

### Screenshot 1: Login Screen
**File Name:** `screenshot_01_login_screen.png`

**Description:**
- ADOC logo (dark blue "a")
- Chart icon
- Tagline: "Check data quality instantly and make decisions you can trust"
- Blue button: "Login to Acceldata"

**Use In:**
- USER_GUIDE_FORMATTED.html → Line 207 (Quick Start - Step 2)
- DEPLOYMENT_GUIDE_FORMATTED.html → Line 543 (Post-Deployment - Step 1)

---

### Screenshot 2: Healthy Scenario
**File Name:** `screenshot_02_healthy_scenario.png`

**Description:**
- Green "Healthy" badge (top)
- Report Status: Healthy
- Total Assets: 175
- Assets with Alerts: 0
- Large green checkmark/shield icon
- Message: "There are no assets with open alerts powering this report"

**Use In:**
- USER_GUIDE_FORMATTED.html → Line 288 (Scenario 1 - Full View)

---

### Screenshot 3: No Assets Found Error
**File Name:** `screenshot_03_no_assets_error.png`

**Description:**
- Orange warning triangle icon (large, centered)
- Error message: "We couldn't find the datasets powering this report in Acceldata"
- "Fetch Again" button with circular arrow icon
- "Logout" button

**Use In:**
- USER_GUIDE_FORMATTED.html → Line 564 (Scenario 3 - Error View)

---

### Screenshot 4: ADOC Platform Alerts (Split View)
**File Name:** `screenshot_04_adoc_platform_alerts.png`

**Description:**
- **Left side:** Extension popup showing:
  - TRANSACTIONS_DATA asset card
  - Cyan badge icon
  - Reliability Score: 92.12% (green)
  - Data Freshness: 100%
  - Last Profiled: 25 Jun 2024
  - Open Alerts: 2 (with link icon)
  - Upstream Issues: 5 (with link icon)

- **Right side:** ADOC platform page showing:
  - Alerts listing
  - "Listing" tab active
  - Alert details table

**Use In:**
- USER_GUIDE_FORMATTED.html → Line 516 (Scenario 2 - Step 2 - ADOC Platform View)

---

### Screenshot 5: Risky Scenario with Asset Cards
**File Name:** `screenshot_05_risky_scenario_cards.png`

**Description:**
- Amber/Orange "Risky" badge (top)
- Report Status: Risky
- Total Assets: 175
- Assets with Alerts: 25

**Visible Asset Cards:**
1. **TRANSACTIONS_DATA**
   - Cyan badge
   - Table icon
   - 92.12% (green score)
   - 100% freshness
   - 25 Jun 2024, 14:24 PM
   - 2 open alerts
   - 5 upstream issues

2. **PharmaSalesbyDistributor**
   - Red badge
   - Document icon
   - 92.12% (green score)
   - 100% freshness
   - 15 Feb 2024
   - 1 open alert
   - 0 upstream issues

3. **Customer_details** (partially visible)
   - Blue badge
   - Table icon
   - 76.3% (amber score)

**Use In:**
- USER_GUIDE_FORMATTED.html → Line 349 (Scenario 2 - Full View)
- USER_GUIDE_FORMATTED.html → Line 495 (Scenario 2 - Multiple Asset Cards)

---

## Insertion Instructions

### Method 1: Using Microsoft Word

1. Open the HTML file in Microsoft Word:
   - Right-click `USER_GUIDE_FORMATTED.html`
   - Select "Open with" → Microsoft Word

2. Find the placeholder box:
   - Search for `[INSERT SCREENSHOT]`
   - Or look for gray dashed boxes

3. Insert image:
   - Click inside the placeholder box
   - Delete the placeholder text
   - Insert → Pictures → This Device
   - Select the corresponding screenshot file
   - Resize to fit page width (6.5 inches recommended)

4. Add caption (optional):
   - Right-click image → Insert Caption
   - Use the description from this guide

5. Repeat for all placeholders

6. Save as DOCX:
   - File → Save As
   - Choose "Word Document (*.docx)"

---

### Method 2: Direct HTML Editing (Base64)

If you want to embed images directly in HTML:

```bash
# Convert image to base64
base64 screenshot_01_login_screen.png > screenshot_01.txt

# Or use online tool:
# https://www.base64-image.de/
```

Then replace placeholder in HTML:

```html
<!-- Replace this: -->
<div class="screenshot">
<strong>[INSERT SCREENSHOT]</strong><br>
Login screen with ADOC logo
</div>

<!-- With this: -->
<div class="screenshot">
<img src="data:image/png;base64,iVBORw0KGgoAAAANS..."
     alt="Login screen with ADOC logo"
     style="max-width: 100%; border: 1px solid #e5e7eb;">
</div>
```

---

### Method 3: File Reference (Recommended for Web)

Create a `screenshots/` folder next to the HTML files and reference:

```html
<div class="screenshot">
<img src="screenshots/screenshot_01_login_screen.png"
     alt="Login screen with ADOC logo"
     style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;">
</div>
```

---

## Complete Screenshot Placement Map

### USER_GUIDE_FORMATTED.html

| Line | Placeholder Text | Screenshot File | Section |
|------|-----------------|-----------------|---------|
| 196-199 | Chrome toolbar showing ADOC icon | screenshot_01_login_screen.png (cropped to toolbar) | Quick Start - Step 1 |
| 206-209 | Login screen with ADOC logo | **screenshot_01_login_screen.png** | Quick Start - Step 2 |
| 216-219 | Acceldata login page in new tab | (Not provided - needs new screenshot) | Quick Start - Step 3 |
| 240-243 | Success notification | (Not provided - needs new screenshot) | Quick Start - Step 5 |
| 250-253 | Fetching screen with spinner | (Not provided - needs new screenshot) | Quick Start - Step 6 |
| 288-296 | Healthy scenario full view | **screenshot_02_healthy_scenario.png** | Scenario 1 |
| 349-356 | Risky scenario full view | **screenshot_05_risky_scenario_cards.png** | Scenario 2 |
| 397-409 | Single asset card close-up | screenshot_05 (cropped to single card) | Scenario 2 - Asset Card |
| 495-498 | Multiple asset cards scrollable | **screenshot_05_risky_scenario_cards.png** | Scenario 2 - Multiple Cards |
| 516-519 | ADOC platform alerts page | **screenshot_04_adoc_platform_alerts.png** | Scenario 2 - Step 2 |
| 547-550 | Extension header with refresh | screenshot_05 (cropped to header) | Scenario 2 - Step 5 |
| 564-570 | Error view with orange warning | **screenshot_03_no_assets_error.png** | Scenario 3 |
| 667-669 | Refresh button highlighted | screenshot_05 (cropped to header, refresh circled) | Feature 1 - Refresh |
| 697-700 | Link icon highlighted | screenshot_05 (cropped to asset card, link circled) | Feature 2 - View in ADOC |
| 728-730 | Copy button highlighted | screenshot_05 (cropped to asset card, copy circled) | Feature 3 - Copy |
| 758-760 | Logout button highlighted | screenshot_05 (cropped to header, logout circled) | Feature 4 - Logout |
| 893-895 | Grayed out ADOC icon | (Not provided - needs new screenshot) | Troubleshooting |
| 912-914 | Stuck fetching screen | (Not provided - needs new screenshot) | Troubleshooting |

### DEPLOYMENT_GUIDE_FORMATTED.html

| Line | Placeholder Text | Screenshot File | Section |
|------|-----------------|-----------------|---------|
| 227-230 | Extracted folder structure | (Not provided - needs new screenshot) | Method 1 - Step 1 |
| 243-246 | Google Workspace Admin login | (Not provided - needs new screenshot) | Method 1 - Step 2 |
| 263-266 | Chrome Apps & Extensions settings | (Not provided - needs new screenshot) | Method 1 - Step 3 |
| 282-285 | Upload extension dialog | (Not provided - needs new screenshot) | Method 1 - Step 4 |
| 320-323 | Extension configuration settings | (Not provided - needs new screenshot) | Method 1 - Step 5 |
| 405-408 | Extracted chrome-extension folder | (Not provided - needs new screenshot) | Method 2 - Step 1 |
| 424-427 | Chrome extensions page | (Not provided - needs new screenshot) | Method 2 - Step 2 |
| 441-444 | Developer mode toggle enabled | (Not provided - needs new screenshot) | Method 2 - Step 3 |
| 461-464 | Load unpacked file browser | (Not provided - needs new screenshot) | Method 2 - Step 4 |
| 501-504 | Extension card installed | (Not provided - needs new screenshot) | Method 2 - Step 5 |
| 520-523 | Pin extension dropdown | (Not provided - needs new screenshot) | Method 2 - Step 6 |
| 543-545 | Login screen | **screenshot_01_login_screen.png** | Post-Deployment - Step 1 |
| 568-570 | Success notification | (Not provided - needs new screenshot) | Post-Deployment - Step 2 |
| 589-592 | Fetching screen | (Not provided - needs new screenshot) | Post-Deployment - Step 3 |

---

## Screenshots Provided vs. Needed

### ✅ Provided (5 screenshots):
1. screenshot_01_login_screen.png
2. screenshot_02_healthy_scenario.png
3. screenshot_03_no_assets_error.png
4. screenshot_04_adoc_platform_alerts.png
5. screenshot_05_risky_scenario_cards.png

### ❌ Still Needed (Additional screenshots):
1. Chrome toolbar with ADOC icon
2. Acceldata login page in browser tab
3. Success notification after login
4. Fetching screen with spinner animation
5. Grayed out ADOC icon (inactive state)
6. Extracted folder structure
7. Google Workspace Admin Console pages (5 different views)
8. Manual installation process (6 different views)
9. Extension card in chrome://extensions/
10. Pin extension dropdown

**Total Screenshots:**
- Provided: 5
- Needed for complete documentation: ~20-25

**Priority:** Use the 5 provided screenshots first, then capture additional ones as needed.

---

## Quick Actions

### To insert the 5 provided screenshots right now:

1. Save the 5 screenshot images to: `/home/user/ADOC-Client-approved/screenshots/`

2. Rename them:
   - screenshot_01_login_screen.png
   - screenshot_02_healthy_scenario.png
   - screenshot_03_no_assets_error.png
   - screenshot_04_adoc_platform_alerts.png
   - screenshot_05_risky_scenario_cards.png

3. Run this script to update HTML files:
   ```bash
   # See UPDATE_DOCS_WITH_SCREENSHOTS.sh script
   ```

---

## Notes

- All screenshots should be PNG format for best quality
- Recommended dimensions: 600-800px width
- Images will be automatically resized in Word
- Keep original files for future updates
- Consider adding red arrows/circles to highlight specific features

---

**Last Updated:** February 3, 2026
**Document Version:** 1.0
