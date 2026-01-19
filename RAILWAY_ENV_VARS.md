# Railway Environment Variables - Copy & Paste

## 📋 Add These to Railway Dashboard

Go to: **Railway Dashboard → Your Project → Variables Tab**

Then add each variable below:

---

### ✅ Required Variables

```
KICK_CLIENT_ID=01KFBYN2H0627PRTF8WAB9R446
```

```
KICK_CLIENT_SECRET=c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed
```

```
KICK_REDIRECT_URI=https://comfortable-spontaneity-production.up.railway.app/auth/kick/callback
```
**⚠️ Replace with your actual Railway URL if different!**

```
BOT_USERNAME=YOUR_BOT_KICK_USERNAME_HERE
```
**⚠️ Replace with your bot's actual Kick username (e.g., CrossStreamBot)**

```
BOT_ACCESS_TOKEN=YOUR_BOT_OAUTH_TOKEN_HERE
```
**⚠️ Replace with your bot's OAuth access token**

```
JWT_SECRET=047d558dd35bb13e8bf257c9d0928a4945b566fcca2629a3927dae1c330670fd
```

```
PORT=3000
```

```
NODE_ENV=production
```

```
DB_PATH=./data/kickbot.db
```

---

## 🔧 How to Add in Railway

1. **Go to Railway Dashboard**
   - https://railway.app
   - Click your project: `comfortable-spontaneity`

2. **Click "Variables" Tab**

3. **Click "New Variable"** for each one

4. **Copy & Paste:**
   - Variable Name: `KICK_CLIENT_ID`
   - Value: `01KFBYN2H0627PRTF8WAB9R446`
   - Click "Add"

5. **Repeat for each variable**

---

## 🤖 Bot Token & Username Setup

### Step 1: Create Bot Account
1. Go to [kick.com](https://kick.com)
2. Create new account
3. Choose username (e.g., `CrossStreamBot`)
4. **Note the username** - you'll need it!

### Step 2: Get Bot Token

**Option A: Via OAuth Flow**
1. Visit: `https://comfortable-spontaneity-production.up.railway.app/auth/kick`
2. Log in with **bot account** (not your personal account)
3. Authorize the app
4. Get token from callback URL or server logs

**Option B: Manual Token**
1. Use Kick Developer App
2. Authorize with bot account
3. Get access token with `chat:write` scope
4. Copy the token

### Step 3: Add to Railway
- `BOT_USERNAME` = Your bot's Kick username
- `BOT_ACCESS_TOKEN` = The OAuth token you got

---

## ✅ Quick Copy List

Copy these exact values to Railway:

| Variable | Value |
|----------|-------|
| `KICK_CLIENT_ID` | `01KFBYN2H0627PRTF8WAB9R446` |
| `KICK_CLIENT_SECRET` | `c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed` |
| `KICK_REDIRECT_URI` | `https://comfortable-spontaneity-production.up.railway.app/auth/kick/callback` |
| `BOT_USERNAME` | `YOUR_BOT_USERNAME` ← **Change this!** |
| `BOT_ACCESS_TOKEN` | `YOUR_BOT_TOKEN` ← **Change this!** |
| `JWT_SECRET` | `047d558dd35bb13e8bf257c9d0928a4945b566fcca2629a3927dae1c330670fd` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `DB_PATH` | `./data/kickbot.db` |

---

## 🚨 Important Notes

1. **Replace `YOUR_BOT_USERNAME`** with your actual bot Kick username
2. **Replace `YOUR_BOT_TOKEN`** with your bot's OAuth access token
3. **Update `KICK_REDIRECT_URI`** if your Railway URL is different
4. **After adding variables**, Railway will auto-redeploy

---

**Once all variables are added, Railway will redeploy automatically!**
