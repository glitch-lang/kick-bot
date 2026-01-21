# 🚀 VPS Deployment Guide - CrossTalk Voice Streaming

## Overview

Deploy the Discord bot to a VPS for 24/7 voice streaming capabilities. This guide covers Ubuntu/Debian Linux VPS setup.

---

## 🎯 **Why Deploy to VPS?**

### Current Setup (Local Windows):
```
❌ Bot only runs when your PC is on
❌ Streaming stops if you close laptop
❌ Can't stream 24/7
❌ Limited by home internet
```

### VPS Setup (Cloud Server):
```
✅ 24/7 uptime
✅ Always ready to stream
✅ Better internet speeds
✅ Can handle multiple simultaneous streams
✅ No impact on your PC
```

---

## 💰 **VPS Requirements & Cost**

### Minimum Requirements (Fast Mode Only):
```
CPU: 2 cores
RAM: 2GB
Storage: 10GB SSD
Bandwidth: Unlimited or 1TB+
OS: Ubuntu 22.04 or Debian 12

Cost: $5-10/month
Providers: Hetzner, DigitalOcean, Linode, Vultr
```

### Recommended (Fast + Browser Mode):
```
CPU: 4 cores
RAM: 8GB
Storage: 20GB SSD
Bandwidth: Unlimited or 2TB+
OS: Ubuntu 22.04 or Debian 12

Cost: $15-25/month
Providers: Hetzner CX31, DigitalOcean Droplet
```

---

## 📋 **VPS Provider Recommendations**

### Budget Option ($5/mo):
**Hetzner Cloud CX21**
- 2 vCPU
- 4GB RAM
- 40GB SSD
- 20TB bandwidth
- ✅ Best value for money
- ✅ Excellent network

### Mid-Tier ($12/mo):
**DigitalOcean Basic Droplet**
- 2 vCPU
- 4GB RAM
- 80GB SSD
- 4TB bandwidth
- ✅ Easy to set up
- ✅ Great documentation

### Premium ($24/mo):
**Hetzner CX31**
- 2 vCPU
- 8GB RAM
- 80GB SSD
- 20TB bandwidth
- ✅ Handles multiple streams
- ✅ Browser mode + fast mode

---

## 🛠️ **Step-by-Step Deployment**

### **Step 1: Provision VPS**

1. **Sign up** for Hetzner/DigitalOcean/Linode
2. **Create server:**
   - OS: Ubuntu 22.04 LTS
   - Location: Closest to your users
   - SSH Key: Add your public key

3. **Note down:**
   - Server IP address
   - Root password (if applicable)

---

### **Step 2: Initial Server Setup**

SSH into your server:
```bash
ssh root@YOUR_SERVER_IP
```

Update system:
```bash
apt update && apt upgrade -y
```

Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # Should show v20.x
npm -v   # Should show v10.x
```

Install FFmpeg:
```bash
apt install -y ffmpeg
ffmpeg -version  # Verify installation
```

Install Chromium (for browser mode):
```bash
apt install -y chromium-browser
chromium-browser --version
```

Install Git:
```bash
apt install -y git
```

---

### **Step 3: Clone Your Bot**

```bash
cd /opt
git clone https://github.com/glitch-lang/kick-bot.git
cd kick-bot/discord-bot
```

---

### **Step 4: Install Dependencies**

```bash
npm install
```

**Note:** On Linux, some native modules compile during install. This is normal and may take 2-3 minutes.

---

### **Step 5: Configure Environment**

Create `.env` file:
```bash
nano .env
```

Add your configuration:
```env
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
DISCORD_CLIENT_ID=YOUR_CLIENT_ID
KICK_BOT_API_URL=https://web-production-56232.up.railway.app
NODE_ENV=production
```

Save and exit (Ctrl+X, Y, Enter)

---

### **Step 6: Build the Bot**

```bash
npm run build
```

Test run:
```bash
npm start
```

You should see:
```
✅ Discord bot database initialized
✅ Discord bot logged in as Kick Party#4763
📡 Connected to 1 servers
```

If it works, press Ctrl+C to stop.

---

### **Step 7: Set Up PM2 (Process Manager)**

Install PM2:
```bash
npm install -g pm2
```

Start bot with PM2:
```bash
pm2 start npm --name "crosstalk-discord" -- start
```

Save PM2 config:
```bash
pm2 save
pm2 startup  # Follow the instructions it gives you
```

---

### **Step 8: Verify Deployment**

Check bot status:
```bash
pm2 status
```

View logs:
```bash
pm2 logs crosstalk-discord
```

Monitor resources:
```bash
pm2 monit
```

---

## 🔄 **Updating the Bot**

When you push updates to GitHub:

```bash
cd /opt/kick-bot/discord-bot
git pull
npm install  # If dependencies changed
npm run build
pm2 restart crosstalk-discord
```

---

## 🔐 **Security Best Practices**

### 1. Create Non-Root User
```bash
adduser crosstalk
usermod -aG sudo crosstalk
su - crosstalk
```

### 2. Set Up Firewall
```bash
ufw allow 22/tcp  # SSH
ufw enable
```

### 3. Secure SSH
```bash
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
systemctl restart sshd
```

### 4. Keep System Updated
```bash
# Set up auto-updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 **Monitoring & Maintenance**

