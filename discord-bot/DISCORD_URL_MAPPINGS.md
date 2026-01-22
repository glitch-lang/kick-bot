# 🔗 Discord URL Mappings Setup

## Overview

Discord Activities use **URL Mappings** to securely proxy external resources like the Kick player. Instead of loading `https://player.kick.com` directly (which violates Discord's CSP), we use relative paths that Discord proxies for us.

---

## 🎯 How It Works

```
Your Activity → /.proxy/kick-player/username → Discord Proxy → https://player.kick.com/username
```

**Benefits:**
- ✅ Follows Discord's security model
- ✅ Bypasses CSP/X-Frame-Options issues
- ✅ No parent domain configuration needed
- ✅ Works across all Discord platforms

---

## 📝 Required URL Mappings

You need to add these in **Discord Developer Portal → Your App → Activities → URL Mappings**:

### Mapping 1: Kick Player

| Field | Value |
|-------|-------|
| **Prefix** | `/kick-player` |
| **Target** | `https://player.kick.com` |

**Result:** `/.proxy/kick-player/username` → `https://player.kick.com/username`

---

### Mapping 2: Kick Chat

| Field | Value |
|-------|-------|
| **Prefix** | `/kick-chat` |
| **Target** | `https://kick.com/popout` |

**Result:** `/.proxy/kick-chat/username/chat` → `https://kick.com/popout/username/chat`

---

## 🛠️ Step-by-Step Setup

### 1. Go to Discord Developer Portal
- Visit: https://discord.com/developers/applications
- Select your application: **Kick Party** (ID: `1463251183262109798`)

### 2. Navigate to Activities Settings
- Click **"Activities"** in the left sidebar
- Scroll to **"URL Mappings"** section

### 3. Add Kick Player Mapping
- Click **"Add URL Mapping"**
- **Prefix:** `/kick-player`
- **Target:** `https://player.kick.com`
- Click **Save**

### 4. Add Kick Chat Mapping
- Click **"Add URL Mapping"** again
- **Prefix:** `/kick-chat`
- **Target:** `https://kick.com/popout`
- Click **Save**

### 5. Update Root URL Mapping (if exists)
- **Prefix:** `/` (root)
- **Target:** `https://web-production-2a269.up.railway.app`

---

## 📋 Complete URL Mappings Table

After setup, your mappings should look like this:

| Prefix | Target | Purpose |
|--------|--------|---------|
| `/` | `https://web-production-2a269.up.railway.app` | Your Activity UI |
| `/kick-player` | `https://player.kick.com` | Kick stream player |
| `/kick-chat` | `https://kick.com/popout` | Kick stream chat |

---

## 💻 Code Changes Made

### Before (Direct URLs - WRONG):
```javascript
kickPlayer.src = `https://player.kick.com/${streamer}?parent=${domain}`;
kickChatIframe.src = `https://kick.com/popout/${streamer}/chat`;
```

**Problems:**
- ❌ Violates Discord CSP
- ❌ Requires parent domain whitelisting
- ❌ May be blocked by X-Frame-Options

### After (Proxied URLs - CORRECT):
```javascript
kickPlayer.src = `/.proxy/kick-player/${streamer}`;
kickChatIframe.src = `/.proxy/kick-chat/${streamer}/chat`;
```

**Benefits:**
- ✅ Uses Discord's secure proxy
- ✅ No CSP violations
- ✅ Works everywhere

---

## 🧪 Testing

After setting up URL Mappings:

1. **Launch Activity in Discord**
2. **Open Browser DevTools** (if using Discord web)
3. **Check Network tab** for:
   ```
   /.proxy/kick-player/username → 200 OK
   /.proxy/kick-chat/username/chat → 200 OK
   ```

4. **Verify player loads**:
   - Should see Kick stream playing
   - No "Refused to Connect" errors
   - Chat should load in sidebar

---

## ⚠️ Common Issues

### "Failed to load resource"
**Cause:** URL Mappings not set up
**Fix:** Add the mappings in Discord Developer Portal

### "Refused to Connect"
**Cause:** Incorrect target URL
**Fix:** Ensure targets are exactly:
- `https://player.kick.com` (no trailing slash)
- `https://kick.com/popout` (no trailing slash)

### Player loads but shows "404"
**Cause:** Streamer username incorrect
**Fix:** Verify streamer exists on Kick

### Chat not loading
**Cause:** Wrong chat URL path
**Fix:** Should be `/.proxy/kick-chat/${streamer}/chat` (with `/chat` at end)

---

## 📚 Official Documentation

- **Discord Activities Overview:** https://discord.com/developers/docs/activities/overview
- **URL Mappings:** https://discord.com/developers/docs/activities/building-an-activity#url-mappings
- **Kick Embed Player:** https://player.kick.com/[username]

---

## 🔐 Security Benefits

Discord's URL Mapping system provides:

1. **Content Security Policy (CSP) Compliance**
   - All external resources proxied through Discord
   - Prevents unauthorized API calls

2. **X-Frame-Options Bypass**
   - Discord's proxy handles framing permissions
   - No need to whitelist domains

3. **Centralized Control**
   - Change targets without code updates
   - Discord handles HTTPS/CORS

4. **Cross-Platform Compatibility**
   - Works on Desktop, Web, Mobile
   - Consistent behavior everywhere

---

## 🎯 Next Steps

1. ✅ **Set up URL Mappings** (see steps above)
2. ✅ **Deploy updated code** (already pushed to Railway)
3. ✅ **Test in Discord** (launch Activity and verify player loads)
4. ✅ **Monitor console** (check for any errors)

---

## 📞 Support

If Kick player still doesn't load after setup:
1. Check Discord Developer Portal for mapping typos
2. Verify Railway URL is correct in root mapping
3. Test with a known-live Kick stream
4. Check browser console for specific error messages
