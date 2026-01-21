# 🌐 Make Your Watch Party Public - Complete Guide

## 🎯 **The Problem**

Your bot runs on `http://localhost:3001` which means:
- ❌ Only YOU can access watch parties
- ❌ Friends can't join (localhost = your PC only)
- ❌ Can't share links publicly

## ✅ **The Solution: Tunneling**

Create a **public URL** that tunnels to your local PC!

```
Internet → https://abc123.loca.lt → Your PC (localhost:3001)
```

Anyone with the link can join your watch parties! 🎉

---

## 🚀 **Quick Start (Easiest Method)**

### **Option 1: Use the Script (Recommended)**

Just run this:

```powershell
cd C:\Users\willc\kick-bot\discord-bot
.\start-with-tunnel.ps1
```

**That's it!** The script will:
1. ✅ Start your Discord bot
2. ✅ Create a public tunnel
3. ✅ Show you the public URL

**Example output:**
```
🌐 Creating public tunnel...

🎉 Your watch party is now PUBLIC!

The URL below is accessible from ANYWHERE:

your url is: https://sharp-lions-speak.loca.lt
```

### **Option 2: Manual (Step by Step)**

**Step 1: Start the bot**
```powershell
npm start
```

**Step 2: Start the tunnel (in another terminal)**
```powershell
lt --port 3001
```

**Step 3: Copy the URL**
```
your url is: https://sharp-lions-speak.loca.lt
```

---

## 🔧 **Configuration**

### **Update .env with Public URL**

Edit `discord-bot/.env`:

```env
# Before (local only)
PUBLIC_URL=http://localhost:3001

# After (public access)
PUBLIC_URL=https://sharp-lions-speak.loca.lt
```

**Important:** Replace with YOUR actual tunnel URL!

### **Restart Bot**

After updating `.env`:
```powershell
# Stop bot (Ctrl+C)
# Then restart
npm start
```

Now all watch party links will use your public URL! 🎉

---

## 🌐 **Tunneling Options**

### **Option A: LocalTunnel** ⭐ (Easiest)

**Install:**
```powershell
npm install -g localtunnel
```

**Start:**
```powershell
lt --port 3001
```

**URL:**
```
https://random-words-here.loca.lt
```

**Pros:**
- ✅ Free
- ✅ No account needed
- ✅ Instant setup

**Cons:**
- ⚠️ URL changes every restart
- ⚠️ May show warning page first time

---

### **Option B: Ngrok** 🔥 (Most Popular)

**Install:**
1. Download from https://ngrok.com/download
2. Extract to `C:\ngrok`
3. Sign up (free) at https://dashboard.ngrok.com
4. Get auth token
5. Run: `ngrok config add-authtoken YOUR_TOKEN`

**Start:**
```powershell
ngrok http 3001
```

**URL:**
```
https://abc123.ngrok-free.app
```

**Pros:**
- ✅ Reliable
- ✅ Better performance
- ✅ Custom domains (paid)
- ✅ No warning page

**Cons:**
- ⚠️ Requires account
- ⚠️ URL changes (unless paid)

---

### **Option C: Cloudflare Tunnel** 💼 (Pro)

**Install:**
```powershell
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

**Setup:**
```powershell
cloudflared tunnel login
cloudflared tunnel create watch-party
cloudflared tunnel route dns watch-party watchparty.yourdomain.com
```

**Start:**
```powershell
cloudflared tunnel run watch-party
```

**URL:**
```
https://watchparty.yourdomain.com
```

**Pros:**
- ✅ Permanent URL
- ✅ Custom domain
- ✅ Professional
- ✅ No bandwidth limits

**Cons:**
- ⚠️ Requires domain
- ⚠️ More setup

---

## 📋 **Complete Setup Example**

### **Using LocalTunnel (Recommended for Testing)**

**Step 1: Install**
```powershell
npm install -g localtunnel
```

**Step 2: Start Bot**
```powershell
cd C:\Users\willc\kick-bot\discord-bot
npm start
```

**Step 3: Start Tunnel (New Terminal)**
```powershell
lt --port 3001
```

**You'll see:**
```
your url is: https://brave-cats-jump.loca.lt
```

**Step 4: Update .env**
```env
PUBLIC_URL=https://brave-cats-jump.loca.lt
```

**Step 5: Restart Bot**
```powershell
# Stop with Ctrl+C
npm start
```

**Step 6: Test It!**
```
!kick watchparty bbjess
```

**The link will now be:**
```
https://brave-cats-jump.loca.lt/party/abc123
```

Share this link with ANYONE! 🌍

---

## 🧪 **Testing**

### **Test 1: Can You Access?**

```powershell
# Open the tunnel URL in your browser
start https://your-tunnel-url.loca.lt/party/test
```

✅ **Pass:** Watch party loads

### **Test 2: Can Friends Access?**

```
# Send link to friend
# They open in their browser
```

✅ **Pass:** They can see the watch party

### **Test 3: Discord Integration**

```
# In Discord
!kick watchparty bbjess

