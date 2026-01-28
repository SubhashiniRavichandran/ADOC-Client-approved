# ADOC Chrome Extension - Change Log

## Version 1.1.0 - Enhanced Security & UX (January 28, 2026)

### Major Features Added

#### 1. **AES-256 Encryption for Secure Storage**
- **New File**: `js/encryption.js`
- Implements AES-256-GCM encryption using Web Crypto API
- PBKDF2 key derivation with 100,000 iterations
- Secure storage methods: `secureStore()`, `secureRetrieve()`, `secureRemove()`
- All authentication tokens now encrypted in chrome.storage.local
- **Security Impact**: Tokens are no longer stored in plain text

#### 2. **Streamlined User Experience**
- **Removed**: Intermediate "Fetch Data" screen (afterlogin_2view.png)
- **New Flow**: Login → Auto-fetch → Results/Error
- Extension now automatically fetches data immediately after login
- Reduces clicks and improves user experience

#### 3. **"No Assets Found" Error View**
- **New View**: Dedicated error screen when Power BI assets not found in ADOC
- Displays warning icon with clear error message
- "Fetch Again" button to retry
- Logout option from error screen
- Matches design specification: noassetfound.png

#### 4. **Logout Functionality**
- **New Feature**: Logout button in results view header
- Logout button in error view for easy access
- Clears all encrypted authentication data
- Clears cached results
- Returns user to login screen
- Proper cleanup of all stored credentials

### Files Modified

#### New Files
- `js/encryption.js` - Complete AES-256-GCM encryption service

#### Updated Files
1. **popup.html**
   - Removed fetch-view section
   - Added no-assets-view with error messaging
   - Added logout buttons to results-view and no-assets-view
   - Added encryption.js script import

2. **popup.js**
   - Complete rewrite with encryption support
   - Uses `encryptionService` for all storage operations
   - Auto-fetch on authentication (removed manual fetch step)
   - New `handleLogout()` function
   - Enhanced `autoFetchData()` with no-assets detection
   - Improved error handling

3. **popup.css**
   - Added `.logout-btn` styles
   - Added `.header-actions` for button layout
   - Added `.error-icon` and `.error-message` styles
   - Added `.btn-secondary` for logout from error view

4. **background.js**
   - Imports encryption.js via `importScripts()`
   - Updated `startAuthenticationMonitoring()` to use encrypted storage
   - Authentication data now stored with `encryptionService.secureStore()`

5. **manifest.json**
   - Added encryption.js to web_accessible_resources

### User Flow Changes

#### Previous Flow (v1.0.0)
```
Login → Fetch Data Screen → Click "Fetch" → Fetching → Results
```

#### New Flow (v1.1.0)
```
Login → Auto-Fetching → Results (or No Assets Error)
                     ↓
                  Logout
```

### Security Enhancements

1. **Encryption Implementation**
   - Algorithm: AES-256-GCM (industry standard)
   - Key Derivation: PBKDF2 with SHA-256
   - Iterations: 100,000 (OWASP recommended)
   - Random IV generation for each encryption
   - Base64 encoding for storage compatibility

2. **Data Protected**
   - Authentication tokens
   - Login timestamps
   - Cached results
   - All sensitive user data

3. **Clean Logout**
   - Secure removal of encrypted data
   - Complete chrome.storage.local clear
   - No residual credentials

### UI/UX Improvements

1. **Faster Access**
   - One less click (auto-fetch after login)
   - Immediate data display
   - Reduced cognitive load

2. **Better Error Handling**
   - Dedicated error view for "no assets found"
   - Clear error messaging
   - Easy recovery options (Fetch Again, Logout)

3. **Logout Convenience**
   - Accessible from results view
   - Accessible from error view
   - Clean return to login screen

### Technical Improvements

1. **Code Quality**
   - Better separation of concerns
   - Consistent encryption pattern
   - Improved error handling
   - Null safety checks

2. **Performance**
   - Auto-fetch eliminates extra render
   - Cached encryption key derivation
   - Efficient DOM updates

3. **Maintainability**
   - Centralized encryption service
   - Reusable secure storage methods
   - Clear code documentation

### Testing Checklist

- [ ] Test login flow with encrypted storage
- [ ] Verify auto-fetch after successful login
- [ ] Test "No Assets Found" error view display
- [ ] Test logout from results view
- [ ] Test logout from error view
- [ ] Verify all encrypted data is cleared on logout
- [ ] Test "Fetch Again" button functionality
- [ ] Verify notification appears after login
- [ ] Test with real Power BI reports
- [ ] Test with reports that have no ADOC assets

### Breaking Changes

**None** - This is a backwards-compatible update. However, users will need to re-login after updating as the storage format has changed from plain text to encrypted.

### Migration Notes

When users update from v1.0.0 to v1.1.0:
1. Previous plain-text credentials will not be read
2. Users will see the login screen on first launch
3. After logging in, all new data will be encrypted
4. Old plain-text data can be manually cleared if needed

### Known Issues

None at this time.

### Future Enhancements

- Session timeout with auto-logout
- Biometric authentication support
- Multiple account support
- Encrypted backup/restore

---

## Version 1.0.0 - Initial Release (January 8, 2026)

### Features
- Power BI integration via content scripts
- ADOC API integration
- 4-view user interface (Login, Fetch, Fetching, Results)
- Asset reliability scoring
- Alert display
- Upstream issue tracking
- Comprehensive documentation

### Files
- Complete Chrome Manifest V3 extension
- Full documentation suite
- Icon generator tool
- Installation and deployment guides
