# ADOC Reliability Metrics - Chrome Extension

A Chrome extension that integrates ADOC (Acceldata Data Observability Cloud) with Power BI reports, allowing users to check data quality and reliability metrics directly within their Power BI workflow.

## Features

- **Automatic Detection**: Automatically detects Power BI reports and extracts data assets
- **Reliability Metrics**: Displays data reliability scores, freshness, and alert information
- **Quick Links**: Direct links to ADOC dashboard for detailed analysis
- **Asset-by-Asset View**: Scrollable list of all assets with their reliability metrics
- **Health Status**: Clear indication of report health (Healthy/Risky) based on open alerts

## Installation

### For Development

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `chrome-extension` folder

### From Chrome Web Store

*(Coming soon)*

## Usage

1. **Login**: Click the extension icon and click "Login to Acceldata" to authenticate
2. **Navigate**: Open a Power BI report at `app.powerbi.com`
3. **Fetch Data**: Click the extension icon and click "Fetch Reliability Data"
4. **View Results**: See reliability metrics for all assets in the report

## Configuration

The extension connects to: `https://indiumtech.acceldata.app/`

To configure API credentials:
1. Right-click the extension icon
2. Select "Options"
3. Enter your ADOC API credentials

## Architecture

### Components

- **manifest.json**: Chrome extension configuration
- **popup.html/js/css**: Extension popup interface with 4 views:
  - Login view
  - Fetch data view
  - Fetching/loading view
  - Results view
- **background.js**: Service worker for API communication
- **content.js**: Content script for Power BI page interaction
- **sidebar.css**: Styles for potential sidebar injection

### API Integration

The extension integrates with ADOC APIs:
- Asset Search API: Find assets matching Power BI tables
- Reliability Score API: Get data quality metrics
- Alerts API: Fetch active data quality alerts
- Lineage API: Get upstream/downstream dependencies

## Power BI Asset Detection

The extension uses multiple methods to extract assets:

1. **Visual Analysis**: Scans visual elements for data field references
2. **Field List**: Extracts tables/columns from field list panel
3. **Dataset References**: Identifies semantic models and datasets

## Views

### 1. Login View (1st_view.png)
- ADOC logo
- Tagline: "Check data quality instantly and make decisions you can trust"
- Login button redirects to ADOC platform

### 2. Fetch Data View (afterlogin_2view.png)
- Database icon
- Instructions to fetch reliability data
- "Fetch Reliability Data" button

### 3. Fetching View (try2fetch_3view.png)
- Loading spinner
- Status indicators (green, orange, red dots)
- "Fetching..." text

### 4. Results View
- **Report Summary**:
  - Report Status (Healthy/Risky badge)
  - Total Assets fetched
  - Assets with Alerts (with quick link)

- **Reliability Details**:
  - No alerts message (if healthy)
  - Asset cards (if has alerts) showing:
    - Asset name and type
    - Data Reliability Score
    - Data Freshness
    - Last Profiled date
    - Open Alerts count with link
    - Upstream Issues count

## Permissions

- `storage`: Store authentication state and cached results
- `activeTab`: Access current Power BI tab
- `notifications`: Show data quality notifications

## Host Permissions

- `https://app.powerbi.com/*`: Access Power BI reports
- `https://indiumtech.acceldata.app/*`: Connect to ADOC platform

## Development

### File Structure

```
chrome-extension/
├── manifest.json
├── html/
│   └── popup.html
├── js/
│   ├── popup.js
│   ├── background.js
│   └── content.js
├── css/
│   ├── popup.css
│   └── sidebar.css
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Testing

1. Open Power BI report
2. Click extension icon
3. Test each view transition
4. Verify asset extraction
5. Check API integration
6. Validate UI matches designs

## Mock Data

For testing without ADOC API connection, the extension includes mock data generation with:
- Random reliability scores (70-100%)
- Random alert counts
- Sample asset names
- Realistic metrics

## Browser Compatibility

- Chrome 120+
- Microsoft Edge 120+ (Chromium-based)

## Security

- API credentials stored encrypted in Chrome storage
- HTTPS-only connections to ADOC
- No sensitive data logged to console
- Content Security Policy enforced

## Support

For issues or questions:
- GitHub Issues: *(repository link)*
- Email: support@acceldata.io
- Documentation: docs.acceldata.io

## License

*(Add appropriate license)*

## Version History

### 1.0.0 (2026-01-08)
- Initial release
- Power BI integration
- Login flow
- Asset extraction
- Reliability metrics display
- Alert notification

## Future Enhancements

- Tableau integration
- Looker integration
- Real-time notifications
- Configurable thresholds
- Export functionality
- Historical trends
- Advanced filtering

## Credits

Developed for Acceldata by Indium Technologies
