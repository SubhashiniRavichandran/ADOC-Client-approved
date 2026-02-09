# How to Convert Documentation to DOCX Format

You have two options to create a professional Word document from the provided documentation.

## Option 1: Open HTML in Microsoft Word (Easiest)

### Steps:

1. **Locate the file:**
   - Find `ADOC_Extension_Client_Documentation.html` in the repository

2. **Open in Microsoft Word:**
   - Right-click the HTML file
   - Select "Open with" → "Microsoft Word"
   - Or: Open Word first, then File → Open → Select the HTML file

3. **Save as DOCX:**
   - File → Save As
   - Choose format: "Word Document (*.docx)"
   - Save with name: `ADOC_Extension_Client_Documentation.docx`

4. **Add Screenshots:**
   - Replace each gray box marked "[INSERT SCREENSHOT HERE]" with actual screenshots
   - To insert: Insert → Pictures → Select screenshot file
   - Resize to fit the placeholder area

**Result:** Professional Word document with proper formatting, styles, and page breaks.

---

## Option 2: Use Online Converter

### Steps:

1. **Go to online converter:**
   - Visit: https://cloudconvert.com/html-to-docx
   - Or: https://convertio.co/html-docx/

2. **Upload HTML file:**
   - Click "Select File"
   - Choose `ADOC_Extension_Client_Documentation.html`

3. **Convert:**
   - Click "Convert" button
   - Wait for processing (10-30 seconds)

4. **Download:**
   - Click "Download" to get the DOCX file

5. **Add Screenshots:**
   - Open in Word
   - Replace placeholders with actual screenshots

---

## Option 3: Use Pandoc (For Technical Users)

### Requirements:
- Install Pandoc: https://pandoc.org/installing.html

### Steps:

```bash
# Convert Markdown to DOCX
pandoc ADOC_Extension_Client_Documentation.md -o ADOC_Extension_Client_Documentation.docx

# Or convert HTML to DOCX
pandoc ADOC_Extension_Client_Documentation.html -o ADOC_Extension_Client_Documentation.docx
```

### Customize with reference document:

```bash
# Create custom styles
pandoc ADOC_Extension_Client_Documentation.md -o output.docx --reference-doc=custom-reference.docx
```

---

## Screenshots to Take

To complete the documentation, you need screenshots of these views:

### Scenario 1: Healthy
- **File naming:** `screenshot_healthy_view.png`
- **Content:** Extension popup showing green "Healthy" badge, 175 assets, 0 alerts, checkmark icon

### Scenario 2: Risky - Overview
- **File naming:** `screenshot_risky_overview.png`
- **Content:** Extension popup showing orange "Risky" badge, 175 assets, 25 with alerts

### Scenario 2: Risky - Asset Card Close-up
- **File naming:** `screenshot_asset_card_detail.png`
- **Content:** Single asset card showing all components (badge, icon, metrics, alerts, upstream)

### Scenario 2: Risky - Multiple Cards
- **File naming:** `screenshot_multiple_cards.png`
- **Content:** Scrollable list showing several asset cards

### Scenario 3: No Assets Found
- **File naming:** `screenshot_no_assets_error.png`
- **Content:** Error view with orange warning icon and "Fetch Again" / "Logout" buttons

### Installation Steps
- **File naming:** `screenshot_chrome_extensions.png`
- **Content:** Chrome extensions page with "Load unpacked" button highlighted

### Login Screen
- **File naming:** `screenshot_login_screen.png`
- **Content:** Extension login view with ADOC logo and "Login to Acceldata" button

### Power BI Integration
- **File naming:** `screenshot_powerbi_integration.png`
- **Content:** Power BI report open with extension icon showing green badge

### Side-by-Side Comparison
- **File naming:** `screenshot_all_scenarios.png`
- **Content:** All three scenarios (Healthy, Risky, No Assets) side by side

---

## How to Take Screenshots

### For Chrome Extension:

1. **Open Chrome Developer Tools:**
   - Press F12 or Ctrl+Shift+I (Windows/Linux)
   - Or Cmd+Option+I (Mac)

2. **Set Device Emulation:**
   - Click the device toggle icon (mobile/tablet icon)
   - Set dimensions: 320 x 749 px
   - This ensures clean screenshots at exact extension size

3. **Click Extension Icon:**
   - Open ADOC extension
   - Wait for view to load

4. **Take Screenshot:**
   - Windows: Win + Shift + S (Snipping Tool)
   - Mac: Cmd + Shift + 4 (Screenshot selection)
   - Or use Chrome: Ctrl+Shift+P → "Capture screenshot"

