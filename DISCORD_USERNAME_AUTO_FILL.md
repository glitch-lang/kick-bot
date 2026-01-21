# 🎫 Discord Username Auto-Fill - Feature Guide

## 🎉 **What's New**

When you create a watch party, users can now get a **personal link** that automatically fills in their Discord username!

---

## 🚀 **How It Works**

### **Step 1: Create Watch Party**

In Discord, run:
```
!kick watchparty bbjess
```

### **Step 2: Bot Posts With Button**

The bot posts an embed with:
- 🔗 Public link (for anyone)
- 🎫 **Button: "Get Your Personal Link"**

### **Step 3: Users Click Button**

When someone clicks the button:
1. Bot sends them a DM
2. DM contains a personal link with their username encoded
3. Link expires in 24 hours
4. Secure and signed (can't be forged)

### **Step 4: Auto-Fill Magic**

When they click their personal link:
- Username automatically filled
- Ready to chat instantly
- No need to type username
- Verified from Discord

---

## 📋 **Example Flow**

### **1. Watch Party Created**

```
Discord Bot:
┌─────────────────────────────────────────┐
│ 🎬 Watch Party Created: bbjess          │
├─────────────────────────────────────────┤
│ Your synchronized watch party is ready! │
│                                         │
│ 🔗 Public Link:                         │
│ http://localhost:3001/party/abc123      │
│                                         │
│ 🎫 Or click button below for personal   │
│ link with your Discord username!        │
│                                         │
│ [🎫 Get Your Personal Link]             │
└─────────────────────────────────────────┘
```

### **2. User Clicks Button**

```
User: *clicks button*

Bot: ✅ Check your DMs! I sent you a personal link 
     with your username pre-filled.
```

### **3. User Gets DM**

```
Discord Bot DM:
┌─────────────────────────────────────────┐
│ 🎫 Your Personal Watch Party Link       │
├─────────────────────────────────────────┤
│ Hey JohnDoe! Here's your personal link: │
│                                         │
│ 🔗 http://localhost:3001/party/         │
│    abc123?discord=xyz789token          │
│                                         │
│ What's special about this link:        │
│ ✅ Your Discord username is auto-filled │
│ ✅ Ready to chat instantly              │
│ ✅ Secure and signed just for you       │
│                                         │
│ This link expires in 24 hours           │
└─────────────────────────────────────────┘
```

### **4. User Opens Link**

```
Watch Party Page:
┌─────────────────────────────────────────┐
│ 🎬 Watch Party         👥 5 watching    │
├─────────────────────────────────────────┤
│                                         │
│        [Kick Stream Playing]            │
│                                         │
├─────────────────────────────────────────┤
│ Chat                                    │
│ ┌────────────────────────────────────┐ │
│ │ Username: JohnDoe          [✓]    │ │ ← Auto-filled!
│ │                            ^^^^^^^ │ │
│ │ Message: [________________] [Send] │ │
│ │                                    │ │
│ │ System: ✅ Welcome JohnDoe!        │ │
│ │         (Verified from Discord)    │ │
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔐 **Security Features**

### **Signed Tokens**

Each personal link contains a cryptographically signed token:

```javascript
Token Format:
discordId:username:timestamp:signature

Example Token (base64url encoded):
MTIzNDU6Sm9obkRvZToxNzM3NDI4MDAwOmFiYzEyMw==

Decoded:
12345:JohnDoe:1737428000:abc123hash
```

**Security:**
- ✅ HMAC-SHA256 signature (can't be forged)
- ✅ 24-hour expiration (timestamp checked)
- ✅ Bound to specific Discord user
- ✅ Signed with master key

### **Verification Process**

1. User clicks personal link
2. Web page extracts token from URL
3. Sends token to server for verification
4. Server checks:
   - Token signature valid?
   - Token not expired?
   - Decodes to valid username?
5. If valid: auto-fill username
6. If invalid: user types manually

---

## 🎯 **User Experience**

### **Option 1: Public Link (Manual)**

```
1. User clicks public link
2. Opens watch party
3. Types username manually
4. Joins chat
```

**Use case:** Quick share, anonymous users

### **Option 2: Personal Link (Auto-Fill)**

```
1. User clicks button in Discord
2. Gets DM with personal link
3. Opens personal link
4. Username auto-filled
5. Joins instantly
```

**Use case:** Discord community, verified users

### **Option 3: Kick OAuth (Full Auth)**

```
1. User clicks "Login with Kick"
2. Authorizes with Kick account
3. Real Kick username + avatar
4. Full authentication
```

**Use case:** Kick users, maximum security

---

## 🛠️ **Technical Details**

### **Token Generation**

```typescript
// In bot when button is clicked
const token = discordAuthManager.generateDiscordToken(username, userId);
// Creates: userId:username:timestamp:hmacSignature

const personalUrl = `${PUBLIC_URL}/party/${partyId}?discord=${token}`;
// Adds token as URL parameter
```

### **Token Verification**

```typescript
// In watch party server
const decoded = discordAuthManager.verifyDiscordToken(token);
// Returns: { username: 'JohnDoe', id: '12345' }

// Checks:
- Token age < 24 hours
- Signature matches (HMAC-SHA256)
- Properly formatted
```

### **Auto-Fill Flow**

```javascript
// In watch-party.html
const urlParams = new URLSearchParams(window.location.search);
const discordToken = urlParams.get('discord');

if (discordToken) {
  fetch(`/api/verify-discord?token=${discordToken}`)
    .then(r => r.json())
    .then(data => {
      if (data.valid) {
        usernameInput.value = data.username;
        // Join party automatically
      }
    });
}
```

---

## 📊 **Comparison: All Methods**

| Method | Username | Security | Speed | Use Case |
|--------|----------|----------|-------|----------|
| **Public Link** | Manual | None | Fast | Quick share |
| **Personal Link** | Auto-fill | Signed token | Fast | Discord users |
| **Kick OAuth** | Real account | Full OAuth | Medium | Kick accounts |

---

## 🚨 **Error Handling**

### **DMs Disabled**

```
User: *clicks button*

Bot: ❌ Could not send DM. Please make sure your DMs are open!
     
     You can still use the public link:
     http://localhost:3001/party/abc123
```

**Fix:** User enables DMs in Discord settings

### **Token Expired**

```
User: *opens link after 24 hours*

Watch Party: Token expired. Please type your username manually.
```

**Fix:** Get new personal link from Discord

### **Token Invalid**

```
User: *opens tampered link*

Watch Party: Invalid token. Please type your username manually.
```

**Fix:** Use original link from bot

---

## 🎨 **Customization**

### **Change Token Expiration**

Edit `auth-manager.ts`:

```typescript
verifyDiscordToken(token: string, maxAge: number = 24 * 60 * 60 * 1000)
                                          ^^^^^^^^^^^^^^^^^^^^^^^^
                                          24 hours (default)

// Change to 1 hour:
maxAge: number = 60 * 60 * 1000

// Change to 7 days:
maxAge: number = 7 * 24 * 60 * 60 * 1000
```

### **Customize Button Text**

Edit `index.ts`:

```typescript
const button = new ButtonBuilder()
  .setCustomId(`join_party_${partyId}`)
  .setLabel('🎫 Get Your Personal Link')  // ← Change this
  .setStyle(ButtonStyle.Primary);
```

### **Customize DM Message**

Edit `index.ts` in the interaction handler:

```typescript
await interaction.user.send({
  embeds: [
    new EmbedBuilder()
      .setColor(0x9147ff)
      .setTitle('🎫 Your Personal Watch Party Link')  // ← Change
      .setDescription('...')  // ← Customize message
  ]
});
```

---

## 🧪 **Testing**

### **Test 1: Basic Flow**

```
1. Create watch party: !kick watchparty bbjess
2. Click "Get Your Personal Link" button
3. Check DMs
4. Click personal link
5. Verify username is auto-filled
✅ Pass: Username appears automatically
```

### **Test 2: Token Security**

```bash
# Get a personal link from DM
# Modify the token parameter
# Try to open the modified link
✅ Pass: Shows "Invalid token" message
```

### **Test 3: Token Expiration**

```bash
# Generate token with 1-second expiration
# Wait 2 seconds
# Try to use the token
✅ Pass: Token rejected as expired
```

### **Test 4: DM Failure**

```
1. Disable DMs in Discord settings
2. Click "Get Your Personal Link"
3. Check error message
✅ Pass: Shows fallback with public link
```

---

## 💡 **Tips**

### **For Users:**

- ✅ Click the button for auto-fill
- ✅ Personal links work for 24 hours
- ✅ Can share public link with anyone
- ✅ DMs must be enabled to get personal link

### **For Admins:**

- Personal links don't work after 24 hours (security)
- Public link always works
- Both methods join the same watch party
- Can disable feature by not showing button

---

## 🆕 **What's Changed**

### **Before:**

```
!kick watchparty bbjess
→ Posts link
→ Everyone types username manually
```

### **After:**

```
!kick watchparty bbjess
→ Posts link + button
→ Click button → get personal link
→ Username auto-filled!
→ OR use public link (manual username)
```

---

## ✅ **Summary**

**Benefits:**
- ✅ Faster joining (no typing)
- ✅ Verified Discord users
- ✅ Better UX for community
- ✅ Secure (signed tokens)
- ✅ Optional (public link still works)

**Security:**
- ✅ Tokens expire in 24 hours
- ✅ HMAC-SHA256 signatures
- ✅ Can't be forged
- ✅ Bound to specific user

**Compatibility:**
- ✅ Works with public links
- ✅ Works with Kick OAuth
- ✅ Works with two-way chat
- ✅ No breaking changes

---

## 🎉 **You're Ready!**

Create a watch party and try the new personal link feature:

```
!kick watchparty bbjess
```

Click the button, get your link, and enjoy auto-filled usernames! 🚀
