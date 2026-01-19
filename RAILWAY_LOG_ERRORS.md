# Railway Log Errors - What to Look For

## 🔍 Check Railway Logs

Go to: **Railway Dashboard → Your Service → Logs Tab**

---

## ✅ Good Signs (App is Working)

Look for these messages in order:
1. `Database initialized successfully`
2. `Starting Kick Bot...`
3. `Kick Bot started and ready`
4. `Server running on http://localhost:8080`

If you see all of these, the app is running!

---

## ❌ Common Errors to Look For

### Error 1: "Cannot find module"
```
Error: Cannot find module 'xyz'
```
**Fix:** Missing dependency. Check if all packages are installed.

### Error 2: "Port already in use"
```
Error: listen EADDRINUSE: address already in use :::8080
```
**Fix:** Port conflict. Railway should handle this automatically.

### Error 3: "Database error"
```
SQLITE_ERROR: no such table: streamers
```
**Fix:** Database not initialized. Should be fixed now.

### Error 4: "TypeError" or "ReferenceError"
```
TypeError: Cannot read property 'xyz' of undefined
```
**Fix:** Code error. Check the specific line mentioned.

### Error 5: "BOT_ACCESS_TOKEN not set"
```
BOT_ACCESS_TOKEN not set!
```
**Fix:** Add `BOT_ACCESS_TOKEN` to Railway Variables.

### Error 6: "Failed to start server"
```
Failed to start server: [error details]
```
**Fix:** Check the error details below this message.

---

## 📋 What to Share

If you see errors, share:
1. **The exact error message** (copy/paste)
2. **The last few lines** before the error
3. **Any stack trace** (the lines with `at ...`)

---

## 🔧 Quick Fixes

### If App Keeps Crashing:
1. Check Railway Variables - make sure all required vars are set
2. Check Railway Logs - look for the first error
3. Try redeploying - Railway Dashboard → Settings → Redeploy

### If No Errors But App Won't Start:
1. Check if service is "Active" in Railway
2. Wait 2-3 minutes for full deployment
3. Check Railway Logs for "Server running" message

---

**Share the error messages you see in Railway Logs and I'll help fix them!**
