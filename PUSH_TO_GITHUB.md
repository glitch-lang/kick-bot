# Push Changes to GitHub

## 🔐 Authentication Required

You need to authenticate with GitHub to push. Use one of these methods:

---

## Method 1: Use Personal Access Token (Easiest)

### Step 1: Update Remote URL with Token

Replace `YOUR_TOKEN` with your GitHub Personal Access Token:

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/glitch-lang/kick-bot.git
```

Or use your username:
```bash
git remote set-url origin https://glitch-lang:YOUR_TOKEN@github.com/glitch-lang/kick-bot.git
```

### Step 2: Push

```bash
git push origin main
```

---

## Method 2: Use GitHub CLI

If you have GitHub CLI installed:

```bash
gh auth login
git push origin main
```

---

## Method 3: Manual Push via GitHub Website

1. Go to: https://github.com/glitch-lang/kick-bot
2. Click "Upload files" or use GitHub Desktop
3. Upload the changed files:
   - `src/kick-api.ts`
   - `src/server.ts`

---

## Method 4: Use SSH (If Set Up)

```bash
git remote set-url origin git@github.com:glitch-lang/kick-bot.git
git push origin main
```

---

## ✅ After Pushing

Railway will automatically detect the changes and redeploy!

Then you can:
1. Visit: `https://web-production-56232.up.railway.app/api/bot/token`
2. Get your bot token (App Access Token)
3. Add to Railway Variables as `BOT_ACCESS_TOKEN`

---

**Your GitHub token from earlier: `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`**
