# How to Find Your Railway Deployment URL

## 🔍 Step 1: Get Your Railway App URL

1. **Go to your Railway dashboard:**
   ```
   https://railway.com/project/5766e972-c72c-4650-8089-4ce152625433/service/5edd1dff-ac48-40a1-b7ee-02a2850d8f00
   ```

2. **Look for "Settings" tab** in your service

3. **Find "Domains" or "Public URL" section**
   - Railway automatically generates a URL like:
     - `https://your-app-name.up.railway.app`
     - Or `https://your-app-name-production.up.railway.app`

4. **Copy that URL** - this is your deployment URL!

---

## 🔧 Step 2: Set Up OAuth Redirect URI

### In Railway Variables:
Add/Update:
- Variable: `KICK_REDIRECT_URI`
- Value: `https://your-railway-app-url.up.railway.app/auth/kick/callback`
  - Replace `your-railway-app-url` with your actual Railway URL

### In Kick Developer App:
1. Go to [dev.kick.com](https://dev.kick.com)
2. Open your Developer App
3. Find "Redirect URIs" or "Callback URLs"
4. Add: `https://your-railway-app-url.up.railway.app/auth/kick/callback`
5. **IMPORTANT:** Must match EXACTLY (including `https://` and `/auth/kick/callback`)

---

## 📋 Quick Checklist

- [ ] Found Railway deployment URL (not dashboard URL)
- [ ] Added `KICK_REDIRECT_URI` to Railway Variables
- [ ] Added same URL to Kick Developer App redirect URIs
- [ ] URLs match EXACTLY in both places
- [ ] Railway has redeployed

---

## 🆘 Can't Find the URL?

### Option 1: Check Railway Logs
- Railway Dashboard → Your Service → **Logs**
- Look for: `Server running on http://0.0.0.0:PORT`
- Railway exposes this on a public URL automatically

### Option 2: Check Railway Settings
- Railway Dashboard → Your Service → **Settings**
- Look for "Domains" or "Networking" section
- Should show your public URL

### Option 3: Generate Custom Domain
- Railway Dashboard → Your Service → **Settings** → **Domains**
- Click "Generate Domain" if not visible
- Railway will create: `your-service-name.up.railway.app`

---

## ⚠️ Important Notes

- **Dashboard URL ≠ Deployment URL**
  - Dashboard: `https://railway.com/project/...` ❌
  - Deployment: `https://your-app.up.railway.app` ✅

- **Redirect URI must match exactly:**
  - ✅ `https://your-app.up.railway.app/auth/kick/callback`
  - ❌ `https://your-app.up.railway.app/auth/kick/callback/` (trailing slash)
  - ❌ `http://your-app.up.railway.app/auth/kick/callback` (http vs https)

---

**Once you have the URL, use it for `KICK_REDIRECT_URI` in Railway Variables!**