5. **Save with descriptive name**

### For Installation Steps:

1. Navigate to `chrome://extensions/`
2. Enable Developer mode
3. Take full window screenshot
4. Optionally: Use an image editor to highlight the "Load unpacked" button

---

## Inserting Screenshots in Word

### Method 1: Replace Placeholder

1. Click inside the gray placeholder box
2. Delete the placeholder text
3. Insert → Pictures → Select screenshot
4. Resize to fit the space (typically 6 inches wide)

### Method 2: Use Text Box

1. Click the gray placeholder
2. Insert → Text Box → Draw text box
3. Insert picture into text box
4. Add caption below: "Figure X: [Description]"

---

## Final Touches in Word

### 1. Table of Contents

- Place cursor at beginning of document (after title page)
- References → Table of Contents → Automatic Table 1
- Update later: Right-click TOC → Update Field

### 2. Page Numbers

- Insert → Page Number → Bottom of Page → Plain Number 3
- Don't add to first page (title page):
  - Double-click footer area
  - Check "Different First Page"

### 3. Headers and Footers

- Insert → Header → Edit Header
- Add: "ADOC Chrome Extension - Client Documentation"
- Add date: Insert → Date & Time

### 4. Adjust Styles

- Home → Styles pane
- Modify styles as needed:
  - Heading 1: 24pt, Bold, Dark Blue
  - Heading 2: 18pt, Bold, Light Blue
  - Heading 3: 14pt, Semibold, Gray

### 5. Review

- Review → Spelling & Grammar
- Review → Read Aloud (listen to document)
- Check all screenshots are visible
- Verify page breaks look good

---

## Recommended Screenshot Tools

### For Windows:
- **Snipping Tool** (Built-in): Win + Shift + S
- **Greenshot** (Free): https://getgreenshot.org
- **ShareX** (Free, Advanced): https://getsharex.com

### For Mac:
- **Screenshot** (Built-in): Cmd + Shift + 4
- **Skitch** (Free): https://evernote.com/products/skitch
- **CleanShot X** (Paid): https://cleanshot.com

### For Linux:
- **Flameshot** (Free): https://flameshot.org
- **Shutter** (Free): https://shutter-project.org

---

## Tips for Professional Screenshots

1. **Clean Background:** Close unnecessary tabs and windows
2. **High Resolution:** Use at least 1920x1080 screen resolution
3. **Consistent Size:** Keep all extension screenshots at 320x749px
4. **Annotations:** Add arrows or highlights to draw attention
5. **File Format:** Save as PNG for best quality
6. **Compression:** Use TinyPNG.com to reduce file size if needed
7. **Naming:** Use descriptive names (screenshot_healthy_view.png)

---

## Sample Document Structure After Screenshots

```
ADOC Chrome Extension
├── Title Page
├── Executive Summary
├── How It Works
├── Scenario 1: Healthy
│   ├── [Screenshot: Healthy view]
│   ├── Report Summary Table
│   └── Business Impact
├── Scenario 2: Risky
│   ├── [Screenshot: Risky overview]
│   ├── [Screenshot: Asset card detail]
│   ├── [Screenshot: Multiple cards]
│   ├── Sample Assets Table
│   └── Recommended Workflow
├── Scenario 3: No Assets Found
│   ├── [Screenshot: Error view]
│   └── Next Steps
├── Installation Guide
│   └── [Screenshot: Chrome extensions]
├── User Guide
│   ├── [Screenshot: Login screen]
│   ├── [Screenshot: Power BI integration]
│   └── Key Actions Table
├── Benefits Summary
├── Security & Privacy
├── FAQ
├── Appendix
│   └── [Screenshot: All scenarios side by side]
└── Contact Information
```

---

## File Delivery

**Files to share with client:**

1. **ADOC_Extension_Client_Documentation.docx** (after adding screenshots)
2. **ADOC-Extension-DEMO-v1.1.0.zip** (demo extension package)
3. **Screenshots folder** (optional, if client wants raw images)

**Recommended sharing method:**
- OneDrive, Google Drive, or Dropbox link
- Or: Email with files attached (if under 25MB)
- Or: Create a compressed archive with all files

---

## Need Help?

If you encounter issues converting or formatting:

1. Check Word version (2016 or later recommended)
2. Try different conversion method (HTML vs Markdown)
3. Use Google Docs as intermediate step:
   - Open HTML in Google Docs
   - Download as DOCX from File → Download
4. Contact: support@acceldata.io

---

**You're ready to create a professional client-facing document!**

Extract the HTML file, open in Word, add screenshots, and share with your client. ✅
