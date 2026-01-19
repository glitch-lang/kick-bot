# How to Get Your Bot Token from Railway

## 🎯 The Problem
When you visit `/auth/kick` on Railway, it redirects you to Kick for authorization, but there's no easy way to see the token afterward.

## ✅ The Solution

### Step 1: Set BOT_USERNAME First
Before authorizing, add this to Railway Variables:
- Variable: `BOT_USERNAME`
- Value: Your bot account's Kick username (e.g., `CrossStreamBot`)

**Why?** The system needs to know which account is the bot account to show you the token page.

### Step 2: Authorize Bot Account
1. Visit: `https://your-railway-url/auth/kick`
2. **Log in with your BOT ACCOUNT** (not your personal account!)
3. Authorize the app
4. You'll be redirected to `/bot-token?token_id=...`
5. **Copy the token immediately** - it only shows once!

### Step 3: Add Token to Railway
1. Copy the token from the page
2. Go to Railway Dashboard → Variables
3. Add: `BOT_ACCESS_TOKEN` = (paste token)
4. Railway will auto-redeploy

---

## 🔍 Alternative: Check Railway Logs

If you miss the token page, check Railway logs:

1. Railway Dashboard → Your Project → **Logs** tab
2. Look for lines like:
   ```
   Token received: Yes
   Token (first 30 chars): eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. The full token will be in the logs after OAuth completes

---

## 🆘 Troubleshooting

### "Token Not Found or Expired"
- The token display link expires after 5 minutes
- Just authorize again: `/auth/kick`

### "No token ID provided"
- Make sure you're accessing the page from the OAuth redirect
- Don't visit `/bot-token` directly

### Token doesn't work
- Make sure token has `chat:write` scope
- Check token hasn't expired
- Verify `BOT_USERNAME` matches the account you authorized

---

## 📋 Quick Checklist

- [ ] Created bot account on Kick.com
- [ ] Added `BOT_USERNAME` to Railway Variables
- [ ] Visited `/auth/kick` on Railway
- [ ] Logged in with **bot account** (not personal)
- [ ] Authorized the app
- [ ] Copied token from `/bot-token` page
- [ ] Added `BOT_ACCESS_TOKEN` to Railway Variables
- [ ] Railway redeployed successfully

---

**Remember: The token page only shows once! Copy it immediately!**
