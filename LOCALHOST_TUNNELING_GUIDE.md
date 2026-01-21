# 🌐 Making Localhost Accessible to Others

## Overview

Your watch party server runs on `http://localhost:3001`, which only works on your PC. To let others join, you need to expose it to the internet.

---

## ⚡ **Option 1: ngrok (Recommended - Easy Setup)**

### **What is ngrok?**
Creates a public URL that tunnels to your localhost. Perfect for testing!

### **Setup (5 minutes):**

1. **Download ngrok:**
   - Visit: https://ngrok.com/download
   - Download Windows version
   - Extract `ngrok.exe` to a folder (e.g., `C:\ngrok\`)

2. **Sign up (free):**
   - Create account at https://dashboard.ngrok.com/signup
   - Copy your authtoken

3. **Authenticate:**
   ```powershell
   C:\ngrok\ngrok.exe authtoken YOUR_AUTH_TOKEN
   ```

4. **Start tunnel:**
   ```powershell
   C:\ngrok\ngrok.exe http 3001
   ```

5. **Get your URL:**
   ```
   ngrok will show:
   Forwarding: https://abc123.ngrok-free.app -> http://localhost:3001
   ```

6. **Use this URL:**
   - Your watch party: `https://abc123.ngrok-free.app/party/partyid`
   - Anyone can access it!

### **Keep it Running:**
- Keep ngrok terminal window open
- When you close it, the URL stops working
- Free tier: URL changes each time you restart

---

## 🚀 **Option 2: Cloudflare Tunnel (Free + Persistent URL)**

### **Advantages:**
- ✅ Free forever
- ✅ Keep same URL
- ✅ Better performance than ngrok free
- ✅ No time limits

### **Setup:**

1. **Install Cloudflare Tunnel:**
   ```powershell
   # Download cloudflared
   Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "C:\cloudflared.exe"
   ```

2. **Login:**
   ```powershell
   C:\cloudflared.exe tunnel login
   ```

3. **Create tunnel:**
   ```powershell
   C:\cloudflared.exe tunnel create crosstalk-watchparty
   ```

4. **Start tunnel:**
   ```powershell
   C:\cloudflared.exe tunnel --url http://localhost:3001
   ```

5. **Get permanent URL:**
   - Creates a `*.trycloudflare.com` URL
   - Or set up custom domain (free with Cloudflare)

---

## 🏠 **Option 3: LocalTunnel (Simplest)**

### **Setup:**

1. **Install (via npm):**
   ```powershell
   npm install -g localtunnel
   ```

2. **Start tunnel:**
   ```powershell
   lt --port 3001 --subdomain crosstalk
   ```

3. **Get URL:**
   ```
   Your URL: https://crosstalk.loca.lt
   ```

---

## 🎯 **Integration with Discord Bot**

I'll update the bot to automatically use your tunnel URL instead of localhost!

### **Set Environment Variable:**

Add to `discord-bot/.env`:
```env
PUBLIC_URL=https://abc123.ngrok-free.app
```

Then the bot will use this for watch party links instead of localhost!

---

## 📊 **Comparison:**

| Tool | Free Tier | Persistent URL | Speed | Setup Time |
|------|-----------|----------------|-------|------------|
| **ngrok** | ✅ Yes | ❌ Changes | Fast | 5 min |
| **Cloudflare** | ✅ Yes | ✅ Yes | Very Fast | 10 min |
| **LocalTunnel** | ✅ Yes | ⚠️ Sometimes | Medium | 2 min |

---

## 🚀 **Quick Start (ngrok):**

```powershell
# Terminal 1: Start Discord bot
cd C:\Users\willc\kick-bot\discord-bot
npm start

# Terminal 2: Start ngrok
C:\ngrok\ngrok.exe http 3001

# Note the URL (e.g., https://abc123.ngrok-free.app)
# Add to .env: PUBLIC_URL=https://abc123.ngrok-free.app
# Restart bot
```

Now when users run `!kick watchparty`, they get a public URL! 🎉

---

## 📝 **For Production:**

If you want this to run 24/7:
1. Deploy to a VPS (see `VPS_DEPLOYMENT_GUIDE.md`)
2. No tunneling needed - server has public IP
3. Much more stable and faster