### Check Bot Status:
```bash
pm2 status
```

### View Real-Time Logs:
```bash
pm2 logs crosstalk-discord --lines 100
```

### Restart Bot:
```bash
pm2 restart crosstalk-discord
```

### Stop Bot:
```bash
pm2 stop crosstalk-discord
```

### Delete Bot from PM2:
```bash
pm2 delete crosstalk-discord
```

### Check Resource Usage:
```bash
htop  # Install with: apt install htop
# Or
pm2 monit
```

---

## 🚨 **Troubleshooting VPS Deployment**

### Bot Won't Start

**Check logs:**
```bash
pm2 logs crosstalk-discord
```

**Common issues:**
1. Missing `.env` file → Create it
2. Wrong Node version → Update to v20+
3. Missing dependencies → Run `npm install`
4. Database permissions → Run as correct user

---

### High CPU Usage

**Cause:** Multiple streams or browser mode

**Solutions:**
1. Limit concurrent streams
2. Use fast mode instead of browser mode
3. Upgrade VPS to more CPU cores

---

### Bot Crashes / Restarts

**Check crash logs:**
```bash
pm2 logs crosstalk-discord --err
```

**Enable auto-restart:**
```bash
pm2 start npm --name "crosstalk-discord" -- start --max-restarts 10
```

---

### FFmpeg Issues on Linux

**Install additional codecs:**
```bash
apt install -y ffmpeg libavcodec-extra libopus0
```

**Test FFmpeg:**
```bash
ffmpeg -i "https://test.m3u8" -f null -
```

---

## 🎮 **Testing After Deployment**

Once deployed, test from Discord:

### Test 1: Fast Mode
```
!kick stream bbjess
```

### Test 2: Browser Mode
```
!kick browserstream bbjess
```

### Test 3: Multiple Streams
```
Server 1: !kick stream bbjess
Server 2: !kick stream realglitchdyeet
```

### Test 4: Stop Stream
```
!kick stopstream
```

---

## 📈 **Performance Optimization**

### For Fast Mode Only (Low Budget):
```bash
# Reduce Chromium installation
apt remove chromium-browser
# Save ~500MB RAM
```

### For High Traffic:
```bash
# Increase file descriptors
ulimit -n 4096

# Optimize PM2
pm2 start npm --name "crosstalk-discord" -- start \
  --max-memory-restart 1G \
  --exp-backoff-restart-delay=100
```

### For Multiple Streams:
```bash
# Upgrade VPS to:
- 4+ CPU cores
- 8GB+ RAM
- Enable swap:
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
```

---

## 🔗 **Auto-Deploy from GitHub**

Set up webhook for auto-deployment:

Create update script:
```bash
nano /opt/update-bot.sh
```

Add:
```bash
#!/bin/bash
cd /opt/kick-bot/discord-bot
git pull
npm install
npm run build
pm2 restart crosstalk-discord
```

Make executable:
```bash
chmod +x /opt/update-bot.sh
```

Run after git push:
```bash
/opt/update-bot.sh
```

---

## 📊 **Resource Usage Estimates**

### Fast Mode (Per Stream):
```
CPU: 10-20% per stream
RAM: 50-100MB per stream
Bandwidth: 128kbps upload
```

### Browser Mode (Per Stream):
```
CPU: 30-50% per stream
RAM: 200-400MB per stream
Bandwidth: 128kbps upload
```

### Concurrent Streams:

| VPS | Fast Mode | Browser Mode |
|-----|-----------|--------------|
| 2GB RAM | 4-6 streams | 1-2 streams |
| 4GB RAM | 8-12 streams | 3-4 streams |
| 8GB RAM | 15-20 streams | 6-8 streams |

---

## ✅ **Deployment Checklist**

Before going live:

- [ ] VPS provisioned and accessible
- [ ] Node.js v20+ installed
- [ ] FFmpeg installed and working
- [ ] Chromium installed (if using browser mode)
- [ ] Git repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` configured with tokens
- [ ] Bot builds successfully (`npm run build`)
- [ ] PM2 configured and bot running
- [ ] PM2 startup configured
- [ ] Firewall configured
- [ ] Bot appears online in Discord
- [ ] Test commands work (`!kick help`)
- [ ] Voice streaming tested (`!kick stream`)

---

## 🆘 **Support & Help**

### Useful Commands:

```bash
# Check if bot is running
pm2 status

# View last 100 log lines
pm2 logs crosstalk-discord --lines 100

# Follow logs in real-time
pm2 logs crosstalk-discord --raw

# Restart bot
pm2 restart crosstalk-discord

# Check system resources
htop

# Check disk space
df -h

# Check network
netstat -tulpn | grep node
```

---

## 🎉 **You're Ready!**

After following this guide:
- ✅ Bot runs 24/7 on VPS
- ✅ Automatic restarts on crashes
- ✅ Can stream to multiple Discord servers
- ✅ Low latency audio streaming
- ✅ Browser mode as fallback

**Enjoy your production-ready CrossTalk bot!** 🚀
