# 🔐 Kick OAuth Login - Setup Guide

## Overview

This guide will help you enable **secure Kick OAuth login** for your watch party. Users can log in with their real Kick accounts!

---

## ⚡ **Quick Start (TL;DR)**

```bash
# 1. Generate security keys
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# 2. Add to .env (replace with your actual values)
KICK_OAUTH_CLIENT_ID=your_client_id_here
KICK_OAUTH_CLIENT_SECRET=your_client_secret_here
KICK_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback
ENCRYPTION_KEY=your_generated_key_here
SESSION_SECRET=your_generated_secret_here

# 3. Build and restart
npm run build
npm start

# 4. Visit watch party and click "Login with Kick"!
```

---

## 📋 **Step-by-Step Setup**

### **Step 1: Register OAuth Application with Kick**

**Kick has OAuth 2.1 with PKCE!** Here's how to set it up:

1. **Go to Kick Developer Portal:**
   - Visit `https://kick.com` and log in
   - Go to your account settings
   - Click on the **"Developer"** tab

2. **Create Application:**
   - Click "Create Application"
   - Fill in details:
     - **Name:** Your bot name (e.g., "My Watch Party Bot")
     - **Description:** What your bot does
     - **Redirect URI:** `https://yourdomain.com/auth/callback`
     - **Scopes:** Select `user:read` (basic user info)
   
3. **Get Credentials:**
   - Copy your **Client ID**
   - Copy your **Client Secret**
   - Save these securely!

**Official Resources:**
- Developer Portal: https://dev.kick.com
- Documentation: https://docs.kick.com
- GitHub Issues: https://github.com/KickEngineering/KickDevDocs

---

### **Step 2: Generate Security Keys**

Run these commands to generate cryptographically secure keys:

```bash
# Generate encryption key (for token encryption)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate session secret (for session signing)
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
ENCRYPTION_KEY=a1b2c3d4e5f67890abcdef1234567890a1b2c3d4e5f67890abcdef1234567890
SESSION_SECRET=f9e8d7c6b5a4938271605948372615ab0f9e8d7c6b5a4938271605948372615ab
```

⚠️ **CRITICAL:** Keep these keys secret! Never commit them to git!

---

### **Step 3: Configure Environment Variables**

Edit your `.env` file and add:

```env
# Kick OAuth Configuration
KICK_OAUTH_CLIENT_ID=your_client_id_from_kick
KICK_OAUTH_CLIENT_SECRET=your_client_secret_from_kick
KICK_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback

# Security Keys (use the generated keys from Step 2)
ENCRYPTION_KEY=your_generated_encryption_key_here
SESSION_SECRET=your_generated_session_secret_here
```

**Important notes:**
- Replace `https://yourdomain.com` with your actual domain
- If testing locally with ngrok: `https://abc123.ngrok-free.app/auth/callback`
- Keys must be **exactly as generated** (64 hex characters each)

---

### **Step 4: Verify .gitignore**

Make sure `.env` is in your `.gitignore` file:

```bash
# Check if .env is ignored
git check-ignore .env

# If not, add it:
echo ".env" >> .gitignore
```

---

### **Step 5: Build and Restart Bot**

```bash
# Build TypeScript
npm run build

# Restart bot
npm start
# Or with PM2:
pm2 restart discord-bot
```

Look for this log message:
```
🔐 OAuth authentication enabled
```

If you see:
```
ℹ️  OAuth login disabled (set KICK_OAUTH_* env vars to enable)
```

Then OAuth env vars are missing - check Step 3.

---

## 🎮 **How to Use**

### **For Users:**

1. **Visit Watch Party**
   ```
   https://yourdomain.com/party/abc123
   ```

2. **Click "🔐 Login with Kick" Button**
   - Top right corner of watch party

3. **Authorize on Kick**
   - Redirected to Kick's authorization page
   - Click "Authorize"

4. **Automatic Return**
   - Redirected back to watch party
   - Username automatically filled
   - Avatar displayed in header

5. **Start Chatting!**
   - No need to type username
   - Authenticated as your Kick account

---

## 🔒 **Security Features**

### **What's Protecting Your Users:**

✅ **OAuth 2.1 with PKCE**
- Proof Key for Code Exchange (PKCE)
- Prevents authorization code interception
- More secure than standard OAuth 2.0
- No client secret exposed to public clients

✅ **AES-256-GCM Encryption**
- OAuth tokens encrypted in database
- Even if database is stolen, tokens are safe

✅ **CSRF Protection**
- Prevents cross-site request forgery
- Signed state parameters

✅ **Rate Limiting**
- Max 10 login attempts per 15 minutes per IP
- Prevents brute force attacks

