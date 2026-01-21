# 🧪 Testing Kick OAuth - Complete Guide

## Current Status

✅ Bot is running
✅ OAuth code implemented
⏸️ OAuth credentials not configured (optional - UI works without them)

---

## 🎯 **Two Testing Modes**

### **Mode 1: Test UI Without OAuth** (Available Now)
- See the login button
- Test watch party features
- Manual username entry still works

### **Mode 2: Test Full OAuth Flow** (Requires Kick credentials)
- Real Kick login
- OAuth authorization
- Token exchange
- Profile fetching

---

## 🚀 **Mode 1: Test UI (No Credentials Needed)**

### **Step 1: Create a Test Watch Party**

In Discord, run:
```
!kick watchparty bbjess
```

**Or** manually visit:
```
http://localhost:3001/party/test
```

### **Step 2: Check the UI**

Open the link in your browser. You should see:

```
┌─────────────────────────────────────────────────────┐
│ 🎬 Watch Party    [🔐 Login with Kick]  👥 0 watching│
├─────────────────────────────────────────────────────┤
│                                                     │
│            [Kick Stream Player]                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Chat                                                │
│ ┌─────────────────────────────────────────────────┐│
│ │ Username: [________________]                    ││
│ │ Message:  [________________] [Send]             ││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**What to look for:**
- ✅ "🔐 Login with Kick" button appears (top right)
- ✅ Watch party loads
- ✅ Chat works with manual username
- ✅ Stream plays

### **Step 3: Click "Login with Kick"**

**What will happen:**
1. Redirects to: `https://id.kick.com/oauth/authorize?...`
2. **Without credentials:** May show Kick error or invalid client
3. **This is expected** - you need to register the app first

### **Step 4: Test Without Login**

You can still use the watch party!
1. Type a username manually
2. Send messages
3. Watch stream
4. See Kick chat (if two-way enabled)

**✅ Everything works except OAuth login**

---

## 🔐 **Mode 2: Test Full OAuth (With Credentials)**

### **Prerequisites:**

You need:
1. Kick OAuth Client ID
2. Kick OAuth Client Secret
3. Two security keys (generated)

### **Step 1: Get Kick OAuth Credentials**

#### **Option A: Register on Kick (Real)**

1. **Go to Kick Developer Portal:**
   ```
   https://kick.com
   ```

2. **Navigate to Settings:**
   - Click your avatar → Settings
   - Find "Developer" tab
   - Click "Create Application"

3. **Fill in application details:**
   ```
   Name: My Watch Party Bot
   Description: Discord bot for synchronized watch parties
   Redirect URI: http://localhost:3001/auth/callback
   Scopes: user:read
   ```

4. **Copy credentials:**
   - Client ID (e.g., `abc123`)
   - Client Secret (e.g., `xyz789secret`)

#### **Option B: Use Test Values (Will Fail But Shows Flow)**

