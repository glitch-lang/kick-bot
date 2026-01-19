# What Does a Bot Token Look Like?

## ❌ NOT a Token
- `316d66f9-bc85-40e6-80c0-936fe42fc12a` ← This is a UUID/ID, not a token
- This might be a Railway service ID or token display ID

## ✅ What a Real OAuth Token Looks Like

OAuth access tokens are **long JWT (JSON Web Token) strings** that look like:

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Characteristics:**
- Very long (usually 200-500+ characters)
- Three parts separated by dots (`.`)
- Base64 encoded
- Starts with `eyJ` (base64 for `{"`)

---

## 🔍 Where Did You See That UUID?

### If from Railway:
- Could be a **service ID** or **project ID**
- Not the access token you need

### If from OAuth callback:
- Could be a **token display ID** (temporary ID to view the token)
- You need to visit `/bot-token?token_id=316d66f9-bc85-40e6-80c0-936fe42fc12a` to see the actual token

### If from Kick:
- Could be a **user ID** or **channel ID**
- Not the access token

---

## ✅ How to Get the Real Token

### Step 1: Set BOT_USERNAME First
In Railway Variables, add:
- `BOT_USERNAME` = Your bot account username (e.g., `CrossStreamBot`)

### Step 2: Authorize Bot Account
1. Visit: `https://your-railway-url/auth/kick`
2. Log in with **bot account**
3. Authorize the app

### Step 3: Get Token
**Option A: Token Display Page**
- After authorization, you'll be redirected to `/bot-token?token_id=...`
- That page shows the **actual long token**
- Copy that token (it's the long string)

**Option B: Railway Logs**
- Railway Dashboard → Logs tab
- Look for: `Token received: Yes`
- Look for: `Token (first 30 chars): eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`
- The full token will be in the logs

**Option C: If You Have the Token Display ID**
- Visit: `https://your-railway-url/bot-token?token_id=316d66f9-bc85-40e6-80c0-936fe42fc12a`
- This will show you the actual token (if it hasn't expired)

---

## 📋 Quick Check

**Is your token:**
- ❌ Short (like 36 characters with dashes)? → That's a UUID, not a token
- ✅ Long (200+ characters)? → That's likely a token
- ✅ Starts with `eyJ`? → That's a JWT token (correct!)

---

## 🆘 If You Only Have the UUID

If `316d66f9-bc85-40e6-80c0-936fe42fc12a` is a token display ID:

1. **Find your Railway URL first** (Settings → Domains)
2. **Visit:** `https://your-railway-url/bot-token?token_id=316d66f9-bc85-40e6-80c0-936fe42fc12a`
3. **Copy the long token** from that page
4. **Add to Railway:** `BOT_ACCESS_TOKEN` = (the long token)

---

**The token you need is the LONG string, not the UUID!**
