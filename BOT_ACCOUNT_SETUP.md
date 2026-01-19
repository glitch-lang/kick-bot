# Bot Account Setup Guide

## 🤖 Two Separate Things:

### 1. **Kick Developer App** (You Already Have This ✅)
- Created at [dev.kick.com](https://dev.kick.com)
- Provides: `KICK_CLIENT_ID` and `KICK_CLIENT_SECRET`
- This is YOUR developer account/app
- **You don't need a separate account for this**

### 2. **Bot Account** (You Need to Create This ⚠️)
- A regular Kick.com user account
- This account will act as the bot in chat
- Needs to be a separate account from your personal account
- **This is what sends messages in chat**

---

## 📋 Step-by-Step Setup

### Step 1: Create Bot Account

1. **Go to [kick.com](https://kick.com)**
2. **Sign up for a NEW account** (not your personal account)
   - Username: e.g., `CrossStreamBot`, `KickMessengerBot`, `YourBotName`
   - Email: Use a different email than your personal account
   - Password: Create a secure password
3. **Complete account setup**
4. **Remember the username** - this is your `BOT_USERNAME`

### Step 2: Get OAuth Token for Bot Account

1. **Make sure Railway has:**
   - `KICK_CLIENT_ID` = Your Developer App Client ID
   - `KICK_CLIENT_SECRET` = Your Developer App Secret
   - `KICK_REDIRECT_URI` = Your Railway URL

2. **Visit your bot's OAuth URL:**
   ```
   https://your-railway-url/auth/kick
   ```

3. **Log in with YOUR BOT ACCOUNT** (not your personal account!)
   - Use the bot account username/password you just created
   - Authorize the app

4. **Get the token:**
   - After authorization, check Railway logs
   - The token will be stored
   - Copy this token for `BOT_ACCESS_TOKEN`

### Step 3: Add to Railway

Add these variables to Railway:
- `BOT_USERNAME` = Your bot account username (e.g., `CrossStreamBot`)
- `BOT_ACCESS_TOKEN` = The OAuth token you got from Step 2

---

## 🔑 Why Two Accounts?

- **Developer App** = Your app credentials (like an API key)
- **Bot Account** = The actual user account that sends messages in chat

Think of it like:
- Developer App = Your app's ID card
- Bot Account = The person (bot) who will talk in chat

---

## ✅ Quick Checklist

- [ ] Created bot account on Kick.com
- [ ] Got bot account username
- [ ] Authorized bot account via OAuth flow
- [ ] Got OAuth token for bot account
- [ ] Added `BOT_USERNAME` to Railway
- [ ] Added `BOT_ACCESS_TOKEN` to Railway

---

## 🆘 Common Questions

**Q: Can I use my personal account as the bot?**
A: Technically yes, but not recommended. It's better to have a separate bot account.

**Q: Do I need a separate Developer App for the bot?**
A: No! You use YOUR Developer App. The bot account just authorizes through it.

**Q: What if I already have a bot account?**
A: Perfect! Just use that account's username and get an OAuth token for it.

---

**TL;DR: Create a new Kick.com account for the bot, then authorize it through your Developer App to get the token.**