✅ **Secure Sessions**
- HttpOnly cookies (JavaScript can't access)
- Secure flag (HTTPS only in production)
- SameSite protection

✅ **Security Headers**
- Helmet.js protection
- Content Security Policy
- XSS prevention

✅ **Token Refresh**
- Automatic token renewal
- No re-login needed

---

## 🧪 **Testing**

### **Test 1: OAuth Flow**

```bash
# 1. Open watch party in browser
# 2. Click "Login with Kick"
# 3. Should redirect to Kick (or show error if not set up)
# 4. Authorize app
# 5. Should redirect back to watch party
# 6. Username should be auto-filled
# 7. Avatar should show in header
```

### **Test 2: Session Persistence**

```bash
# 1. Log in
# 2. Close browser
# 3. Re-open watch party (same browser)
# 4. Should still be logged in (session persists 7 days)
```

### **Test 3: Logout**

```bash
# 1. Log in
# 2. Click "Logout" button
# 3. Should see logout confirmation
# 4. Login button should reappear
# 5. Username should be cleared
```

### **Test 4: CSRF Protection**

```bash
# Try to logout without CSRF token (should fail with 403)
curl -X POST https://yourdomain.com/auth/logout \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: {"error":"Invalid CSRF token"}
```

### **Test 5: Rate Limiting**

```bash
# Make 11 rapid requests (11th should fail)
for i in {1..11}; do
  curl https://yourdomain.com/auth/login
done

# 11th request should return: 429 Too Many Requests
```

---

## 🚨 **Troubleshooting**

### **"OAuth login disabled" message**

**Problem:** Bot logs show OAuth is disabled

**Solution:**
```bash
# Check env vars are set
node -e "
const required = ['KICK_OAUTH_CLIENT_ID', 'KICK_OAUTH_CLIENT_SECRET', 'ENCRYPTION_KEY', 'SESSION_SECRET'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.log('❌ Missing:', missing);
} else {
  console.log('✅ All set!');
}
"
```

---

### **"Invalid redirect URI" error**

**Problem:** Kick says redirect URI doesn't match

**Solution:**
1. Check `KICK_OAUTH_REDIRECT_URI` in `.env`
2. Must match **exactly** what you registered with Kick
3. Include protocol (`https://`)
4. Include full path (`/auth/callback`)

**Example:**
```env
❌ KICK_OAUTH_REDIRECT_URI=yourdomain.com/auth/callback
❌ KICK_OAUTH_REDIRECT_URI=http://yourdomain.com/auth/callback
✅ KICK_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback
```

---

### **"Authentication failed" error**

**Possible causes:**
1. Client ID or Secret is wrong
2. User denied authorization
3. Kick API is down
4. OAuth app is suspended

**Debug:**
```bash
# Check bot logs for detailed error
pm2 logs discord-bot

# Look for lines like:
# ❌ OAuth error: ...
# ❌ Failed to exchange code for token: ...
```

---

### **Login button doesn't appear**

**Problem:** No login button on watch party page

**Possible causes:**
1. OAuth not enabled
2. JavaScript error
3. Already logged in

**Debug:**
```bash
# 1. Open browser console (F12)
# 2. Look for errors
# 3. Check network tab for /auth/status request
# 4. Should return: {"authenticated":false} or {"authenticated":true,...}
```

---

### **Session expires immediately**

**Problem:** Logged out after refresh

**Possible causes:**
1. `SESSION_SECRET` changed (sessions invalidated)
2. Cookies not being set (HTTPS issue)
3. Session database issue

**Solution:**
```bash
# Check session database exists
ls -la data/sessions.db

# If missing or corrupted, delete and restart
rm data/sessions.db
pm2 restart discord-bot
```

---

### **Token encryption errors**

**Problem:** `Failed to decrypt tokens` errors

**Possible causes:**
1. `ENCRYPTION_KEY` changed
2. Database corruption
3. Key length wrong

**Solution:**
```bash
# Verify key length (should be 64 hex characters)
node -e "console.log(process.env.ENCRYPTION_KEY.length)"
# Expected output: 64

# If key changed, all tokens are invalid
# Users need to re-login
```

---

## 🎯 **Advanced Configuration**

### **Custom Session Duration**

Edit `oauth-router.ts`:

```typescript
cookie: {
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days (default)
  // Change to:
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
}
```

---

### **Custom OAuth Scopes**

If Kick adds more scopes in the future:

Edit `oauth-router.ts`:

```typescript
authUrl.searchParams.append('scope', 'read:user read:chat'); // Add more scopes
```

---

### **Multiple Redirect URIs**

If you have multiple domains:

1. Register multiple OAuth apps (one per domain)
2. Use environment-specific `.env` files
3. Or use dynamic redirect URI:

```typescript
redirectUri: process.env.KICK_OAUTH_REDIRECT_URI || `${PUBLIC_URL}/auth/callback`
```

---

### **Force HTTPS in Development**

For testing with ngrok/tunnels:

Edit `oauth-router.ts`:

```typescript
cookie: {
  secure: true, // Always require HTTPS
  // Instead of:
  secure: process.env.NODE_ENV === 'production',
}
```

---

## 📊 **Monitoring**

### **Check Active Sessions**

```bash
# Connect to SQLite
sqlite3 data/sessions.db

# List active sessions
SELECT session_id, user_id, kick_username, created_at, last_activity 
FROM user_sessions 
WHERE expires_at > strftime('%s', 'now') 
ORDER BY last_activity DESC;
```

---

### **Check Encrypted Tokens**

```bash
sqlite3 data/discord-bot.db

# Count users with OAuth tokens
SELECT COUNT(*) FROM oauth_tokens;

# Check token expiration
SELECT user_id, datetime(expires_at, 'unixepoch') as expires 
FROM oauth_tokens 
ORDER BY expires_at DESC;
```

---

### **Clean Up Expired Sessions**

```bash
sqlite3 data/sessions.db

# Delete expired sessions
DELETE FROM user_sessions WHERE expires_at < strftime('%s', 'now');

# Vacuum to reclaim space
VACUUM;
```

---

## 🔐 **Security Best Practices**

### **1. Rotate Keys Periodically**

```bash
# Every 3-6 months, generate new keys
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env
# Restart bot
# All users will need to re-login (sessions invalidated)
```

---

### **2. Monitor Failed Logins**

Check logs for:
```
⚠️ OAuth state mismatch - possible CSRF attack
⚠️ OAuth state expired or invalid timestamp
❌ Token refresh failed
```

---

### **3. Use HTTPS in Production**

**Never use HTTP in production!**

Options:
- Cloudflare (free, easy)
- Let's Encrypt + nginx
- VPS provider SSL

---

### **4. Backup Encryption Keys**

```bash
# Backup .env file (encrypted!)
gpg --encrypt .env
# Store encrypted backup securely
```

---

### **5. Use Environment-Specific Keys**

```
.env.development  (local testing)
.env.staging      (staging server)
.env.production   (production server)
```

**Never use production keys in development!**

---

## 🆘 **Emergency Response**

### **If Keys Are Compromised:**

```bash
# 1. IMMEDIATELY generate new keys
NEW_ENCRYPTION=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NEW_SESSION=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Update .env
echo "ENCRYPTION_KEY=$NEW_ENCRYPTION" >> .env
echo "SESSION_SECRET=$NEW_SESSION" >> .env

# 3. Restart bot
pm2 restart discord-bot

# 4. Clear all sessions and tokens
sqlite3 data/discord-bot.db "DELETE FROM oauth_tokens;"
sqlite3 data/sessions.db "DELETE FROM user_sessions;"

# 5. Notify users (all will need to re-login)
```

---

### **If Database Is Stolen:**

**Good news:** Tokens are encrypted! 🎉

But still:
1. Rotate encryption key (see above)
2. Revoke OAuth app credentials with Kick
3. Register new OAuth app
4. Update env vars
5. Notify users

---

## ✅ **Post-Setup Checklist**

- [ ] OAuth app registered with Kick
- [ ] Client ID and Secret added to `.env`
- [ ] Encryption key generated (64 hex chars)
- [ ] Session secret generated (64 hex chars)
- [ ] Redirect URI configured correctly
- [ ] `.env` added to `.gitignore`
- [ ] Bot restarted with OAuth enabled
- [ ] Login button appears on watch party
- [ ] Test login flow works
- [ ] Session persists after browser restart
- [ ] Logout works
- [ ] HTTPS enabled (production)
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Monitoring set up

---

## 🎉 **You're Ready!**

OAuth login is now enabled! Your users can:

✅ Log in with real Kick accounts
✅ Auto-fill username from Kick
✅ Display Kick avatar
✅ Secure authentication
✅ Session persistence

**Security features active:**
- 🔒 AES-256-GCM encryption
- 🛡️ CSRF protection
- 🚦 Rate limiting
- 🔐 Secure sessions
- 🔏 HTTPS enforcement (production)

**Questions? Issues?**
- Check troubleshooting section above
- Review `OAUTH_SECURITY_GUIDE.md` for security details
- Check bot logs: `pm2 logs discord-bot`

**Enjoy secure Kick OAuth! 🚀**