For **testing the UI flow only** (won't actually log in):
```env
KICK_OAUTH_CLIENT_ID=test_client_id
KICK_OAUTH_CLIENT_SECRET=test_client_secret
```

### **Step 2: Generate Security Keys**

Open PowerShell in the project directory:

```powershell
# Generate encryption key
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate session secret
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
ENCRYPTION_KEY=a1b2c3d4e5f6...
SESSION_SECRET=f9e8d7c6b5a4...
```

### **Step 3: Configure .env File**

Edit `discord-bot/.env` (create if doesn't exist):

```env
# Discord Bot (existing)
DISCORD_BOT_TOKEN=your_existing_token
DISCORD_CLIENT_ID=your_existing_client_id
KICK_BOT_API_URL=https://web-production-56232.up.railway.app
PUBLIC_URL=http://localhost:3001

# Kick OAuth (NEW - add these)
KICK_OAUTH_CLIENT_ID=your_client_id_from_kick
KICK_OAUTH_CLIENT_SECRET=your_client_secret_from_kick
KICK_OAUTH_REDIRECT_URI=http://localhost:3001/auth/callback

# Security Keys (NEW - use generated values)
ENCRYPTION_KEY=paste_generated_key_here
SESSION_SECRET=paste_generated_secret_here
```

### **Step 4: Restart Bot**

```powershell
# Stop current bot
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Wait
Start-Sleep -Seconds 2

# Build and start
npm run build
npm start
```

### **Step 5: Check Bot Logs**

Look for:
```
🔐 OAuth authentication enabled     ← This means it's working!
✅ Discord bot logged in
🎬 Watch Party server running
```

If you see:
```
ℹ️  OAuth login disabled (set KICK_OAUTH_* env vars to enable)
```

Then check your `.env` file again.

### **Step 6: Test Full OAuth Flow**

1. **Create watch party:**
   ```
   !kick watchparty bbjess
   ```

2. **Open the link in browser**

3. **Click "🔐 Login with Kick"**

4. **Should redirect to Kick:**
   ```
   https://id.kick.com/oauth/authorize?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=http://localhost:3001/auth/callback&
     response_type=code&
     scope=user:read&
     state=...&
     code_challenge=...&
     code_challenge_method=S256
   ```

5. **Authorize on Kick:**
   - See: "My Watch Party Bot wants to read your basic profile"
   - Click "Authorize"

6. **Redirected back:**
   ```
   http://localhost:3001/auth/callback?code=...&state=...
   ```

7. **Bot processes:**
   - Verifies state (CSRF protection)
   - Exchanges code for tokens (with PKCE)
   - Fetches your profile
   - Creates session
   - Redirects to watch party

8. **You're logged in!**
   - Username auto-filled with your Kick username
   - Avatar displayed in header
   - "Logout" button appears

---

## 🔍 **What to Check**

### **In Browser Console (F12):**

```javascript
// Check auth status
fetch('/auth/status').then(r => r.json()).then(console.log)

// Should return:
// If logged in:
{
  "authenticated": true,
  "user": {
    "id": "...",
    "kickId": 12345,
    "kickUsername": "yourname",
    "avatar": "https://..."
  },
  "csrfToken": "..."
}

// If not logged in:
{
  "authenticated": false
}
```

### **In Bot Console Logs:**

**Successful OAuth flow:**
```
🔐 OAuth authentication enabled
🔌 Connecting to Kick chat for bbjess...
✅ Found chatroom ID: 123456
📡 Subscribed to Kick chat: chatrooms.123456.v2
✅ Connected to Kick chat for bbjess
✅ User authenticated: yourname (ID: 12345)
```

**OAuth errors:**
```
❌ Failed to exchange code for token: ...
❌ Failed to fetch user profile: ...
```

### **In Database:**

Check if tokens were saved:

```powershell
sqlite3 data/discord-bot.db "SELECT user_id, datetime(expires_at, 'unixepoch') as expires FROM oauth_tokens;"
```

Check if session was created:

```powershell
sqlite3 data/sessions.db "SELECT session_id, user_id, kick_username, datetime(expires_at, 'unixepoch') as expires FROM user_sessions;"
```

---

## 🧪 **Test Scenarios**

### **Scenario 1: Basic Login**
1. Click "Login with Kick"
2. Authorize
3. Verify username auto-filled
4. ✅ **Pass:** Logged in successfully

### **Scenario 2: Session Persistence**
1. Log in
2. Close browser
3. Reopen same watch party URL
4. ✅ **Pass:** Still logged in (no re-login needed)

### **Scenario 3: Logout**
1. Log in
2. Click "Logout" button
3. Verify login button reappears
4. ✅ **Pass:** Logged out successfully

### **Scenario 4: CSRF Protection**
```powershell
# Try to logout without CSRF token (should fail)
curl -X POST http://localhost:3001/auth/logout `
  -H "Content-Type: application/json" `
  -d '{}'

# Expected: {"error":"Invalid CSRF token"}
```
✅ **Pass:** Request blocked

### **Scenario 5: Rate Limiting**
```powershell
# Make 11 rapid login requests
for ($i=1; $i -le 11; $i++) {
  curl http://localhost:3001/auth/login
}
# 11th should return: 429 Too Many Requests
```
✅ **Pass:** Rate limit working

### **Scenario 6: Token Encryption**
```powershell
# Check encrypted tokens in database
sqlite3 data/discord-bot.db "SELECT substr(encrypted_data, 1, 50) FROM oauth_tokens;"

# Should see hex encrypted data, not readable JSON
```
✅ **Pass:** Tokens are encrypted

### **Scenario 7: Two-Way Chat with OAuth**
1. Log in with Kick account
2. Username auto-filled
3. Send message to watch party
4. Check Kick chat (if relay enabled)
5. ✅ **Pass:** Message appears as your Kick username

---

## 🚨 **Troubleshooting**

### **Problem: "OAuth login disabled" message**

**Solution:**
```powershell
# Check env vars
Get-Content .env | Select-String "KICK_OAUTH"

# Should see:
# KICK_OAUTH_CLIENT_ID=...
# KICK_OAUTH_CLIENT_SECRET=...
# ENCRYPTION_KEY=...
# SESSION_SECRET=...

# If missing, add them and restart
```

### **Problem: Login button doesn't appear**

**Causes:**
1. OAuth not enabled (check logs)
2. JavaScript error (check browser console)
3. Already logged in

**Solution:**
```javascript
// Check in browser console
console.log('OAuth enabled:', !!document.getElementById('loginBtn'));
```

### **Problem: "Invalid redirect URI"**

**Solution:**
Check `.env`:
```env
# Must match exactly what you registered on Kick
KICK_OAUTH_REDIRECT_URI=http://localhost:3001/auth/callback
                        ↑ no trailing slash!
```

### **Problem: "Code verifier missing"**

**Cause:** Session expired between authorize and callback

**Solution:**
- Complete OAuth flow faster (within 10 minutes)
- Check session store is working
- Try again

### **Problem: "Token exchange failed"**

**Possible causes:**
1. Wrong client secret
2. Code already used
3. Code expired
4. PKCE verification failed

**Solution:**
```powershell
# Check bot logs for specific error
pm2 logs discord-bot | Select-String "exchange"
```

### **Problem: Can't authorize on Kick**

**Causes:**
1. Client ID doesn't exist
2. Redirect URI not registered
3. Scopes not permitted

**Solution:**
- Verify app exists in Kick Developer Portal
- Check redirect URI matches exactly
- Ensure `user:read` scope is enabled

---

## 📊 **Expected Results**

### **Without OAuth Credentials:**
```
✅ Bot runs
✅ Watch party works
✅ Manual username entry works
✅ Chat works
✅ Stream plays
✅ Login button appears
❌ Can't actually log in (needs credentials)
```

### **With OAuth Credentials:**
```
✅ Everything above PLUS:
✅ Click login → redirects to Kick
✅ Authorize → redirects back
✅ Username auto-filled
✅ Avatar displayed
✅ Session persists
✅ Logout works
✅ Tokens encrypted
✅ CSRF protection active
```

---

## 🎯 **Quick Test Commands**

### **Check if OAuth is enabled:**
```powershell
curl http://localhost:3001/auth/status
```

### **Test rate limiting:**
```powershell
1..11 | ForEach-Object { curl http://localhost:3001/auth/login -UseBasicParsing }
```

### **Check encrypted tokens:**
```powershell
sqlite3 data/discord-bot.db "SELECT COUNT(*) FROM oauth_tokens;"
```

### **Check active sessions:**
```powershell
sqlite3 data/sessions.db "SELECT COUNT(*) FROM user_sessions WHERE expires_at > strftime('%s', 'now');"
```

### **View bot logs:**
```powershell
Get-Content C:\Users\willc\.cursor\projects\C-Users-willc-AppData-Local-Temp-*\terminals\*.txt -Tail 50
```

---

## ✅ **Success Checklist**

- [ ] Bot starts with "OAuth authentication enabled" or works without it
- [ ] Watch party page loads
- [ ] "Login with Kick" button appears
- [ ] Clicking button redirects to Kick (or shows client error if not configured)
- [ ] Manual username still works
- [ ] Chat sends messages
- [ ] Stream plays
- [ ] Two-way Kick chat works

**With OAuth credentials:**
- [ ] Redirect to Kick works
- [ ] Authorization page appears
- [ ] Callback processes successfully
- [ ] Username auto-filled
- [ ] Avatar displayed
- [ ] Session persists after browser close
- [ ] Logout works
- [ ] Rate limiting blocks after 10 attempts
- [ ] CSRF protection blocks invalid requests

---

## 🎉 **You're Ready!**

**To test right now (without credentials):**
1. Open http://localhost:3001/party/test
2. See the UI works
3. Use manual username

**To test full OAuth (with credentials):**
1. Get credentials from Kick Developer Portal
2. Add to `.env`
3. Restart bot
4. Test login flow

**Questions?**
- Check `KICK_OAUTH_SETUP.md` for setup
- Check `OAUTH_SECURITY_GUIDE.md` for security details
- Check bot logs for errors
