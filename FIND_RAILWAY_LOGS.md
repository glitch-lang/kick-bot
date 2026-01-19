# How to Find Logs on Railway

## 📍 Where to Find Logs

### Step 1: Go to Railway Dashboard
1. Visit: [railway.app](https://railway.app)
2. Log in to your account

### Step 2: Navigate to Your Project
1. Click on your project: `comfortable-spontaneity` (or your project name)
2. Click on your service (the one running the bot)

### Step 3: Open Logs Tab
1. At the top, you'll see tabs: **Overview**, **Deployments**, **Metrics**, **Logs**, **Settings**, etc.
2. Click on **"Logs"** tab
3. This shows all console output from your app

---

## 🔍 What You'll See in Logs

### Real-Time Logs
- All `console.log()` output
- All `console.error()` output
- Build logs
- Runtime logs

### Filter Options
- **Time range**: Last 15 min, 1 hour, 24 hours, etc.
- **Search**: Type to filter logs
- **View in Context**: See full log context

---

## 📋 What to Look For

### ✅ Good Signs
- `Database initialized successfully`
- `Kick Bot started and ready`
- `Server running on http://0.0.0.0:8080`
- `Server is ready to accept connections`

### ❌ Error Signs
- `Error:` - Any error messages
- `Failed to start server:`
- `TypeError:` or `ReferenceError:`
- `Cannot find module`
- `SIGTERM` - Process killed

---

## 🆘 If You Don't See Logs

### Check Service Status
1. Railway Dashboard → Your Service
2. Look at the top - should show status:
   - **Active** (green) = Running
   - **Building** (yellow) = Deploying
   - **Error** (red) = Failed

### Check Deployments
1. Click **"Deployments"** tab
2. Look at latest deployment
3. Click on it to see build logs

### Refresh Logs
- Logs update in real-time
- Click refresh or wait a few seconds
- Scroll to bottom for latest logs

---

## 🔧 Alternative: Check Build Logs

If runtime logs don't show errors:

1. Railway Dashboard → Your Service
2. Click **"Deployments"** tab
3. Click on the latest deployment
4. Look at **"Build Logs"** section
5. Look for errors during build

---

## 📱 Railway Logs URL

Your logs are at:
```
https://railway.app/project/[project-id]/service/[service-id]/logs
```

But it's easier to navigate through the dashboard!

---

## 💡 Pro Tip

**Copy Error Messages:**
1. Find the error in Railway Logs
2. Select and copy the error text
3. Share it with me so I can help fix it!

---

**The npm log file (`/root/.npm/_logs/...`) is inside the Railway container and not directly accessible. Use Railway's Logs tab instead!**
