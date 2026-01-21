# 🔐 Setting Up Kick OAuth Login

This guide will enable users to log in with their real Kick accounts in watch parties.

---

## 📋 **Step 1: Register Your App on Kick**

1. **Go to Kick Developer Portal:**
   ```
   https://kick.com/developer/applications
   ```

2. **Create New Application:**
   - Click **"Create Application"** or **"New App"**
   - Name: `CrossTalk Watch Parties` (or whatever you want)

3. **Set Redirect URI:**
   ```
   https://web-production-2a269.up.railway.app/auth/callback
   ```
   ⚠️ **IMPORTANT:** Must be EXACTLY this URL (no trailing slash!)

4. **Copy Your Credentials:**
   - **Client ID** - Save this
   - **Client Secret** - Save this (keep it secret!)

---

## 🔑 **Step 2: Generate Security Keys**

Run these commands on your local PC to generate secure random keys:

```bash
# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY (run again for a different key)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Save both keys!** They should look like:
```
a1b2c3d4e5f6...  (64 characters long)
```

---

## 🚀 **Step 3: Add to Railway**

1. **Go to Railway Dashboard:**
   - Open your Discord bot service
   - Click **"Variables"** tab

2. **Add These 4 Variables:**

   ```
   KICK_OAUTH_CLIENT_ID=your_client_id_from_step_1
   KICK_OAUTH_CLIENT_SECRET=your_client_secret_from_step_1
   SESSION_SECRET=your_first_generated_key_from_step_2
   ENCRYPTION_KEY=your_second_generated_key_from_step_2
   ```

   **Example:**
   ```
   KICK_OAUTH_CLIENT_ID=abc123xyz
   KICK_OAUTH_CLIENT_SECRET=secret123abc
   SESSION_SECRET=a1b2c3d4e5f6789...
   ENCRYPTION_KEY=z9y8x7w6v5u4321...
   ```

3. **Click "Add" or "Save"** for each variable

---

## ⏳ **Step 4: Wait for Redeploy**

Railway will automatically restart your bot (takes ~3 minutes).

**In the logs, you should see:**
```
🔐 OAuth authentication enabled
```

Instead of:
```
ℹ️  OAuth login disabled (set KICK_OAUTH_* env vars to enable)
```

---

## ✅ **Step 5: Test It!**

1. Use `/kick stream xqc` in Discord
2. Click the watch party link
3. **You'll now see a "🔐 Login with Kick" button!**
4. Click it → Redirects to Kick → Authorize → Done!

**What works after login:**
- ✅ Your Kick username shows in the watch party
- ✅ Auto-filled for party chat
- ✅ Secure encrypted token storage
- ✅ Can logout anytime

---

## 🔒 **Security Features:**

Your OAuth implementation includes:
- ✅ **OAuth 2.1 with PKCE** (most secure standard)
- ✅ **AES-256-GCM encryption** (military-grade token encryption)
- ✅ **HMAC-SHA256 signing** (prevents tampering)
- ✅ **CSRF protection** (secure state tokens)
- ✅ **Rate limiting** (prevents brute-force)
- ✅ **Session management** (secure server-side sessions)

---

## ⚠️ **Important Notes:**

1. **Redirect URI Must Match EXACTLY**
   - In Kick: `https://web-production-2a269.up.railway.app/auth/callback`
   - No extra slashes, no http (must be https), must match perfectly

2. **Keep Your Client Secret SECURE**
   - Never commit to git
   - Never share publicly
   - Only add to Railway environment variables

3. **Keys Are Random**
   - Generate new keys each time (don't reuse)
   - Each key should be 64 characters (32 bytes hex)

---

## 🐛 **Troubleshooting:**

**"OAuth login disabled" still showing:**
- Check all 4 variables are added to Railway
- Check spelling of variable names (must be EXACT)
- Wait for redeployment to complete

**"Cannot GET /auth/login":**
- OAuth isn't enabled (check logs)
- Add the 4 environment variables

**"Invalid redirect_uri":**
- Redirect URI in Kick doesn't match exactly
- Must be: `https://web-production-2a269.up.railway.app/auth/callback`

**"Session expired":**
- Normal after 7 days
- User just needs to log in again

---

## 📝 **Quick Reference:**

**What you need from Kick:**
1. Client ID
2. Client Secret

**What you need to generate:**
1. SESSION_SECRET (random 32-byte hex)
2. ENCRYPTION_KEY (random 32-byte hex)

**Where to add them:**
- Railway → Your Discord bot service → Variables tab

**Redirect URI for Kick:**
```
https://web-production-2a269.up.railway.app/auth/callback
```

---

**Ready to set it up? Follow Steps 1-5 above!** 🚀