# Check the link in embed
```

✅ **Pass:** Link uses public URL

---

## 🚨 **Troubleshooting**

### **LocalTunnel Shows Warning Page**

**Issue:** First-time visitors see a warning

**Solution:** Click "Continue" once

**Disable it (paid feature):** Not available on free tier

---

### **Tunnel URL Changes Every Time**

**Issue:** New URL each time you restart

**Solutions:**

**Option 1: Custom Subdomain (LocalTunnel)**
```powershell
lt --port 3001 --subdomain myparty
# URL: https://myparty.loca.lt
```

**Option 2: Use Ngrok (Persistent)**
```powershell
ngrok http 3001 --domain=your-custom.ngrok-free.app
```

**Option 3: Use Cloudflare (Permanent)**
- Set up custom domain
- Never changes

---

### **Bot Still Uses localhost**

**Issue:** Watch party links show localhost

**Fix:**
1. Update `PUBLIC_URL` in `.env`
2. Restart bot
3. Create new watch party

**Check:**
```powershell
# Look for this in .env
PUBLIC_URL=https://your-tunnel-url.loca.lt
```

---

### **Tunnel Disconnects**

**Issue:** Tunnel stops working after a while

**Solutions:**

**LocalTunnel:**
```powershell
# Restart tunnel
lt --port 3001
```

**Ngrok (More Stable):**
```powershell
# Ngrok rarely disconnects
ngrok http 3001
```

**Auto-Reconnect Script:**
```powershell
# Run in loop
while ($true) {
    lt --port 3001
    Start-Sleep -Seconds 5
}
```

---

### **Firewall Blocking**

**Issue:** Tunnel won't start

**Fix:**
```powershell
# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "Node.js" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

---

## 💡 **Pro Tips**

### **Tip 1: Keep Tunnel Running**

Don't close the tunnel window!

**Use separate terminals:**
- Terminal 1: Bot (`npm start`)
- Terminal 2: Tunnel (`lt --port 3001`)

### **Tip 2: Save Your URL**

When you get a tunnel URL, save it:

```powershell
# Save to file
echo "PUBLIC_URL=https://your-url.loca.lt" >> saved-urls.txt
```

### **Tip 3: Use Custom Subdomain**

LocalTunnel supports custom subdomains:

```powershell
lt --port 3001 --subdomain mywatchparty
# URL: https://mywatchparty.loca.lt
```

**Note:** May not always be available!

### **Tip 4: Monitor Performance**

```powershell
# Check tunnel status
curl https://your-tunnel-url.loca.lt/api/party/test
```

### **Tip 5: Use PM2 for Production**

```powershell
# Install PM2
npm install -g pm2

# Start bot with PM2
pm2 start npm --name "discord-bot" -- start

# Bot runs in background!
```

---

## 🔐 **Security Considerations**

### **Public Access Means:**

- ✅ Anyone with link can join
- ⚠️ No authentication (unless using Kick OAuth)
- ⚠️ Public internet exposure

### **Recommendations:**

1. **Use OAuth for Sensitive Parties**
   - Require Kick login
   - Verify users

2. **Monitor Watch Parties**
   - Check who joins
   - End suspicious parties

3. **Use HTTPS**
   - Tunnels provide this automatically
   - Don't use `http://`

4. **Rate Limiting**
   - Already implemented
   - Prevents abuse

5. **Don't Share Admin Credentials**
   - Keep Discord bot token secret
   - Don't expose `.env` file

---

## 📊 **Comparison**

| Feature | LocalTunnel | Ngrok | Cloudflare |
|---------|-------------|-------|------------|
| **Cost** | Free | Free/Paid | Free |
| **Setup** | 1 minute | 5 minutes | 30 minutes |
| **Stability** | Good | Excellent | Excellent |
| **URL** | Changes | Changes* | Permanent |
| **Speed** | Good | Great | Great |
| **Bandwidth** | Limited | Limited* | Unlimited |
| **Custom Domain** | No | Yes* | Yes |
| **Best For** | Testing | Development | Production |

*With paid plan

---

## ✅ **Quick Reference**

### **Start Everything (LocalTunnel)**

```powershell
# Terminal 1
cd C:\Users\willc\kick-bot\discord-bot
npm start

# Terminal 2
lt --port 3001
```

### **Start Everything (Script)**

```powershell
cd C:\Users\willc\kick-bot\discord-bot
.\start-with-tunnel.ps1
```

### **Update Public URL**

```powershell
# Edit .env
PUBLIC_URL=https://your-tunnel-url.loca.lt

# Restart
npm start
```

### **Test Public Access**

```powershell
# Create watch party
!kick watchparty bbjess

# Share link with anyone!
```

---

## 🎉 **You're Public!**

Your watch parties are now accessible from ANYWHERE! 🌍

**Share links with:**
- ✅ Friends
- ✅ Community
- ✅ Discord servers
- ✅ Social media
- ✅ The whole internet!

**Next Steps:**
1. Start the tunnel
2. Update `.env` with public URL
3. Restart bot
4. Create watch party
5. Share link with everyone! 🚀

---

## 🆘 **Need Help?**

**Check logs:**
```powershell
# Bot logs
npm start

# Tunnel logs
# Shown in terminal where lt is running
```

**Common commands:**
```powershell
# Start tunnel
lt --port 3001

# Start tunnel with custom subdomain
lt --port 3001 --subdomain myparty

# Check if port is in use
netstat -ano | findstr :3001

# Kill process on port
taskkill /PID <process_id> /F
```

**Still stuck?**
- Check `.env` has correct PUBLIC_URL
- Restart bot after changing .env
- Make sure tunnel is running
- Try a different tunneling service

---

## 🚀 **Advanced: Auto-Start on Boot**

Want the tunnel to start automatically?

### **Create Scheduled Task**

1. Open Task Scheduler
2. Create Task
3. Trigger: At startup
4. Action: Start program
5. Program: `powershell.exe`
6. Arguments: `-File "C:\Users\willc\kick-bot\discord-bot\start-with-tunnel.ps1"`

Now tunnel starts when Windows boots! 🎉

---

## 📚 **Learn More**

- **LocalTunnel Docs:** https://theboroer.github.io/localtunnel-www/
- **Ngrok Docs:** https://ngrok.com/docs
- **Cloudflare Tunnel:** https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/

---

## 🎊 **Enjoy Public Watch Parties!**

Your bot is now accessible from anywhere in the world. Share those watch party links far and wide! 🌍✨
