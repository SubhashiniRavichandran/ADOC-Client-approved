# 🚀 ADOC Extension v1.1.0 - Quick Update Guide

## 📦 What You Need

**File:** `ADOC-Extension-v1.1.0-ENCRYPTED.zip` (41 KB)

**Location:** Root directory of repository

---

## 🎯 What Changed in 30 Seconds

### 🔒 Security: AES-256 Encryption
```
Before: Tokens stored as plain text
After:  Tokens encrypted with AES-256-GCM
```

### ⚡ User Flow: Streamlined
```
Before: Login → Fetch Screen → Click Fetch → Results
After:  Login → Auto-Fetch → Results
```

### 🚪 New Feature: Logout
```
Can logout from:
- Results view (top-right icon)
- Error view (bottom button)
```

### 🚨 New Feature: Error View
```
Shows when: Power BI assets not found in ADOC
Options: Fetch Again | Logout
```

---

## 📁 Files Changed

### NEW ✨
- `js/encryption.js` - AES-256 encryption service
- `CHANGES.md` - Complete changelog

### MODIFIED 🔧
- `js/popup.js` - Rewritten with encryption + auto-fetch
- `js/background.js` - Uses encrypted storage
- `html/popup.html` - Removed fetch view, added error view
- `css/popup.css` - Logout and error styles
- `manifest.json` - Added encryption.js

---

## 🔄 User Flow Diagram

### Before (v1.0.0)
```
┌─────────┐
│  LOGIN  │
└────┬────┘
     │
     ▼
┌─────────────────┐
│  FETCH SCREEN   │ ← Extra click needed
│ (Click "Fetch") │
└────┬────────────┘
     │
     ▼
┌─────────┐
│FETCHING │
└────┬────┘
     │
     ▼
┌─────────┐
│ RESULTS │
└─────────┘
```

### After (v1.1.0)
```
┌─────────┐
│  LOGIN  │
└────┬────┘
     │
     ▼ (automatic)
┌───────────┐
│ FETCHING  │
└─────┬─────┘
      │
      ├─────────────┐
      │             │
      ▼             ▼
┌──────────┐  ┌─────────────┐
│ RESULTS  │  │ NO ASSETS   │
│          │  │   ERROR     │
└────┬─────┘  └─────┬───────┘
     │              │
     ▼              ▼
  LOGOUT        LOGOUT
     │              │
     └──────┬───────┘
            ▼
      ┌─────────┐
      │  LOGIN  │
      └─────────┘
```

---

## 🛠️ Installation Steps

### 1. Extract
```bash
unzip ADOC-Extension-v1.1.0-ENCRYPTED.zip
```

### 2. Load in Chrome
```
chrome://extensions/
→ Developer mode: ON
→ Load unpacked
→ Select: chrome-extension folder
```

### 3. Test
```
1. Click extension icon
2. Login to ADOC
3. See notification
4. Click extension icon again
5. Data auto-fetches ✨
```

---

## 🔐 Security Features

| Feature | v1.0.0 | v1.1.0 |
|---------|--------|--------|
| Token Storage | Plain text | AES-256 encrypted |
| Key Derivation | N/A | PBKDF2 100K iterations |
| Cached Data | Plain text | Encrypted |
| Logout | No | Yes |
| Data Cleanup | Manual | Automatic on logout |

---

## ⚠️ Important Notes

1. **Re-login Required**
   - Old credentials (v1.0.0) will not work
   - Users must login again after update

2. **Storage Format Changed**
   - From: Plain text in chrome.storage.local
   - To: Encrypted base64 strings

3. **No Backwards Compatibility**
   - v1.1.0 will not read v1.0.0 credentials
   - This is intentional for security

---

## 🧪 Quick Test

```bash
# 1. Check encryption is working
Open Chrome DevTools → Application → Storage → Local Storage
Look for: encrypted base64 strings (not plain text)

# 2. Test auto-fetch
Login → Should automatically fetch (no manual click)

# 3. Test logout
Click logout icon → Should return to login screen
Check storage → Should be empty

# 4. Test error view
Open extension on non-Power BI page
Should see: "No Assets Found" error screen
```

---

## 📊 Code Statistics

| Metric | Count |
|--------|-------|
| Files Modified | 5 |
| Files Created | 2 |
| Lines Added | 592 |
| Lines Removed | 165 |
| Net Change | +427 lines |

---

## 🎉 Ready to Go!

1. Extract `ADOC-Extension-v1.1.0-ENCRYPTED.zip`
2. Load in Chrome
3. Login and test

**All code committed to:** `claude/chrome-extension-powerbi-sidebar-lbFbO`

**For detailed info, see:** `UPDATE_SUMMARY.md`

---

**Questions?** Check `chrome-extension/CHANGES.md` for complete changelog.
