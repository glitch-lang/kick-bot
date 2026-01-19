# Add These Variables to Railway RIGHT NOW

## ✅ Your Railway URL Found!
**URL:** `https://web-production-56232.up.railway.app`

---

## 📋 Add These Variables to Railway

Go to: **Railway Dashboard → Your Service → Variables Tab**

### 1. KICK_CLIENT_ID
```
01KFBYN2H0627PRTF8WAB9R446
```

### 2. KICK_CLIENT_SECRET
```
c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed
```

### 3. KICK_REDIRECT_URI
```
https://web-production-56232.up.railway.app/auth/kick/callback
```

### 4. BOT_USERNAME
```
YOUR_BOT_USERNAME_HERE
```
**Replace with your bot account's Kick username** (e.g., `CrossStreamBot`)

### 5. BOT_ACCESS_TOKEN
```
YOUR_BOT_TOKEN_HERE
```
**You'll get this after authorizing your bot account** (see below)

### 6. JWT_SECRET
```
047d558dd35bb13e8bf257c9d0928a4945b566fcca2629a3927dae1c330670fd
```

### 7. PORT
```
3000
```

### 8. NODE_ENV
```
production
```

### 9. DB_PATH
```
./data/kickbot.db
```

---

## 🚀 Quick Steps

1. **Railway Dashboard** → Your Service → **Variables** tab
2. Click **"New Variable"** for each one above
3. Copy and paste the exact values
4. **For BOT_USERNAME and BOT_ACCESS_TOKEN:** See steps below
5. Railway will **auto-redeploy** after you add variables

---

## 🤖 Getting BOT_USERNAME and BOT_ACCESS_TOKEN

### Step 1: Create Bot Account
1. Go to [kick.com](https://kick.com)
2. Create a new account (separate from your personal account)
3. Choose a username (e.g., `CrossStreamBot`)
4. **Remember this username** - this is your `BOT_USERNAME`

### Step 2: Add BOT_USERNAME First
- Add `BOT_USERNAME` = Your bot account username to Railway Variables
- This is important! The system needs this to show you the token page

### Step 3: Get BOT_ACCESS_TOKEN
1. After adding all variables above (except BOT_ACCESS_TOKEN), Railway will redeploy
2. Visit: `https://web-production-56232.up.railway.app/auth/kick`
3. **Log in with your BOT ACCOUNT** (not your personal account!)
4. Authorize the app
5. You'll be redirected to a page showing the **long token**
6. Copy that token
7. Add to Railway: `BOT_ACCESS_TOKEN` = (paste the long token)

---

## ✅ After Adding Variables

1. Railway will automatically redeploy
2. Wait for deployment to complete (check Logs tab)
3. Visit: `https://web-production-56232.up.railway.app`
4. The error should be gone!

---

## 🔧 Also Update Kick Developer App

1. Go to [dev.kick.com](https://dev.kick.com)
2. Open your Developer App
3. Find "Redirect URIs" or "Callback URLs"
4. Add: `https://web-production-56232.up.railway.app/auth/kick/callback`
5. **Must match exactly!**

---

**Start with KICK_CLIENT_ID, KICK_CLIENT_SECRET, and KICK_REDIRECT_URI first!**
