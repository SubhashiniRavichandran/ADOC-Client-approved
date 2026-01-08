# ADOC Reliability Metrics - Chrome Extension

A Chrome extension that integrates Acceldata's Data Observability Cloud (ADOC) with Power BI reports.

## Quick Links

- **Extension Code**: [`chrome-extension/`](./chrome-extension/)
- **Installation Guide**: [`chrome-extension/INSTALLATION.md`](./chrome-extension/INSTALLATION.md)
- **Quick Start**: [`chrome-extension/QUICKSTART.md`](./chrome-extension/QUICKSTART.md)
- **Deployment Guide**: [`chrome-extension/DEPLOYMENT.md`](./chrome-extension/DEPLOYMENT.md)
- **Project Summary**: [`PROJECT_SUMMARY.md`](./PROJECT_SUMMARY.md)

## What It Does

This Chrome extension allows Power BI users to:
- ✅ Check data quality instantly without leaving Power BI
- ✅ View reliability scores for all assets in their reports
- ✅ See open data quality alerts
- ✅ Get quick links to ADOC dashboard for detailed analysis
- ✅ Make informed decisions based on real-time data health

## Features

- 🎯 **Automatic Detection**: Detects Power BI reports and extracts data assets
- 📊 **Reliability Metrics**: Shows data quality scores, freshness, and alerts
- 🔗 **ADOC Integration**: Seamless connection to Acceldata platform
- 🎨 **Beautiful UI**: Clean, modern interface matching design specs
- ⚡ **Fast & Efficient**: Lightweight with minimal permissions
- 🔒 **Secure**: HTTPS-only, encrypted storage, privacy-focused

## Getting Started

### Prerequisites

- Google Chrome 120+
- Power BI Service account (app.powerbi.com)
- ADOC account at https://indiumtech.acceldata.app/

### Installation (5 minutes)

1. **Generate Icons**:
   ```bash
   # Open in browser
   chrome-extension/icons/icon-generator.html
   # Download all 3 icon sizes and save to icons/ folder
   ```

2. **Load Extension**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `chrome-extension` folder

3. **Use It**:
   - Open a Power BI report
   - Click the extension icon
   - Login to ADOC
   - Click "Fetch Reliability Data"

See [`INSTALLATION.md`](./chrome-extension/INSTALLATION.md) for detailed instructions.

## Project Structure

```
.
├── chrome-extension/          # Chrome extension code
│   ├── manifest.json         # Extension configuration
│   ├── html/                 # UI pages
│   ├── js/                   # JavaScript logic
│   ├── css/                  # Stylesheets
│   ├── icons/                # Extension icons
│   ├── README.md            # Complete documentation
│   ├── INSTALLATION.md      # Installation guide
│   ├── DEPLOYMENT.md        # Deployment guide
│   └── QUICKSTART.md        # Quick start guide
├── PROJECT_SUMMARY.md        # Complete project summary
└── README.md                 # This file
```

## Documentation

- **[Extension README](./chrome-extension/README.md)** - Complete project documentation
- **[INSTALLATION.md](./chrome-extension/INSTALLATION.md)** - Step-by-step installation
- **[QUICKSTART.md](./chrome-extension/QUICKSTART.md)** - 5-minute quick start
- **[DEPLOYMENT.md](./chrome-extension/DEPLOYMENT.md)** - Chrome Web Store deployment
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Project overview & statistics

## Technical Details

- **Manifest Version**: 3 (latest Chrome standard)
- **Permissions**: storage, activeTab, notifications (minimal)
- **Supported BI Tools**: Power BI (Tableau & Looker coming soon)
- **API Integration**: ADOC REST APIs
- **Architecture**: Service worker, content scripts, popup UI
- **Security**: HTTPS-only, encrypted storage, CSP enforced

## Support

- **Email**: support@acceldata.io
- **Documentation**: See docs in `chrome-extension/` folder
- **ADOC Help**: docs.acceldata.io

## Version

**Current Version**: 1.0.0
**Release Date**: January 8, 2026
**Status**: ✅ Complete and Ready for Testing

## Next Steps

1. Generate icons using `icon-generator.html`
2. Load extension in Chrome
3. Test with Power BI reports
4. Configure API credentials
5. Deploy to Chrome Web Store (see DEPLOYMENT.md)

---

**Ready to check data quality!** 🚀

For detailed instructions, see [INSTALLATION.md](./chrome-extension/INSTALLATION.md)
